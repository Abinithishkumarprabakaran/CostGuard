import { requireRole, requireOrg } from "@/lib/rbac";

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  await requireOrg();
  await requireRole("org:owner");
  return <>{children}</>;
}
