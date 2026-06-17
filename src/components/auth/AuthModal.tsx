import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IconMail, IconLock, IconGoogle, IconLoader } from "@/icons";
import { useAuth, type AuthMode } from "@/lib/auth";

/**
 * Sign in / sign up dialog. Plain, restrained styling — labelled inputs, a
 * subtle focus ring, no glow or gradient busywork. Email+password and a Google
 * button (Google works once you enable the provider in Supabase).
 */
export function AuthModal() {
  const {
    authModal,
    closeModals,
    openAuth,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    refreshCredits,
    signupBonus,
  } = useAuth();

  const open = authModal !== null;
  const mode: AuthMode = authModal ?? "signin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reset transient state whenever the dialog opens or the mode switches.
  useEffect(() => {
    if (open) {
      setError(null);
      setNotice(null);
      setPassword("");
    }
  }, [open, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { needsConfirmation } = await signUpWithPassword(email.trim(), password);
        if (needsConfirmation) {
          setNotice("Check your inbox to confirm your email, then sign in.");
          setBusy(false);
          return;
        }
      } else {
        await signInWithPassword(email.trim(), password);
      }
      await refreshCredits();
      closeModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle(); // redirects away
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={closeModals} className="max-w-[400px]" label="Account">
      <div className="p-7">
        <h2 className="font-display text-[19px] font-semibold text-ink">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-1 text-[13px] text-ink-dim">
          {mode === "signup"
            ? `Sign up and get ${signupBonus} credits to start scanning.`
            : "Sign in to keep scanning with your credits."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={googleBusy}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-sm border border-line bg-white/[0.03] py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:bg-white/[0.06] disabled:opacity-60"
        >
          {googleBusy ? <IconLoader size={16} className="spin" /> : <IconGoogle size={17} />}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink-faint">
          <span className="h-px flex-1 bg-line-soft" />
          or
          <span className="h-px flex-1 bg-line-soft" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field
            icon={<IconMail size={15} />}
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            icon={<IconLock size={15} />}
            type="password"
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
          />

          {error && <p className="text-[12.5px] text-rose">{error}</p>}
          {notice && <p className="text-[12.5px] text-emerald">{notice}</p>}

          <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
            {busy ? (
              <IconLoader size={16} className="spin" />
            ) : mode === "signup" ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-ink-dim">
          {mode === "signup" ? "Already have an account?" : "New to PixelProbe?"}{" "}
          <button
            type="button"
            onClick={() => openAuth(mode === "signup" ? "signin" : "signup")}
            className="font-medium text-accent hover:text-accent-2"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </Modal>
  );
}

function Field({
  icon,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex items-center gap-2.5 rounded-sm border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-white/25">
      <span className="text-ink-faint">{icon}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  );
}
