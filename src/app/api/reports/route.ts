import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`reports-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: accounts } = await supabase.from("aws_accounts").select("id").eq("user_id", userRow.id);
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ monthlyData: [], forecastCurrentMonth: 0, budgetCurrentMonth: 0, keyTakeaways: [] });
  }

  const accountIds = accounts.map((a: any) => a.id);
  const now = new Date();

  // Build last 6 months date ranges
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0],
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  });

  const { data: snapshots } = await supabase
    .from("cost_snapshots")
    .select("date, blended_cost")
    .in("account_id", accountIds)
    .gte("date", months[0].start)
    .lte("date", months[5].end);

  const monthlyData = months.map((m) => {
    const cost = (snapshots || [])
      .filter((s: any) => s.date >= m.start && s.date <= m.end)
      .reduce((sum: number, s: any) => sum + Number(s.blended_cost), 0);
    return { month: m.label, cost: Number(cost.toFixed(2)), budget: 12000 };
  });

  const currentMonth = monthlyData[5];
  const prevMonth = monthlyData[4];
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecastCurrentMonth = daysElapsed > 0 ? Number(((currentMonth.cost / daysElapsed) * daysInMonth).toFixed(2)) : 0;

  const keyTakeaways = [];
  if (prevMonth.cost > 0) {
    const pct = (((currentMonth.cost - prevMonth.cost) / prevMonth.cost) * 100).toFixed(1);
    keyTakeaways.push({
      type: Number(pct) >= 0 ? "increase" : "saving",
      title: `Spend ${Number(pct) >= 0 ? "up" : "down"} ${Math.abs(Number(pct))}% vs last month`,
      description: `${prevMonth.month}: $${prevMonth.cost.toLocaleString()} → ${currentMonth.month}: $${currentMonth.cost.toLocaleString()}`,
    });
  }

  return NextResponse.json({
    monthlyData,
    forecastCurrentMonth,
    budgetCurrentMonth: 12000,
    keyTakeaways,
  });
}
