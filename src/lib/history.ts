/**
 * Scan history — read/delete the signed-in user's past scans.
 *
 * The browser uses the public anon key; Row-Level Security on `scan_history`
 * means these queries only ever touch the current user's own rows (see
 * supabase/scan_history.sql). Writes are done server-side, never here.
 */
import { supabase } from "./supabase";

export interface HistoryItem {
  id: string;
  host: string;
  url: string;
  title: string | null;
  summary: string | null;
  prompt: string | null;
  colors: string[] | null;
  created_at: string;
}

/** Newest-first history for the signed-in user (capped). */
export async function fetchHistory(): Promise<HistoryItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scan_history")
    .select("id, host, url, title, summary, prompt, colors, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[history] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as HistoryItem[];
}

/** Delete one of the user's own history entries (RLS enforces ownership). */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("scan_history").delete().eq("id", id);
  if (error) {
    console.error("[history] delete failed:", error.message);
    return false;
  }
  return true;
}
