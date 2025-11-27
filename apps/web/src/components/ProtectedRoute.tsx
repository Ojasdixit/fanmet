import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth, type UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome: Record<UserRole, string> = {
      fan: '/fan',
      creator: '/creator',
      admin: '/admin',
    };

    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
};
