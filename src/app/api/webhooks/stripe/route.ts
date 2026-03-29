import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const reqHeaders = await headers();
  const signature = reqHeaders.get("stripe-signature") as string;

  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription) break;
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;
        const userId = subscription.metadata?.user_id;
        const plan = subscription.metadata?.plan || "starter";

        if (userId) {
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripe_subscription_id: subscription.id,
            plan: plan,
            status: subscription.status,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: "stripe_subscription_id" });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        await supabase.from("subscriptions").update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          plan: subscription.metadata?.plan || "starter"
        }).eq("stripe_subscription_id", subscription.id);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await supabase.from("subscriptions").update({
          status: "canceled",
        }).eq("stripe_subscription_id", subscription.id);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
            await supabase.from("subscriptions").update({
                status: "past_due",
            }).eq("stripe_subscription_id", invoice.subscription as string);
            // Optionally trigger Resend email here for failed payment
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
