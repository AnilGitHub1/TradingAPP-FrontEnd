import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
