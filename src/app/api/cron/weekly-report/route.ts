import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { sendWeeklySummary, decryptWebhookUrl } from "@/lib/slack";

export async function GET() {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: accounts } = await supabase.from("aws_accounts").select("*").eq("status", "active");

  if (!accounts) return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });

  const today = new Date();
  
  // Calculate date boundaries
  const weekStart = new Date(today.getTime() - 7 * 86400000); // 7 days ago
  const priorWeekStart = new Date(today.getTime() - 14 * 86400000); // 14 days ago

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const priorWeekStartStr = priorWeekStart.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  let processed = 0;

  for (const account of accounts) {
    // Current Week
    const { data: currSnaps } = await supabase
      .from("cost_snapshots")
      .select("service, blended_cost")
      .eq("account_id", account.id)
      .gte("date", weekStartStr)
      .lt("date", todayStr);

    // Prior Week
    const { data: priorSnaps } = await supabase
      .from("cost_snapshots")
      .select("blended_cost")
      .eq("account_id", account.id)
      .gte("date", priorWeekStartStr)
      .lt("date", weekStartStr);

    if (currSnaps && currSnaps.length > 0) {
      let totalCurrent = 0;
      const serviceMap = new Map<string, number>();

      for (const snap of currSnaps) {
        totalCurrent += Number(snap.blended_cost);
        serviceMap.set(snap.service, (serviceMap.get(snap.service) || 0) + Number(snap.blended_cost));
      }

      let topService = "None";
      let topServiceCost = 0;
      for (const [srv, cost] of serviceMap.entries()) {
        if (cost > topServiceCost) {
            topServiceCost = cost;
            topService = srv;
        }
      }

      let totalPrior = 0;
      if (priorSnaps) {
          totalPrior = priorSnaps.reduce((acc, val) => acc + Number(val.blended_cost), 0);
      }

      const diff = totalCurrent - totalPrior;
      const spendVsLastWeek = totalPrior === 0 ? 0 : (diff / totalPrior) * 100;

      // Slack logic
      const { data: slackConn } = await supabase.from("slack_connections").select("webhook_url_enc").eq("user_id", account.user_id).single();
              
      let slackSentAt = null;

      if (slackConn && slackConn.webhook_url_enc) {
          const url = decryptWebhookUrl(slackConn.webhook_url_enc);
          try {
             await sendWeeklySummary(url, {
                 accountAlias: account.account_alias || account.aws_account_id,
                 weekStart: weekStartStr,
                 totalSpend: totalCurrent,
                 topService,
                 topServiceCost,
                 spendVsLastWeek,
                 dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`
             });
             slackSentAt = new Date().toISOString();
          } catch (e) {
             console.error("Failed sending weekly slack", e);
          }
      }

      await supabase.from("weekly_summary_log").insert({
          account_id: account.id,
          week_start: weekStartStr,
          total_spend: totalCurrent,
          top_service: topService,
          slack_sent_at: slackSentAt
      });
      processed++;
    }
  }

  return NextResponse.json({ processed }, { status: 200 });
}
