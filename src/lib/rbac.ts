import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { type OrganizationRole, hasMinimumRole } from "./roles";

/**
 * Retrieves the currently active organization and user info from Clerk.
 */
export async function getCurrentUser() {
  const { userId, orgId, orgRole, sessionClaims } = await auth();
  return { userId, orgId, orgRole: orgRole as OrganizationRole | undefined, sessionClaims };
}

/**
 * Utility to verify if the active user holds at least the required role
 * within their currently selected organization.
 * 
 * If the user does not have the required permission level (or isn't in an org),
 * it returns false.
 */
export async function hasRole(minimumRole: OrganizationRole): Promise<boolean> {
  const { orgId, orgRole } = await auth();

  if (!orgId || !orgRole) {
    return false;
  }

  return hasMinimumRole(orgRole, minimumRole);
}

/**
 * Middleware-like helper for Server Components. 
 * Checks if the user has the required role. If not, it redirects them
 * to the root dashboard (or another specified fallback URL).
 * 
 * Example usage:
 * `await requireRole("org:admin")`
 */
export async function requireRole(minimumRole: OrganizationRole, fallbackRedirect = "/") {
  const hasAccess = await hasRole(minimumRole);
  if (!hasAccess) {
    redirect(fallbackRedirect);
  }
}

/**
 * Checks if the current user is an Owner or Admin.
 * Useful for UI conditional rendering.
 */
export async function isAdminOrOwner(): Promise<boolean> {
  return hasRole("org:admin");
}

/**
 * Enforces that a user is part of an organization.
 * Used for routes that require org context (most B2B SaaS routes).
 */
export async function requireOrg() {
  const { orgId } = await auth();
  if (!orgId) {
    // In a real app, redirect to a specific onboarding or "Select Organization" page
    redirect("/");
  }
  return orgId;
}
