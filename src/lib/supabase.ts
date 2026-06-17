/**
 * Browser-side Supabase client.
 *
 * Uses the PUBLIC anon key — safe to ship to the browser. Row-Level Security on
 * the `profiles` table means this client can only ever READ the signed-in
 * user's own credit balance; it can never change it. All credit spending goes
 * through the server (see src/server/services/supabase.ts).
 *
 * If the env vars are absent the app runs in "open mode": no login, unlimited
 * scans, and `supabase` is null.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
