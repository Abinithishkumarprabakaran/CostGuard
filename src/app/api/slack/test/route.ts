import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sendSpikeAlert } from "@/lib/slack";
import { strictRateLimit } from "@/lib/rate-limit";

const testSchema = z.object({
  webhookUrl: z.string().url(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await strictRateLimit.limit(`slack-test-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  try {
    await sendSpikeAlert(parsed.data.webhookUrl, {
      service: "Connection Test",
      deltaUsd: 0,
      deltaPct: 0,
      dailyCost: 0,
      cause: "You clicked 'Test Connection' in Cost Guard.",
      fix: "No action needed. Your integration is working perfectly!",
      accountAlias: "Your AWS Account",
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send test message." }, { status: 400 });
  }
}
