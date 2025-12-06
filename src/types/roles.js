export const Roles = {
  Admin: "Admin",
  Dater: "Dater",
};

export function isRoleMatch(userRoles = [], role) {
  if (!role) return false;
  const target = role.toLowerCase();
  return userRoles.some((item) =>
    (item ?? "").toString().toLowerCase() === target
  );
}
