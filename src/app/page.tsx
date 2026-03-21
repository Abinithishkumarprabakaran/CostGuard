import { auth } from "@clerk/nextjs/server"
import { DashboardClient } from "@/components/dashboard/DashboardClient"
import { LandingPage } from "@/components/landing/LandingPage"

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    return <DashboardClient />;
  }

  return <LandingPage />;
}

