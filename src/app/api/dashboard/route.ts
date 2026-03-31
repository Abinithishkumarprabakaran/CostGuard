import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`dashboard-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: accounts } = await supabase.from("aws_accounts").select("id").eq("user_id", userRow.id);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      noAccountsConnected: true,
      currentMonthSpend: 0,
      lastMonthSpend: 0,
      percentChange: 0,
      forecastedSpend: 0,
      activeAnomalies: 0,
      potentialSavings: 0,
      costOverTime: [],
      spendByService: [],
      topCostDrivers: [],
      recentAnomalies: [],
    }, { status: 200 });
  }

  const accountIds = accounts.map(a => a.id);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  // Current month snapshots
  const { data: currentSnapshots } = await supabase
    .from("cost_snapshots")
    .select("date, service, blended_cost")
    .in("account_id", accountIds)
    .gte("date", currentMonthStart)
    .lte("date", today);

  // Last month snapshots
  const { data: lastSnapshots } = await supabase
    .from("cost_snapshots")
    .select("blended_cost")
    .in("account_id", accountIds)
    .gte("date", lastMonthStart)
    .lte("date", lastMonthEnd);

  // Last 30 days for chart
  const { data: thirtyDaySnapshots } = await supabase
    .from("cost_snapshots")
    .select("date, blended_cost")
    .in("account_id", accountIds)
    .gte("date", thirtyDaysAgo)
    .lte("date", today)
    .order("date", { ascending: true });

  // Active alerts
  const { data: activeAlerts } = await supabase
    .from("spike_alerts")
    .select("service, delta_pct, ai_explanation, aws_accounts(account_alias)")
    .in("account_id", accountIds)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const currentMonthSpend = (currentSnapshots || []).reduce((sum: number, s: any) => sum + Number(s.blended_cost), 0);
  const lastMonthSpend = (lastSnapshots || []).reduce((sum: number, s: any) => sum + Number(s.blended_cost), 0);
  const percentChange = lastMonthSpend > 0 ? Number((((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1)) : 0;
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecastedSpend = daysElapsed > 0 ? Number(((currentMonthSpend / daysElapsed) * daysInMonth).toFixed(2)) : 0;

  // Cost over time (group by date)
  const dailyMap: Record<string, number> = {};
  (thirtyDaySnapshots || []).forEach((s: any) => {
    dailyMap[s.date] = (dailyMap[s.date] || 0) + Number(s.blended_cost);
  });
  const costOverTime = Object.entries(dailyMap).map(([date, cost]) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cost: Number(cost.toFixed(2)),
  }));

  // Spend by service (current month)
  const serviceMap: Record<string, number> = {};
  (currentSnapshots || []).forEach((s: any) => {
    serviceMap[s.service] = (serviceMap[s.service] || 0) + Number(s.blended_cost);
  });
  const colors = ["#5B6CFF", "#7C8CFF", "#22C55E", "#F59E0B", "#EF4444", "#E6E8F0"];
  const spendByService = Object.entries(serviceMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value: Number(value.toFixed(2)), color: colors[i] || "#E6E8F0" }));

  // Top cost drivers
  const topCostDrivers = spendByService.slice(0, 4).map((s) => ({
    service: s.name,
    cost: `$${s.value.toFixed(2)}`,
    percent: currentMonthSpend > 0 ? `${((s.value / currentMonthSpend) * 100).toFixed(0)}%` : "0%",
    trend: "+0.0%",
  }));

  return NextResponse.json({
    noAccountsConnected: false,
    currentMonthSpend: Number(currentMonthSpend.toFixed(2)),
    lastMonthSpend: Number(lastMonthSpend.toFixed(2)),
    percentChange,
    forecastedSpend,
    activeAnomalies: activeAlerts?.length || 0,
    potentialSavings: 0,
    costOverTime,
    spendByService,
    topCostDrivers,
    recentAnomalies: (activeAlerts || []).map((a: any) => ({
      service: a.service,
      account: a.aws_accounts?.account_alias || "Unknown",
      increase: `+${Number(a.delta_pct).toFixed(0)}%`,
      severity: Number(a.delta_pct) > 100 ? "Critical" : "Warning",
      cause: a.ai_explanation || "Unknown cause",
    })),
  }, { status: 200 });
}
