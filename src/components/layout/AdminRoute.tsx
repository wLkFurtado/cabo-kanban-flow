import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminRoute({ children, redirectTo = '/' }: AdminRouteProps) {
  const { isAdmin, loading } = useAdminRole();
  const navigate = useNavigate();

  // Keep user on the page and show message instead of redirecting immediately.
  // This improves UX and helps debug role detection issues.
  useEffect(() => {
    // Intentionally not redirecting to avoid the appearance of "nada acontece".
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Acesso restrito</h2>
          <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}