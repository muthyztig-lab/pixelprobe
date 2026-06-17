/**
 * Tiny signed-cookie helper for the anonymous free-scan allowance.
 *
 * This is intentionally lightweight: it gates how many scans a logged-out
 * visitor gets before we ask them to register. It is HMAC-signed so the count
 * can't be trivially edited, but it is NOT the security boundary for credits —
 * that lives entirely server-side in the DB (see services/supabase.ts). A
 * determined user clearing cookies just gets the free allowance again, which is
 * fine for a trial gate.
 */
import crypto from "crypto";
import type { Request, Response } from "express";
import { config, isProd } from "../config.js";

const COOKIE = "pp_free";

function sign(value: string): string {
  const mac = crypto.createHmac("sha256", config.cookieSecret).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function verify(signed: string | undefined): number {
  if (!signed) return 0;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return 0;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", config.cookieSecret)
    .update(value)
    .digest("base64url");
  if (mac.length !== expected.length) return 0;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** How many anonymous free scans this visitor has already used. */
export function anonScansUsed(req: Request): number {
  return verify(readCookie(req, COOKIE));
}

/** Persist an incremented anonymous free-scan count. */
export function setAnonScans(res: Response, count: number): void {
  const signed = sign(String(count));
  // `Secure` in production so the cookie is only ever sent over HTTPS.
  const secure = isProd ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(signed)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly${secure}`,
  );
}
