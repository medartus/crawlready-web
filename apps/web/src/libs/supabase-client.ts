/**
 * Supabase Client with Clerk Integration
 *
 * Creates a Supabase client that uses Clerk session tokens
 * for authentication with Supabase RLS.
 *
 * Setup Instructions:
 * 1. Enable Supabase integration in Clerk Dashboard
 * 2. Add Clerk as auth provider in Supabase Dashboard
 * 3. Configure RLS policies to use Clerk user IDs
 * 4. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with Clerk authentication
 *
 * This client automatically includes the Clerk session token
 * in requests to Supabase, enabling RLS policies based on
 * Clerk user IDs.
 *
 * @returns Supabase client configured with Clerk auth
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  // Get Clerk session token
  const { getToken } = await auth();
  const token = await getToken({ template: 'supabase' });

  if (!token) {
    throw new Error('No Clerk session token available. User must be authenticated.');
  }

  // Create Supabase client with Clerk token
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Create a browser-side Supabase client
 * (For use in client components)
 *
 * Note: This requires additional setup for Clerk token retrieval
 * on the client side. For most use cases, server-side client is preferred.
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Example RLS Policy for Supabase:
 *
 * CREATE POLICY "Users can access own rendered pages"
 * ON rendered_pages
 * FOR SELECT
 * TO authenticated
 * USING (
 *   user_id = auth.jwt() ->> 'sub'
 * );
 *
 * Note: The 'sub' claim in Clerk JWT contains the Clerk user ID
 */
