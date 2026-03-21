export type OrganizationRole = "org:owner" | "org:admin" | "org:member" | "org:viewer";

export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  "org:owner": 4,
  "org:admin": 3,
  "org:member": 2,
  "org:viewer": 1,
};

export function hasMinimumRole(userRole: string | undefined | null, minimumRole: OrganizationRole): boolean {
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole as OrganizationRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= requiredLevel;
}
