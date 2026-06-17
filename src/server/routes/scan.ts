import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { hasAI, authEnabled, config } from "../config.js";
import { captureScreenshots } from "../services/capture.js";
import { analyzeScreenshots, buildDemoResult } from "../services/analyze.js";
import { getUserFromToken, consumeCredits, refundCredits, getCredits, saveScanHistory } from "../services/supabase.js";
import type { ScanResult } from "../types.js";
import { anonScansUsed, setAnonScans } from "../services/anonCookie.js";
import { assertPublicUrl, BlockedUrlError } from "../services/ssrfGuard.js";
import { buildSitePrompt } from "../services/prompt.js";
import { SHOWCASE_ITEMS } from "../../data/showcase.js";

export const scanRouter = Router();

/** Per-IP rate limit on the expensive scan endpoint (browser + AI per call). */
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 scans per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many scans from this address. Please wait a few minutes and try again." },
});

/**
 * Cap concurrent browser launches. Each scan spins up a full Chromium, so
 * without this a handful of parallel requests can exhaust server memory/CPU.
 */
const MAX_CONCURRENT_SCANS = 3;
let activeScans = 0;

function normalizeUrl(raw: string): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (h && /^Bearer\s+/i.test(h)) return h.replace(/^Bearer\s+/i, "").trim();
  return null;
}

/** Save a finished scan to the user's history (best-effort, logged-in only). */
async function recordHistory(userId: string | null, result: ScanResult): Promise<void> {
  if (!userId) return;
  await saveScanHistory(userId, {
    host: result.host,
    url: result.url,
    title: result.host,
    summary: result.summary,
    prompt: result.markdownPrompt,
    colors: result.colors.map((c) => c.hex).slice(0, 6),
  });
}

/** Lightweight account snapshot for the client (credits live server-side). */
scanRouter.get("/me", async (req: Request, res: Response) => {
  const cfg = {
    authEnabled,
    scanCost: config.credits.scanCost,
    promptCost: config.credits.promptCost,
    signupBonus: config.credits.signupBonus,
    freeAnonScans: config.credits.freeAnonScans,
  };
  if (!authEnabled) return res.json({ ...cfg, user: null, credits: null });

  const user = await getUserFromToken(bearer(req));
  if (!user) {
    return res.json({ ...cfg, user: null, credits: null, anonScansUsed: anonScansUsed(req) });
  }
  const credits = await getCredits(user.id);
  return res.json({ ...cfg, user: { id: user.id, email: user.email }, credits });
});

scanRouter.post("/scan", scanLimiter, async (req: Request, res: Response) => {
  const url = normalizeUrl(req.body?.url);
  if (!url) {
    return res.status(400).json({ error: "Please provide a valid URL, e.g. stripe.com" });
  }

  // SSRF guard: refuse internal / private / link-local targets BEFORE any work.
  try {
    await assertPublicUrl(url);
  } catch (err) {
    if (err instanceof BlockedUrlError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: "That URL could not be validated." });
  }

  const host = new URL(url).hostname.replace(/^www\./, "");
  const cost = config.credits.scanCost;

  // ── Access control / billing ─────────────────────────────────────────────
  // Open mode (no Supabase configured): unlimited, no accounts.
  let userId: string | null = null;
  let charged = false;

  if (authEnabled) {
    const user = await getUserFromToken(bearer(req));
    if (user) {
      // Logged in → spend credits atomically BEFORE doing any work.
      const newBalance = await consumeCredits(user.id, cost);
      if (newBalance === null) {
        const credits = await getCredits(user.id);
        return res.status(402).json({
          code: "insufficient_credits",
          error: `Not enough credits. Each scan costs ${cost} credits.`,
          credits: credits ?? 0,
        });
      }
      userId = user.id;
      charged = true;
      res.locals.credits = newBalance;
    } else {
      // Anonymous → allow a small free allowance, then require registration.
      const used = anonScansUsed(req);
      if (used >= config.credits.freeAnonScans) {
        return res.status(402).json({
          code: "register_required",
          error: `Free scans used up. Create a free account to get ${config.credits.signupBonus} credits.`,
        });
      }
      setAnonScans(res, used + 1);
    }
  }

  // No API key → return a clearly-labelled demo result so the UI still works.
  if (!hasAI) {
    const demo = buildDemoResult(url, host);
    await recordHistory(userId, demo);
    return res.json({ ...demo, credits: res.locals.credits ?? null });
  }

  // Refuse to start more browsers than we can handle (memory/CPU protection).
  if (activeScans >= MAX_CONCURRENT_SCANS) {
    if (charged && userId) await refundCredits(userId, cost);
    return res.status(429).json({ error: "The scanner is busy right now. Please try again shortly." });
  }

  activeScans++;
  try {
    const { shots, finalUrl, pageData } = await captureScreenshots(url);
    if (shots.length === 0) {
      if (charged && userId) await refundCredits(userId, cost);
      return res
        .status(502)
        .json({ error: "Could not capture the page. It may be blocking headless browsers." });
    }
    const result = await analyzeScreenshots(finalUrl, host, shots, pageData);
    await recordHistory(userId, result);
    return res.json({ ...result, credits: res.locals.credits ?? null });
  } catch (err) {
    // The scan failed after we charged — refund so the user isn't billed for nothing.
    if (charged && userId) await refundCredits(userId, cost);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (/Executable doesn't exist|playwright install/i.test(message)) {
      return res.status(500).json({
        error: "Browser not installed. Run `npx playwright install chromium` in the project folder.",
      });
    }
    if (/\b429\b|quota|rate.?limit|exceeded/i.test(message)) {
      return res.status(429).json({
        error:
          "The AI provider returned a quota / rate-limit error (this is a limit on your API key, not a bug). " +
          "Try again in a minute, switch AI_MODEL in .env, or use a free Groq key (https://console.groq.com/keys).",
      });
    }
    // Log the detail server-side; return a generic message so we don't leak internals.
    console.error("[scan] failed:", message);
    return res.status(502).json({ error: "Scan failed. Please try again." });
  } finally {
    activeScans--;
  }
});

/** Per-IP limit on the prompt endpoint — cheap (text only), but still guarded. */
const promptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many prompt requests. Please wait a few minutes." },
});

/**
 * Unlock the full design prompt for a showcase site. The free teaser is shown
 * client-side; this paid route charges credits (same gates as /scan) and only
 * then returns the full prompt text.
 */
scanRouter.post("/prompt", promptLimiter, async (req: Request, res: Response) => {
  const host = String(req.body?.host ?? "").trim().toLowerCase();
  const item = SHOWCASE_ITEMS.find((i) => i.host === host);
  if (!item) return res.status(404).json({ error: "Unknown showcase site." });

  const cost = config.credits.promptCost;

  // Open mode (no accounts configured) → unlimited, return it for free.
  if (!authEnabled) {
    return res.json({ prompt: buildSitePrompt(item), credits: null });
  }

  const user = await getUserFromToken(bearer(req));
  if (!user) {
    return res.status(402).json({
      code: "register_required",
      error: `Create a free account to unlock full prompts (you get ${config.credits.signupBonus} credits).`,
    });
  }

  // Spend credits atomically BEFORE handing over the prompt.
  const newBalance = await consumeCredits(user.id, cost);
  if (newBalance === null) {
    const credits = await getCredits(user.id);
    return res.status(402).json({
      code: "insufficient_credits",
      error: `Not enough credits. The full prompt costs ${cost} credits.`,
      credits: credits ?? 0,
    });
  }

  return res.json({ prompt: buildSitePrompt(item), credits: newBalance });
});
