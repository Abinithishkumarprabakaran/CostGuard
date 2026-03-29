import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`accounts-delete-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
    
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure the account belongs to the user before updating
    const { error } = await supabase
      .from("aws_accounts")
      .update({ status: "disconnected" })
      .match({ id, user_id: userRow.id });

    if (error) {
      return NextResponse.json({ error: "Failed to disconnect account" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
