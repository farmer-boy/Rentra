import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) {
    return <div role="status" className="p-6 text-center">Restoring your session…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  if (allowedRoles && user && !allowedRoles.some((role) => userRoles.includes(role as any))) {
    if (userRoles.includes('ADMIN')) return <Navigate to="/admin" replace />;
    if (userRoles.includes('LANDLORD')) return <Navigate to="/landlord" replace />;
    return <Navigate to="/tenant" replace />;
  }

  return <>{children}</>;
}
