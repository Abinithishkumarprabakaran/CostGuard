import { auth } from "@clerk/nextjs/server"
import { DashboardClient } from "@/components/dashboard/DashboardClient"
import { LandingPage } from "@/components/landing/LandingPage"
import { redirect } from "next/navigation"
import { createAdminSupabaseClient } from "@/lib/supabase-admin"

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    const supabase = createAdminSupabaseClient();
    const { count } = await supabase
      .from("aws_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count === 0) {
      redirect("/onboarding");
    }

    return <DashboardClient />;
  }

  return <LandingPage />;
}

