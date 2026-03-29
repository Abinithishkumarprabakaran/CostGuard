import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { encryptWebhookUrl, sendSpikeAlert } from "@/lib/slack";
import { apiRateLimit } from "@/lib/rate-limit";

const saveSchema = z.object({
  webhookUrl: z.string().url(),
  channelName: z.string(),
  teamName: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`slack-post-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { webhookUrl, channelName, teamName } = parsed.data;

  // Send a test message first to verify
  try {
    await sendSpikeAlert(webhookUrl, {
      service: "Test Service",
      deltaUsd: 100,
      deltaPct: 50,
      dailyCost: 300,
      cause: "This is a test message to verify the Slack webhook connection.",
      fix: "No action needed.",
      accountAlias: "Test Account",
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid webhook URL or Slack rejected the test message." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const encryptedUrl = encryptWebhookUrl(webhookUrl);

  const { error } = await supabase.from("slack_connections").upsert(
    {
      user_id: userRow.id,
      webhook_url_enc: encryptedUrl,
      channel_name: channelName,
      team_name: teamName,
      is_active: true,
    },
    { onConflict: "user_id" }
  );

  if (error) return NextResponse.json({ error: "Failed to save connection." }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`slack-delete-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase.from("slack_connections").delete().eq("user_id", userRow.id);

  if (error) return NextResponse.json({ error: "Failed to remove connection." }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}
