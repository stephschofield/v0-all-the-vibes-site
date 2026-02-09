import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support multiple naming conventions for Supabase env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabase_SUPABASE_URL;

// Anon key — respects Row-Level Security policies (use for public operations)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_supabase_SUPABASE_ANON_KEY;

// Service role key — bypasses RLS (use ONLY for authenticated admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY;

let _publicClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

/**
 * Public Supabase client — uses anon key, respects RLS policies.
 * Use this for all public-facing operations.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  if (!_publicClient) {
    _publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return _publicClient;
}

/**
 * Admin Supabase client — uses service role key, bypasses RLS.
 * Use ONLY for authenticated admin operations (e.g., clearAllTopics).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin configuration. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  return _adminClient;
}

export default { getSupabase, getSupabaseAdmin };
