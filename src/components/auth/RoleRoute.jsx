import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleRoute({
  children,
  allowedRoles = [],
  allowAnonymous = false,
}) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!allowAnonymous && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const hasAllowedRole =
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => hasRole?.(role));

  if (!hasAllowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
