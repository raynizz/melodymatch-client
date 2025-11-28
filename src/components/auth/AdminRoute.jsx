import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Roles } from "../../types/roles";

export default function AdminRoute({ children }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole?.(Roles.Admin)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
