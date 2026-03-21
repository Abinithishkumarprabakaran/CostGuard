import { requireRole, requireOrg } from "@/lib/rbac";

export default async function AccountsLayout({ children }: { children: React.ReactNode }) {
  await requireOrg();
  await requireRole("org:admin");
  return <>{children}</>;
}
