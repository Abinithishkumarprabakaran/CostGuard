import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCostExplorerClient, fetchDailyCosts } from "@/lib/aws";
import { apiRateLimit } from "@/lib/rate-limit";

const PLAN_ACCOUNT_LIMITS: Record<string, number> = {
  starter: 1,
  growth: 3,
  pro: Infinity,
};

const accountSchema = z.object({
  roleArn: z.string().min(1),
  awsAccountId: z.string().min(12).max(12),
  accountAlias: z.string().optional().default(""),
  externalId: z.string().min(1, "externalId is required"),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`accounts-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: accounts } = await supabase
    .from("aws_accounts")
    .select("id, account_alias, aws_account_id, status, connected_at")
    .eq("user_id", userRow.id)
    .neq("status", "disconnected");

  return NextResponse.json(accounts ?? []);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`accounts-post-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { roleArn, awsAccountId, accountAlias, externalId } = parsed.data;

    const supabase = createAdminSupabaseClient();
    const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ── Plan limit enforcement ───────────────────────────────────────────────
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userRow.id)
      .in("status", ["trialing", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const plan = subscription?.plan ?? "starter";
    const limit = PLAN_ACCOUNT_LIMITS[plan] ?? 1;

    const { count: existingCount } = await supabase
      .from("aws_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userRow.id)
      .neq("status", "disconnected");

    if ((existingCount ?? 0) >= limit) {
      const limitLabel = limit === Infinity ? "unlimited" : String(limit);
      return NextResponse.json(
        {
          error: `Your ${plan} plan allows up to ${limitLabel} AWS account${limit === 1 ? "" : "s"}. Please upgrade to connect more accounts.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    // Verify the IAM role is assumable and has Cost Explorer access
    try {
      const client = await getCostExplorerClient(roleArn, externalId);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      await fetchDailyCosts(client, yesterday, today);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not assume the IAM role. Please verify: (1) the Role ARN is correct, (2) the trust policy includes the Cost Guard account, and (3) the External ID matches exactly.",
        },
        { status: 400 }
      );
    }

    const { data: newAccount, error: insertError } = await supabase
      .from("aws_accounts")
      .insert({
        user_id: userRow.id,
        role_arn: roleArn,
        aws_account_id: awsAccountId,
        account_alias: accountAlias,
        external_id: externalId,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save account. This AWS account ID may already be connected." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { id: newAccount.id, accountAlias: newAccount.account_alias, status: "active" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
