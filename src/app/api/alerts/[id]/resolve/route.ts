import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`alerts-patch-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;

  try {
    const supabase = createAdminSupabaseClient();

    // Verify ownership
    const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: accounts } = await supabase.from("aws_accounts").select("id").eq("user_id", userRow.id);
    const accountIds = accounts?.map(a => a.id) ?? [];

    const { data: alert } = await supabase.from("spike_alerts").select("account_id").eq("id", id).single();
    if (!alert || !accountIds.includes(alert.account_id)) {
      return NextResponse.json({ error: "Alert not found or access denied" }, { status: 404 });
    }

    const { error } = await supabase
      .from("spike_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: "Failed to resolve alert" }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
