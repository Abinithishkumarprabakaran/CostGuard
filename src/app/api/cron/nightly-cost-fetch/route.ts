import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCostExplorerClient, fetchDailyCosts } from "@/lib/aws";
import { detectSpike } from "@/lib/spike-detection";
import { explainSpike } from "@/lib/anthropic";
import { decryptWebhookUrl, sendSpikeAlert } from "@/lib/slack";

export async function GET() {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: accounts, error } = await supabase.from("aws_accounts").select("*").eq("status", "active");

  if (error || !accounts) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }

  let processed = 0;
  let spikesDetected = 0;

  for (const account of accounts) {
    try {
      const client = await getCostExplorerClient(account.role_arn, account.external_id);
      
      const todayDate = new Date();
      const yesterdayDate = new Date(todayDate.getTime() - 86400000);
      const sevenDaysAgoDate = new Date(yesterdayDate.getTime() - 6 * 86400000); // 7 days of data ending yesterday
      
      const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
      const todayStr = todayDate.toISOString().split("T")[0];
      const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split("T")[0];

      // Fetch last 7 days to have historical context
      const costsParams = {
          client,
          start: sevenDaysAgoStr,
          end: todayStr // Exclusive
      };

      const dailyCostsData = await fetchDailyCosts(client, costsParams.start, costsParams.end);
      
      // Map structures: service -> date -> cost
      const serviceCosts: Record<string, Record<string, number>> = {};
      
      for (const result of dailyCostsData) {
        const date = result.TimePeriod?.Start;
        if (!date) continue;

        for (const group of (result.Groups || [])) {
           const service = group.Keys?.[0];
           const costStr = group.Metrics?.["BlendedCost"]?.Amount;
           if (service && costStr) {
               if (!serviceCosts[service]) serviceCosts[service] = {};
               serviceCosts[service][date] = parseFloat(costStr);
           }
        }
      }

      // Process yesterday's data per service
      for (const [service, datesObj] of Object.entries(serviceCosts)) {
          const yesterdayCost = datesObj[yesterdayStr] || 0;

          // Upsert snapshot for yesterday
          await supabase.from("cost_snapshots").upsert({
              account_id: account.id,
              service,
              date: yesterdayStr,
              blended_cost: yesterdayCost
          }, { onConflict: "account_id, service, date" });

          // Spike detection: get last 7 days up to day before yesterday
          const historyArr = [];
          for (let i = 7; i >= 1; i--) {
             const d = new Date(yesterdayDate.getTime() - i * 86400000).toISOString().split("T")[0];
             historyArr.push(datesObj[d] || 0);
          }

          const spike = detectSpike(yesterdayCost, historyArr);
          
          if (spike.isSpike) {
              spikesDetected++;
              
              // Explain
              const explanation = await explainSpike({
                  service,
                  todayCost: yesterdayCost,
                  avg7dCost: spike.avg7d,
                  deltaPct: spike.deltaPct,
                  deltaUsd: spike.deltaUsd,
                  dayOfWeek: yesterdayDate.toLocaleDateString('en-US', { weekday: 'long' })
              });

              // Save Alert
              const { data: alertData } = await supabase.from("spike_alerts").insert({
                  account_id: account.id,
                  service,
                  date: yesterdayStr,
                  daily_cost: yesterdayCost,
                  avg_7d_cost: spike.avg7d,
                  delta_pct: spike.deltaPct,
                  delta_usd: spike.deltaUsd,
                  ai_explanation: explanation.cause,
                  ai_fix: explanation.fix,
                  ai_confidence: explanation.confidence,
              }).select("id").single();

              // Alert via Slack
              const { data: slackConn } = await supabase.from("slack_connections").select("webhook_url_enc").eq("user_id", account.user_id).single();
              
              if (slackConn && slackConn.webhook_url_enc) {
                  const url = decryptWebhookUrl(slackConn.webhook_url_enc);
                  try {
                      await sendSpikeAlert(url, {
                          service,
                          deltaUsd: spike.deltaUsd,
                          deltaPct: spike.deltaPct,
                          dailyCost: yesterdayCost,
                          cause: explanation.cause,
                          fix: explanation.fix,
                          accountAlias: account.account_alias,
                          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/alerts`
                      });

                      if (alertData) {
                          await supabase.from("spike_alerts").update({ slack_sent_at: new Date().toISOString() }).eq("id", alertData.id);
                      }
                  } catch (e) {
                      console.error("Failed to send slack alert", e);
                  }
              }
          }
      }

      await supabase.from("aws_accounts").update({ last_synced_at: new Date().toISOString() }).eq("id", account.id);
      processed++;
      
    } catch (e) {
      console.error(`Error processing account ${account.id}`, e);
    }

    // Delay 200ms to respect IAM assumed role / cost explorer limits per second
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return NextResponse.json({ processed, spikes: spikesDetected }, { status: 200 });
}
