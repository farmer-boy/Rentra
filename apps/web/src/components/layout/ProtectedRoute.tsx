import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../api/types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: Array<NonNullable<User['role']>>;
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) {
    return <div role="status" className="p-6 text-center">Restoring your session…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles: Array<NonNullable<User['role']>> = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  if (userRoles.includes('ADMIN') && !allowedRoles?.includes('ADMIN')) {
    return <Navigate to="/admin" replace />;
  }

  if (allowedRoles && user && !allowedRoles.some((role) => userRoles.includes(role))) {
    if (userRoles.includes('ADMIN')) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
