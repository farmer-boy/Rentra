import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Role ke hisaab se redirect karo
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'LANDLORD') return <Navigate to="/landlord" replace />;
    return <Navigate to="/tenant" replace />;
  }

  return <>{children}</>;
}
