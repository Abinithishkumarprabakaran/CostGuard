import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "all";
  
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`alerts-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: accounts } = await supabase.from("aws_accounts").select("id").eq("user_id", userRow.id);
  if (!accounts || accounts.length === 0) return NextResponse.json([], { status: 200 });

  const accountIds = accounts.map(a => a.id);

  let query = supabase
    .from("spike_alerts")
    .select(`
      id,
      service,
      date,
      daily_cost,
      avg_7d_cost,
      delta_pct,
      delta_usd,
      ai_explanation,
      ai_fix,
      resolved,
      created_at,
      aws_accounts(account_alias)
    `)
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });

  if (statusFilter === "open") query = query.eq("resolved", false);
  if (statusFilter === "resolved") query = query.eq("resolved", true);

  const { data: alerts } = await query;
  return NextResponse.json(alerts ?? [], { status: 200 });
}
