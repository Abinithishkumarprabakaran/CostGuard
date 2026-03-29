import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`portal-post-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", userRow.id).single();

  if (!sub || !sub.stripe_customer_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
