import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { apiRateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = "127.0.0.1";
  const { success } = await apiRateLimit.limit(`checkout-post-${ip}`);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { plan } = parsed.data;

  const priceMapping: Record<string, string> = {
    starter: process.env.STRIPE_PRICE_STARTER!,
    growth: process.env.STRIPE_PRICE_GROWTH!,
    pro: process.env.STRIPE_PRICE_PRO!,
  };

  const priceId = priceMapping[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan or missing price ID in env" }, { status: 500 });

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = await supabase.from("users").select("id, email").eq("clerk_user_id", userId).single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userRow.email,
      payment_method_collection: "always",
      subscription_data: {
        trial_period_days: parseInt(process.env.STRIPE_TRIAL_DAYS || "14"),
        metadata: {
            user_id: userRow.id,
            plan: plan
        }
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      client_reference_id: userRow.id,
    });

    if (!session.url) throw new Error("Could not create session URL");

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
