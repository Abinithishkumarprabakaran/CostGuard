import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`optimization-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // In a real implementation we would fetch the snapshots and apply heuristics.
  // Returning the expected mock format as specified.
  const recommendations = [
    {
      category: "Compute",
      items: [
        {
          title: "Terminate idle EC2 instances",
          resource: "i-0a1b2c3d4e5f6g7h8 (us-west-2)",
          savings: "$134.50",
          effort: "Low",
          risk: "Low",
        },
        {
          title: "Right-size underutilized instances",
          resource: "worker-pool-asg",
          savings: "$420.00",
          effort: "Medium",
          risk: "High",
        }
      ]
    },
    {
      category: "Storage",
      items: [
        {
          title: "Delete unattached EBS volumes",
          resource: "8 orphaned volumes found",
          savings: "$98.20",
          effort: "Low",
          risk: "Low",
        }
      ]
    }
  ];

  return NextResponse.json(recommendations, { status: 200 });
}
