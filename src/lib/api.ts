import type { ScanResult } from "./types";

/**
 * The website and the API are served by the same Express server (server.ts),
 * so requests go to a relative `/api/...` path — no base URL needed.
 * Override with VITE_API_BASE only if you deploy the API on a separate origin.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  status: number;
  /** Machine-readable reason, e.g. "register_required" | "insufficient_credits". */
  code?: string;
  /** Current credit balance, when the server includes it. */
  credits?: number;
  constructor(message: string, status: number, code?: string, credits?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.credits = credits;
  }
}

/** Kick off a scan: the server screenshots the URL and asks the model to analyze it. */
export async function requestScan(
  url: string,
  opts: { signal?: AbortSignal; token?: string | null } = {},
): Promise<ScanResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
    credentials: "include", // carry the anonymous free-scan cookie
    signal: opts.signal,
  });

  if (!res.ok) {
    let message = `Scan failed (${res.status})`;
    let code: string | undefined;
    let credits: number | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: string; credits?: number };
      if (body?.error) message = body.error;
      code = body?.code;
      credits = body?.credits;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, res.status, code, credits);
  }

  return (await res.json()) as ScanResult;
}

/**
 * Unlock the full design prompt for a showcase site. Charges credits server-side
 * (same billing gates as a scan) and returns the prompt + the new balance.
 */
export async function requestPrompt(
  host: string,
  opts: { signal?: AbortSignal; token?: string | null } = {},
): Promise<{ prompt: string; credits: number | null }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}/api/prompt`, {
    method: "POST",
    headers,
    body: JSON.stringify({ host }),
    credentials: "include",
    signal: opts.signal,
  });

  if (!res.ok) {
    let message = `Could not unlock prompt (${res.status})`;
    let code: string | undefined;
    let credits: number | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: string; credits?: number };
      if (body?.error) message = body.error;
      code = body?.code;
      credits = body?.credits;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, res.status, code, credits);
  }

  return (await res.json()) as { prompt: string; credits: number | null };
}
