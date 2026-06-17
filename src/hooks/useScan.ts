import { useCallback, useRef, useState } from "react";
import { requestScan, ApiError } from "@/lib/api";
import { normalizeUrl, isProbablyUrl } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import type { ScanResult, ScanStage } from "@/lib/types";

interface ScanState {
  stage: ScanStage;
  result: ScanResult | null;
  error: string | null;
}

const STAGE_MESSAGES: Record<ScanStage, string> = {
  idle: "",
  queue: "Queued for rendering…",
  launching: "Launching headless browser…",
  capturing: "Auto-scrolling & capturing screenshots…",
  analyzing: "Analyzing typography, color & spacing…",
  done: "Done.",
  error: "Something went wrong.",
};

/**
 * Drives the scan flow. While the backend works, we advance through
 * friendly stage messages so the UI feels alive even though the heavy
 * lifting (screenshot + vision model) happens server-side in one request.
 */
export function useScan() {
  const [state, setState] = useState<ScanState>({ stage: "idle", result: null, error: null });
  const abortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<number[]>([]);
  const { enabled, user, credits, scanCost, getToken, setCredits, openPricing } = useAuth();

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearTimers();
    setState({ stage: "idle", result: null, error: null });
  }, []);

  const scan = useCallback(async (rawUrl: string) => {
    if (!isProbablyUrl(rawUrl)) {
      setState({ stage: "error", result: null, error: "Please enter a valid URL, e.g. stripe.com" });
      return;
    }

    // ── Client-side gate (the server is still the source of truth) ──────────
    if (enabled) {
      if (user && (credits ?? 0) < scanCost) {
        openPricing("insufficient_credits");
        return;
      }
    }

    abortRef.current?.abort();
    clearTimers();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ stage: "queue", result: null, error: null });

    // Optimistic stage progression for perceived responsiveness.
    const steps: [ScanStage, number][] = [
      ["launching", 500],
      ["capturing", 1800],
      ["analyzing", 4200],
    ];
    steps.forEach(([stage, delay]) => {
      const id = window.setTimeout(() => {
        setState((s) => (s.stage === "done" || s.stage === "error" ? s : { ...s, stage }));
      }, delay);
      timersRef.current.push(id);
    });

    try {
      const token = enabled ? await getToken() : null;
      const result = await requestScan(normalizeUrl(rawUrl), { signal: controller.signal, token });
      clearTimers();
      if (typeof result.credits === "number") setCredits(result.credits);
      setState({ stage: "done", result, error: null });
    } catch (err) {
      clearTimers();
      if (controller.signal.aborted) return;

      // Billing gates open the right modal instead of showing a raw error.
      if (err instanceof ApiError) {
        if (err.code === "register_required") {
          setState({ stage: "idle", result: null, error: null });
          openPricing("register_required");
          return;
        }
        if (err.code === "insufficient_credits") {
          if (typeof err.credits === "number") setCredits(err.credits);
          setState({ stage: "idle", result: null, error: null });
          openPricing("insufficient_credits");
          return;
        }
      }

      const message =
        err instanceof ApiError
          ? err.message
          : "Could not reach the scan server. Make sure the backend is running.";
      setState({ stage: "error", result: null, error: message });
    }
  }, [enabled, user, credits, scanCost, getToken, setCredits, openPricing]);

  return {
    stage: state.stage,
    stageMessage: STAGE_MESSAGES[state.stage],
    result: state.result,
    error: state.error,
    isBusy: ["queue", "launching", "capturing", "analyzing"].includes(state.stage),
    scan,
    reset,
  };
}
