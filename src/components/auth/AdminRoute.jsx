import { Roles } from "../../types/roles";
import RoleRoute from "./RoleRoute";

export default function AdminRoute({ children }) {
  return (
    <RoleRoute allowedRoles={[Roles.Admin]}>
      {children}
    </RoleRoute>
  );
}
