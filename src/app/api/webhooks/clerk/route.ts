import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Setup svix webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const { id } = evt.data;
  const eventType = evt.type;

  // IMPORTANT: Use the SERVICE_ROLE_KEY to bypass RLS for webhook sync operations
  const { createAdminSupabaseClient } = require('@/lib/supabase-admin');
  const supabase = createAdminSupabaseClient();

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`)

  try {
    // Handle Organizations
    if (eventType === 'organization.created' || eventType === 'organization.updated') {
      const { id, name, slug } = evt.data;
      await supabase.from('organizations').upsert({
        id,
        name,
        slug,
      });
    }

    if (eventType === 'organization.deleted') {
      const { id } = evt.data;
      await supabase.from('organizations').delete().match({ id });
    }

    // Handle Organization Memberships
    if (eventType === 'organizationMembership.created' || eventType === 'organizationMembership.updated') {
      const { id, organization, public_user_data, role } = evt.data;
      await supabase.from('organization_members').upsert({
        id,
        org_id: organization.id,
        user_id: public_user_data.user_id,
        role: role,
      });
    }

    if (eventType === 'organizationMembership.deleted') {
      const { id } = evt.data;
      await supabase.from('organization_members').delete().match({ id });
    }

    // Handle Users
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;
      
      await supabase.from('users').upsert({
        clerk_user_id: id,
        email: primaryEmail || '',
        full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      }, { onConflict: 'clerk_user_id' });
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
         await supabase.from('users').delete().match({ clerk_user_id: id });
      }
    }

    return new Response('', { status: 200 })
  } catch (error) {
    console.error("Error syncing to Supabase:", error);
    return new Response('Error syncing data to DB', { status: 500 })
  }
}
