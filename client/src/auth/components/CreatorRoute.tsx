import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth-store';

export default function CreatorRoute() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
