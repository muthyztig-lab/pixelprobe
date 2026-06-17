import "dotenv/config";

function pick(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

/**
 * Centralized configuration.
 *
 * The analyzer talks to any OpenAI-compatible vision API, so you can use a free
 * provider with NO billing — easiest is Groq (https://console.groq.com/keys).
 * Google Gemini is still supported as an alternative.
 */
export const config = {
  port: Number(process.env.PORT ?? 5173),

  /** OpenAI-compatible provider (Groq · OpenRouter · OpenAI · …). */
  ai: {
    apiKey: pick(
      process.env.AI_API_KEY,
      process.env.GROQ_API_KEY,
      process.env.OPENROUTER_API_KEY,
      process.env.OPENAI_API_KEY,
    ),
    baseUrl: pick(process.env.AI_BASE_URL) || "https://api.groq.com/openai/v1",
    model: pick(process.env.AI_MODEL) || "meta-llama/llama-4-scout-17b-16e-instruct",
  },

  /** Google Gemini — used only if no AI_API_KEY is set. */
  gemini: {
    apiKey: pick(process.env.GEMINI_API_KEY),
    model: pick(process.env.GEMINI_MODEL) || "gemini-2.0-flash",
  },

  /**
   * Supabase — powers accounts + the credit system. Entirely optional: with no
   * keys the app runs in "open mode" (no login, unlimited scans). The
   * SERVICE_ROLE key is server-only and MUST never be exposed to the browser.
   */
  supabase: {
    url: pick(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL),
    serviceRoleKey: pick(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },

  /** Credit economy (server-enforced — clients can never change these). */
  credits: {
    /** Credits a brand-new account starts with. */
    signupBonus: Number(process.env.SIGNUP_CREDITS ?? 25),
    /** Credits spent per scan. */
    scanCost: Number(process.env.SCAN_COST ?? 5),
    /** Credits spent to unlock a showcase site's full design prompt. */
    promptCost: Number(process.env.PROMPT_COST ?? 5),
    /** Free scans an anonymous (logged-out) visitor gets before registering. */
    freeAnonScans: Number(process.env.FREE_ANON_SCANS ?? 1),
  },

  /** Secret used to sign the anonymous free-scan cookie. */
  cookieSecret: pick(process.env.AUTH_COOKIE_SECRET) || "pixelprobe-dev-cookie-secret",
} as const;

/** True when running the production build (`npm start` / NODE_ENV=production). */
export const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";

export type Provider = "openai" | "gemini" | "demo";

/** Which backend will actually run the analysis. */
export const provider: Provider = config.ai.apiKey
  ? "openai"
  : config.gemini.apiKey
    ? "gemini"
    : "demo";

export const hasAI = provider !== "demo";

/** Human-readable label of the active model (shown in the UI / health check). */
export const activeModel =
  provider === "openai" ? config.ai.model : provider === "gemini" ? config.gemini.model : "demo";

/**
 * Accounts + credits are active only when BOTH the Supabase URL and the
 * server-only service-role key are present. Otherwise we run in open mode.
 */
export const authEnabled = Boolean(config.supabase.url && config.supabase.serviceRoleKey);
