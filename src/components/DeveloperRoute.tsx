import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeveloperRouteProps {
  children: React.ReactNode;
}

export const DeveloperRoute = ({ children }: DeveloperRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const [isDeveloper, setIsDeveloper] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDeveloper = async () => {
      if (!user || !isAuthenticated) {
        setIsDeveloper(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_developer' as any);
        setIsDeveloper(!error && data === true);
      } catch {
        setIsDeveloper(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDeveloper();
  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying developer access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isDeveloper) return <Navigate to="/" replace />;

  return <>{children}</>;
};
