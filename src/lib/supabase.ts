import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase client using the active Clerk session JWT.
 * This ensures that Row Level Security (RLS) policies in PostgreSQL
 * are automatically applied based on the signed-in user and active organization.
 */
export async function createClerkSupabaseClient() {
  const { getToken } = await auth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      // Get the custom Supabase JWT template configured in the Clerk dashboard
      fetch: async (url, options = {}) => {
        // We use a custom JWT template named "supabase" in Clerk to inject
        // the user's ID, Org ID, and Org Role into the token.
        // For development/testing purposes, if `getToken` fails or isn't set up,
        // it falls back to anon key logic.
        let clerkToken;
        try {
          clerkToken = await getToken({ template: "supabase" });
        } catch (error) {
          console.warn("Clerk Supabase token fetch failed. Check your Clerk JWT templates.", error);
        }

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}
