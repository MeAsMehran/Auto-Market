import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Optimistic render: if a token exists in storage we render the protected
  // page immediately (instead of blocking on the auth round-trip). Auth is
  // still revalidated in the background by AuthContext; if it fails, the user
  // is bounced to /login by the global 401 handler. Only when there is no
  // token at all do we show the spinner / redirect.
  const hasToken = typeof window !== 'undefined' && window.localStorage.getItem('access_token');

  if (loading && !hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
