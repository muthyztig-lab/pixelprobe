/**
 * Server-side Supabase access — the ONLY place credits are ever changed.
 *
 * Security model (see SUPABASE_SETUP.md):
 *   • The browser holds the PUBLIC anon key and can only READ its own profile
 *     row (enforced by Row-Level Security). It can never UPDATE credits.
 *   • This server holds the SERVICE_ROLE key (never sent to the client) and is
 *     the sole authority that spends credits, via the `consume_credits` RPC
 *     which is revoked from anon/authenticated roles and runs atomically.
 *   • Every authenticated request is verified here by exchanging the caller's
 *     JWT for a user id — a forged token simply fails `getUser`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config, authEnabled } from "../config.js";

let admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return admin;
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Verify a Supabase access token and return the user, or null if invalid. */
export async function getUserFromToken(token: string | null): Promise<AuthedUser | null> {
  if (!authEnabled || !token) return null;
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** Read a user's current credit balance (server-side, bypasses RLS safely). */
export async function getCredits(userId: string): Promise<number | null> {
  const { data, error } = await getAdmin()
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data.credits as number;
}

/**
 * Atomically spend `amount` credits for `userId`. Returns the new balance, or
 * `null` if the user did not have enough (no credits were deducted). The actual
 * check-and-decrement happens inside a single SQL statement in the DB, so it is
 * race-safe and cannot be bypassed by the client.
 */
export async function consumeCredits(userId: string, amount: number): Promise<number | null> {
  const { data, error } = await getAdmin().rpc("consume_credits", {
    p_user: userId,
    p_amount: amount,
  });
  if (error) {
    console.error("[credits] consume failed:", error.message);
    return null;
  }
  // RPC returns the new balance, or null when the balance was insufficient.
  return typeof data === "number" ? data : null;
}

/** Refund credits (used if a charged scan fails after deduction). */
export async function refundCredits(userId: string, amount: number): Promise<void> {
  await getAdmin().rpc("refund_credits", { p_user: userId, p_amount: amount }).then(
    () => {},
    (e) => console.error("[credits] refund failed:", e),
  );
}

export interface HistoryEntry {
  host: string;
  url: string;
  title?: string | null;
  summary?: string | null;
  prompt?: string | null;
  colors?: string[] | null;
}

/**
 * Save one scan to the user's history (server-only — RLS blocks client inserts).
 * Best-effort: a failure here must never break the scan response.
 */
export async function saveScanHistory(userId: string, entry: HistoryEntry): Promise<void> {
  const { error } = await getAdmin().from("scan_history").insert({
    user_id: userId,
    host: entry.host,
    url: entry.url,
    title: entry.title ?? null,
    summary: entry.summary ?? null,
    prompt: entry.prompt ?? null,
    colors: entry.colors ?? null,
  });
  if (error) console.error("[history] save failed:", error.message);
}
