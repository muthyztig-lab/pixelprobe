/**
 * Auth + credits + modal coordination for the whole app.
 *
 * One provider keeps the wiring simple: it tracks the Supabase session and the
 * user's credit balance, and also owns the two global modals (auth + pricing)
 * so any button or the scan flow can open them.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, supabaseEnabled } from "./supabase";

export type AuthMode = "signin" | "signup";
export type PricingReason = "intro" | "register_required" | "insufficient_credits" | null;

interface MeConfig {
  authEnabled: boolean;
  scanCost: number;
  promptCost: number;
  signupBonus: number;
  freeAnonScans: number;
}

interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextValue extends MeConfig {
  /** Accounts active (Supabase configured on BOTH client and server). */
  enabled: boolean;
  loading: boolean;
  user: AuthUser | null;
  credits: number | null;
  /** Access token for authorized API calls (null when logged out). */
  getToken: () => Promise<string | null>;
  refreshCredits: () => Promise<void>;
  setCredits: (n: number | null) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // ── Modal control ──
  authModal: AuthMode | null;
  pricingModal: PricingReason;
  openAuth: (mode?: AuthMode) => void;
  openPricing: (reason?: Exclude<PricingReason, null>) => void;
  closeModals: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_CFG: MeConfig = {
  authEnabled: false,
  scanCost: 5,
  promptCost: 5,
  signupBonus: 25,
  freeAnonScans: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<MeConfig>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const [pricingModal, setPricingModal] = useState<PricingReason>(null);
  const introShown = useRef(false);

  const enabled = supabaseEnabled && cfg.authEnabled;

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!supabase || !user) {
      setCredits(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (data) setCredits(data.credits as number);
  }, [user]);

  // Load server config once (tells us if auth is actually enabled server-side).
  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d) setCfg({ authEnabled: !!d.authEnabled, scanCost: d.scanCost, promptCost: d.promptCost ?? d.scanCost, signupBonus: d.signupBonus, freeAnonScans: d.freeAnonScans });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Track the Supabase session.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // ── OAuth-callback diagnostics ──────────────────────────────────────
    // After a Google redirect the URL carries either `?code=...` (PKCE) or an
    // `#error=...` (when something went wrong). Log both so failures stop being
    // silent. detectSessionInUrl still does the actual exchange below.
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const oauthError =
      url.searchParams.get("error_description") ||
      url.searchParams.get("error") ||
      hashParams.get("error_description") ||
      hashParams.get("error");
    if (oauthError) {
      console.error("[auth] OAuth redirect returned an error:", oauthError);
    }
    if (url.searchParams.has("code")) {
      console.info("[auth] OAuth `code` present in URL — exchanging for a session…");
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) console.error("[auth] getSession() failed:", error);
        const u = data.session?.user;
        console.info("[auth] initial session:", u ? `signed in as ${u.email}` : "none");
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[auth] getSession() threw:", err);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.info("[auth] onAuthStateChange:", event, session?.user?.email ?? "(no user)");
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Whenever the user changes, refresh their credit balance.
  useEffect(() => {
    refreshCredits();
  }, [user, refreshCredits]);

  // First-visit pricing modal for logged-out visitors (once per browser).
  useEffect(() => {
    if (!enabled || loading) return;
    if (user) return;
    if (introShown.current) return;
    if (localStorage.getItem("pp_intro_seen")) return;
    introShown.current = true;
    localStorage.setItem("pp_intro_seen", "1");
    const t = setTimeout(() => setPricingModal("intro"), 700);
    return () => clearTimeout(t);
  }, [enabled, loading, user]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Auth is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Auth is not configured.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // If email confirmations are on, there's no session yet.
    return { needsConfirmation: !data.session };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Auth is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setCredits(null);
  }, []);

  const openAuth = useCallback((mode: AuthMode = "signin") => {
    setPricingModal(null);
    setAuthModal(mode);
  }, []);
  const openPricing = useCallback((reason: Exclude<PricingReason, null> = "intro") => {
    setAuthModal(null);
    setPricingModal(reason);
  }, []);
  const closeModals = useCallback(() => {
    setAuthModal(null);
    setPricingModal(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...cfg,
      enabled,
      loading,
      user,
      credits,
      getToken,
      refreshCredits,
      setCredits,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      authModal,
      pricingModal,
      openAuth,
      openPricing,
      closeModals,
    }),
    [
      cfg,
      enabled,
      loading,
      user,
      credits,
      getToken,
      refreshCredits,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      authModal,
      pricingModal,
      openAuth,
      openPricing,
      closeModals,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
