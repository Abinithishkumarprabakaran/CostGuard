import { requireRole, requireOrg } from "@/lib/rbac";

export default async function OptimizationLayout({ children }: { children: React.ReactNode }) {
  await requireOrg();
  await requireRole("org:member");
  return <>{children}</>;
}
