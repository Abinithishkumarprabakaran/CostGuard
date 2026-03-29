import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { getCostExplorerClient, fetchDailyCosts } from "@/lib/aws";
import { apiRateLimit } from "@/lib/rate-limit";

const accountSchema = z.object({
  roleArn: z.string(),
  awsAccountId: z.string(),
  accountAlias: z.string(),
  externalId: z.string(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limiting
  const ip = "127.0.0.1"; // Default fallback
  const { success } = await apiRateLimit.limit(`accounts-get-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: accounts } = await supabase
    .from("aws_accounts")
    .select("id, account_alias, aws_account_id, status, connected_at")
    .eq("user_id", userRow.id);

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
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { roleArn, awsAccountId, accountAlias, externalId } = parsed.data;

    // Verify role is assumable
    try {
      const client = await getCostExplorerClient(roleArn, externalId);
      // Try to fetch yesterday's cost to ensure permissions are correct
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      await fetchDailyCosts(client, yesterday, today);
    } catch (e) {
      return NextResponse.json({ error: "Role not accessible or missing permissions" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: newAccount, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: "Failed to save account. Account may already exist." }, { status: 400 });
    }

    return NextResponse.json({ id: newAccount.id, accountAlias: newAccount.account_alias, status: "active" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
