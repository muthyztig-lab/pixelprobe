/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  /** Supabase project URL (public). Enables accounts + credits when set. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key (safe to expose to the browser). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
