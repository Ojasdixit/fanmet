import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'fan' | 'creator' | 'admin';

interface AuthUser {
  user_metadata: any;
  id: string;
  role: UserRole;
  email: string;
  username: string;
  creatorProfileStatus?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: { email: string; password: string }) => Promise<AuthUser>;
  signup: (params: { email: string; password: string; role: UserRole }) => Promise<AuthUser>;
  sendPasswordResetEmail: (params: { email: string; redirectTo?: string }) => Promise<void>;
  resendVerificationEmail: (params: { email: string; redirectTo?: string }) => Promise<void>;
  logout: () => Promise<void>;
  onlineUsers: Set<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface DbUser {
  id: string;
  email: string;
  role: UserRole;
  creator_profile_status?: 'pending' | 'approved' | 'rejected';
}

export const buildUsername = (email: string) => {
  const localPart = email.split('@')[0] || '';
  const normalized = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return normalized || 'user';
};

const toAuthUser = (row: DbUser, profile?: any): AuthUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  username: profile?.username || buildUsername(row.email),
  user_metadata: undefined,
  creatorProfileStatus: profile?.creator_profile_status || row.creator_profile_status,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id,email,role,creator_profile_status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!userError && userData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, creator_profile_status')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser(toAuthUser(userData as DbUser, profileData));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, []);

  const login: AuthContextValue['login'] = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new Error('Invalid email or password.');
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('Please verify your email before logging in.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,role,creator_profile_status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('No profile found for this account.');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, creator_profile_status')
      .eq('user_id', data.user.id)
      .maybeSingle();

    const nextUser = toAuthUser(profile as DbUser, profileData);
    setUser(nextUser);
    return nextUser;
  };

  const signup: AuthContextValue['signup'] = async ({ email, password, role }) => {
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Could not create account.');
    }

    const authUser = data.user;

    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email,
      role,
    });

    if (insertError) {
      throw new Error(insertError.message ?? 'Could not create profile.');
    }

    // Create entry in profiles table as well
    const username = buildUsername(email);
    const displayName = username.charAt(0).toUpperCase() + username.slice(1); // Capitalize first letter
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authUser.id,
      username,
      display_name: displayName,
      creator_profile_status: role === 'creator' ? 'pending' : undefined
    });

    if (profileError) {
      console.error('Error creating public profile:', profileError);
      // We don't throw here to allow login to proceed, but it's not ideal
    }

    const nextUser = toAuthUser(
      { id: authUser.id, email: authUser.email ?? email, role },
      { username, creator_profile_status: role === 'creator' ? 'pending' : undefined },
    );

    // If email confirmation is required, Supabase may not create a session until verified.
    // We still return the user so the UI can show a "check your email" message.
    if (authUser.email_confirmed_at) {
      setUser(nextUser);
    }

    return nextUser;
  };

  const sendPasswordResetEmail: AuthContextValue['sendPasswordResetEmail'] = async ({
    email,
    redirectTo,
  }) => {
    const nextRedirectTo =
      redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: nextRedirectTo,
    });

    if (error) {
      throw new Error(error.message || 'Could not send password reset email.');
    }
  };

  const resendVerificationEmail: AuthContextValue['resendVerificationEmail'] = async ({
    email,
    redirectTo,
  }) => {
    // Supabase v2 supports resend for signup confirmations.
    const nextRedirectTo =
      redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

    const authAny = supabase.auth as any;
    const { error } = await authAny.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: nextRedirectTo },
    });

    if (error) {
      throw new Error(error.message || 'Could not resend verification email.');
    }
  };

  const logout: AuthContextValue['logout'] = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  };

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = new Set<string>();

        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) users.add(p.user_id);
          });
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      sendPasswordResetEmail,
      resendVerificationEmail,
      logout,
      onlineUsers,
    }),
    [isLoading, user, onlineUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
