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
  logout: () => Promise<void>;
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

const toAuthUser = (row: DbUser): AuthUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  username: buildUsername(row.email),
  user_metadata: undefined,
  creatorProfileStatus: row.creator_profile_status,
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

        const { data, error } = await supabase
          .from('users')
          .select('id,email,role,creator_profile_status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!error && data) {
          setUser(toAuthUser(data as DbUser));
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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,role,creator_profile_status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('No profile found for this account.');
    }

    const nextUser = toAuthUser(profile as DbUser);
    setUser(nextUser);
    return nextUser;
  };

  const signup: AuthContextValue['signup'] = async ({ email, password, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
    });

    if (profileError) {
      console.error('Error creating public profile:', profileError);
      // We don't throw here to allow login to proceed, but it's not ideal
    }

    const nextUser = toAuthUser({ id: authUser.id, email: authUser.email ?? email, role });
    setUser(nextUser);
    return nextUser;
  };

  const logout: AuthContextValue['logout'] = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }),
    [isLoading, user],
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
