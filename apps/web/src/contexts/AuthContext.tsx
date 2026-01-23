import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthError, User } from '@supabase/supabase-js';
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

interface OAuthRedirectParams {
  redirectTo?: string;
  role?: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: { email: string; password: string }) => Promise<AuthUser>;
  signup: (params: { email: string; password: string; role: UserRole }) => Promise<AuthUser>;
  loginWithGoogle: (params?: OAuthRedirectParams) => Promise<void>;
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

interface ProfileRow {
  username: string;
  creator_profile_status?: 'pending' | 'approved' | 'rejected';
}

export const buildUsername = (email: string) => {
  const localPart = email.split('@')[0] || '';
  const normalized = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return normalized || 'user';
};

const buildAuthRedirectUrl = ({ redirectTo, role }: OAuthRedirectParams = {}) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const url = new URL('/auth/callback', window.location.origin);

  if (redirectTo && redirectTo.startsWith('/')) {
    url.searchParams.set('redirect', redirectTo);
  }

  if (role) {
    url.searchParams.set('role', role);
  }

  return url.toString();
};

const toAuthUser = (row: DbUser, profile?: ProfileRow | null): AuthUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  username: profile?.username || buildUsername(row.email),
  user_metadata: undefined,
  creatorProfileStatus: profile?.creator_profile_status || row.creator_profile_status,
});

const toFallbackAuthUser = (authUser: User): AuthUser => {
  const role = (authUser.user_metadata?.role as UserRole) ?? 'fan';
  const email = authUser.email ?? (authUser.user_metadata?.email as string) ?? 'unknown@fanmeet.app';

  return {
    id: authUser.id,
    email,
    role,
    username: buildUsername(email),
    user_metadata: authUser.user_metadata,
  };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SIGNUP_RETRYABLE_STATUS = new Set([429, 503]);
const MAX_SIGNUP_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4000;

const ensureUserRow = async (authUser: User, fallbackRole?: UserRole): Promise<DbUser> => {
  const { data, error } = await supabase
    .from('users')
    .select('id,email,role,creator_profile_status')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return data as DbUser;
  }

  const inferredRole = (authUser.user_metadata?.role as UserRole) ?? fallbackRole ?? 'fan';
  const email = authUser.email ?? (authUser.user_metadata?.email as string) ?? 'unknown@fanmeet.app';

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email,
      role: inferredRole,
    })
    .select('id,email,role,creator_profile_status')
    .single();

  if (insertError || !inserted) {
    throw insertError ?? new Error('Could not create user record.');
  }

  return inserted as DbUser;
};

const ensureProfileRow = async (authUser: User, dbUser: DbUser): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, creator_profile_status')
    .eq('user_id', dbUser.id)
    .maybeSingle();

  if (!error && data) {
    return data as ProfileRow;
  }

  const username = buildUsername(authUser.email ?? dbUser.email);
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: dbUser.id,
      username,
      display_name: displayName,
      creator_profile_status: dbUser.role === 'creator' ? 'pending' : undefined,
    })
    .select('username, creator_profile_status')
    .single();

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error('Failed to create profile row:', insertError);
    return null;
  }

  return inserted as ProfileRow;
};

const resolveAuthUser = async (authUser: User, fallbackRole?: UserRole) => {
  const dbUser = await ensureUserRow(authUser, fallbackRole);
  const profileRow = await ensureProfileRow(authUser, dbUser);
  return toAuthUser(dbUser, profileRow);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateUserInBackground = (authUser: User, fallbackRole?: UserRole) => {
      resolveAuthUser(authUser, fallbackRole)
        .then((resolvedUser) => {
          if (!cancelled) {
            setUser(resolvedUser);
          }
        })
        .catch((error) => {
          console.warn('[AuthContext] Background hydration failed, retrying...', error);
          setTimeout(() => {
            if (!cancelled) {
              hydrateUserInBackground(authUser, fallbackRole);
            }
          }, 2000);
        });
    };

    const loadUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          return;
        }

        setUser(toFallbackAuthUser(authUser));
        hydrateUserInBackground(authUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const authUser = session?.user;
        if (authUser) {
          setUser(toFallbackAuthUser(authUser));
          hydrateUserInBackground(authUser);
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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

    const fallbackUser = toFallbackAuthUser(data.user);
    setUser(fallbackUser);
    return fallbackUser;
  };

  const signup: AuthContextValue['signup'] = async ({ email, password, role }) => {
    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    let authUser: User | null = null;
    let lastError: AuthError | null = null;

    for (let attempt = 1; attempt <= MAX_SIGNUP_ATTEMPTS; attempt += 1) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { role },
        },
      });

      if (!error && data.user) {
        authUser = data.user;
        break;
      }

      lastError = error;
      const status = error?.status ?? 0;

      if (!SIGNUP_RETRYABLE_STATUS.has(status) || attempt === MAX_SIGNUP_ATTEMPTS) {
        break;
      }

      const waitTime = RETRY_DELAY_MS * attempt;
      // eslint-disable-next-line no-console
      console.warn(`Signup rate limited (attempt ${attempt}). Retrying in ${waitTime}ms.`);
      await delay(waitTime);
    }

    if (!authUser) {
      if (lastError?.status === 429) {
        throw new Error('Too many signup attempts in a short time. Please wait ~30 seconds and try again.');
      }
      throw new Error(lastError?.message ?? 'Could not create account.');
    }

    const username = buildUsername(email);
    const pendingProfile: ProfileRow = {
      username,
      creator_profile_status: role === 'creator' ? 'pending' : undefined,
    };

    const pendingUser = toAuthUser(
      { id: authUser.id, email: authUser.email ?? email, role },
      pendingProfile,
    );

    if (!authUser.email_confirmed_at) {
      return pendingUser;
    }

    try {
      const resolvedUser = await resolveAuthUser(authUser, role);
      setUser(resolvedUser);
      return resolvedUser;
    } catch (error) {
      console.error('Failed to finalize signup profile:', error);
      setUser(pendingUser);
      return pendingUser;
    }
  };

  const loginWithGoogle: AuthContextValue['loginWithGoogle'] = async (params) => {
    const redirectTo = buildAuthRedirectUrl(params);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Could not start Google sign-in.');
    }
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
      loginWithGoogle,
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
