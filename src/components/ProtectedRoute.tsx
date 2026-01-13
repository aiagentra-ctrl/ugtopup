import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login-required" replace />;
  }

  return <>{children}</>;
};
