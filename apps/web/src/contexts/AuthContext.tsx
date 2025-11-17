import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type UserRole = 'fan' | 'creator' | 'admin';

interface AuthUser {
  role: UserRole;
  email: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (params: { role: UserRole; email: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login: AuthContextValue['login'] = ({ role, email }) => {
    const localPart = email.split('@')[0] || role;
    const normalized = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || role;

    setUser({
      role,
      email,
      username: normalized,
    });
  };

  const logout = () => setUser(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user],
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
