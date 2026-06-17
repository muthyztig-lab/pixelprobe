import { useEffect, useState } from "react";
import { normalizeUrl } from "@/lib/format";
import { cn } from "@/lib/cn";
import { IconGlobe } from "@/icons";

/**
 * "Live preview" capture window shown while a scan runs. It loads a real
 * screenshot of the entered site (WordPress mShots — free, no key) shrunk to fit
 * the frame, dressed as a scanner: targeting brackets, a gliding scan line, a
 * REC dot and a footer ticker naming what's being extracted right now.
 */
const PHASES = [
  "Reading DOM styles…",
  "Sampling colors…",
  "Detecting fonts…",
  "Measuring spacing…",
  "Capturing layout…",
] as const;

export function LivePreview({
  url,
  active,
  className,
}: Readonly<{ url: string; active: boolean; className?: string }>) {
  const site = normalizeUrl(url);
  const host = site.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState(0);

  // Request the shot at the window's aspect (16:10) so the whole screenshot fits
  // the frame, shrunk — no zoom, no crop. While mShots is still generating an
  // uncached shot it serves a small WP "Generating Preview…" placeholder — we
  // never show that; we keep our skeleton and re-request until the real one lands.
  const shot =
    `https://s.wordpress.com/mshots/v1/${encodeURIComponent(site)}?w=800&h=500` +
    (attempt ? `&retry=${attempt}` : "");

  // Reset the loaded state whenever the target URL changes.
  useEffect(() => {
    setLoaded(false);
    setAttempt(0);
  }, [site]);

  // Cycle the footer ticker while the scan is active.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 1400);
    return () => window.clearInterval(id);
  }, [active]);

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    // Real screenshots come back at the requested width; the placeholder is
    // much narrower. Only reveal the image once it's the real thing.
    if (e.currentTarget.naturalWidth >= 600) {
      setLoaded(true);
    } else if (attempt < 6) {
      window.setTimeout(() => setAttempt((a) => a + 1), 2000);
    }
  }

  return (
    <div className={cn("select-none", className)}>
      <div className="fade-up w-full">
        {/* Status row */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(52,211,153,0.8)] pulse-glow" />
            {active ? "Scanning…" : "Live preview"}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            mShots
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          {/* Browser chrome with address bar + REC indicator */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <span className="flex flex-shrink-0 gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
              <span className="h-2 w-2 rounded-full bg-white/15" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-black/30 px-2 py-1">
              <IconGlobe size={10} className="flex-shrink-0 text-ink-faint" />
              <span className="truncate font-mono text-[10px] text-ink-dim">{host}</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-rose/90">
              <span className="h-1.5 w-1.5 rounded-full bg-rose pulse-glow" />
              rec
            </span>
          </div>

          {/* Viewport — the whole screenshot, shrunk to fit (16:10). */}
          <div className="relative aspect-[16/10] overflow-hidden bg-bg">
            {/* Wireframe placeholder — shown until the real screenshot loads. */}
            <div className="preview-skeleton absolute inset-0" />

            <img
              src={shot}
              alt={`${host} preview`}
              onLoad={handleLoad}
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />

            {/* Scan line gliding up and down. */}
            <div className="preview-scan" />

            {/* Targeting reticle — corner brackets. */}
            <span className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 rounded-tl-sm border-l-2 border-t-2 border-accent/70" />
            <span className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 rounded-tr-sm border-r-2 border-t-2 border-accent/70" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 rounded-bl-sm border-b-2 border-l-2 border-accent/70" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 rounded-br-sm border-b-2 border-r-2 border-accent/70" />

            {/* Inset hairline + soft vignette for depth. */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,7,15,0.45)_100%)]" />
          </div>

          {/* Footer ticker — what's being extracted right now. */}
          <div className="sheen-host flex items-center gap-2 border-t border-white/[0.06] px-3 py-2">
            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-accent-2 pulse-glow" />
            <span className="truncate font-mono text-[10px] text-ink-dim">
              {active ? PHASES[phase] : "Ready to capture"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
