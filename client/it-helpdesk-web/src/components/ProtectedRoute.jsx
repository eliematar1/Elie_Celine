import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.some((r) => user.roles?.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
