import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SHOWCASE_ITEMS, SHOWCASE_CATEGORIES, type ShowcaseItem } from "@/data/showcase";
import {
  IconArrowUpRight,
  IconPalette,
  IconType,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconLock,
  IconDownload,
  IconLoader,
} from "@/icons";
import { useAuth } from "@/lib/auth";
import { requestPrompt, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

export function ShowcasePage() {
  const [category, setCategory] = useState("All");

  const items =
    category === "All" ? SHOWCASE_ITEMS : SHOWCASE_ITEMS.filter((i) => i.category === category);

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Showcase"
        title="Interfaces, decoded"
        subtitle="A gallery of real products people have scanned with PixelProbe — every palette and type pairing pulled straight from the rendered page."
        className="mb-10"
      />

      {/* Category filter */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
        {SHOWCASE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-sm border px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
              category === c
                ? "border-indigo/40 bg-indigo/15 text-accent-2"
                : "border-line bg-white/[0.03] text-ink-soft hover:border-accent/40 hover:text-accent",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Gallery */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ShowcaseCard key={item.host} item={item} />
        ))}
      </div>
    </PageShell>
  );
}

/** A single gallery card: live screenshot of the site, with a palette fallback. */
function ShowcaseCard({ item }: Readonly<{ item: ShowcaseItem }>) {
  const [shotFailed, setShotFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [promptOpen, setPromptOpen] = useState(false);

  // The whole card is a link — intercept so the button opens the modal instead.
  function openPrompt(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPromptOpen(true);
  }

  const site = `https://${item.host}`;
  // WordPress mShots — free, no key, no per-site blocking. It renders the page
  // server-side AFTER it finishes loading (so no half-loaded/blurred frames) and
  // caches the result. Falls back to the palette banner if it ever fails.
  const shot =
    `https://s.wordpress.com/mshots/v1/${encodeURIComponent(site)}?w=800&h=600` +
    (attempt ? `&retry=${attempt}` : "");
  const favicon = `https://www.google.com/s2/favicons?domain=${item.host}&sz=64`;

  // While mShots is still generating an uncached shot it serves a small grey
  // placeholder. Detect that by its narrow width and re-request a few times.
  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth < 600 && attempt < 4) {
      setTimeout(() => setAttempt((a) => a + 1), 2200);
    }
  }

  return (
    <a href={site} target="_blank" rel="noreferrer" className="block">
      <Card interactive className="group h-full overflow-hidden">
        {/* Preview: real screenshot, or a palette banner if it fails to load */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
          {shotFailed ? (
            <div className="flex h-full w-full">
              {item.palette.map((color) => (
                <div key={color} className="flex-1" style={{ background: color }} />
              ))}
            </div>
          ) : (
            <img
              src={shot}
              alt={`${item.title} homepage`}
              loading="lazy"
              onLoad={handleLoad}
              onError={() => setShotFailed(true)}
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          )}
          {/* Slim palette strip — keeps the “extracted tokens” identity */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1.5">
            {item.palette.map((color) => (
              <div key={color} className="flex-1" style={{ background: color }} />
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={favicon}
                alt=""
                width={18}
                height={18}
                className="flex-shrink-0 rounded-sm"
                loading="lazy"
              />
              <h3 className="truncate font-display text-[16px] font-semibold text-white">
                {item.title}
              </h3>
            </div>
            <Badge tone="neutral">{item.category}</Badge>
          </div>
          <div className="mb-3 font-mono text-[12px] text-ink-dim">{item.host}</div>

          {/* Decoded palette — the real "scan payload". Each chip copies its hex. */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
              <IconPalette size={12} />
              <span className="font-mono">{item.palette.length} colors extracted</span>
            </div>
            <div className="flex gap-1.5">
              {item.palette.map((color) => (
                <Swatch key={color} color={color} />
              ))}
            </div>
          </div>

          {/* Recreate-this-design prompt — free teaser, full version is paid. */}
          <button
            type="button"
            onClick={openPrompt}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-sm border border-line bg-white/[0.03] py-2 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
          >
            <IconSparkles size={14} />
            Show prompt
          </button>

          <div className="flex items-center justify-between border-t border-line-soft pt-3">
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-soft">
              <IconType size={13} className="flex-shrink-0 text-ink-faint" />
              <span className="truncate">{item.fonts}</span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Visit site <IconArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </Card>

      <PromptModal item={item} open={promptOpen} onClose={() => setPromptOpen(false)} />
    </a>
  );
}

/** A single colour chip from the extracted palette. Click to copy its hex. */
function Swatch({ color }: Readonly<{ color: string }>) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    // The whole card is a link — don't navigate when grabbing a colour.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1100);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${color}`}
      className="group/sw relative h-7 flex-1 rounded-sm border border-white/10 transition-transform duration-200 hover:z-10 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      style={{ background: color }}
    >
      {/* Hex tooltip on hover — reveals the actual token */}
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-1.5 py-0.5 font-mono text-[10px] text-white/90 opacity-0 backdrop-blur transition-opacity group-hover/sw:opacity-100">
        {copied ? "Copied!" : color}
      </span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
          <IconCheck size={13} />
        </span>
      )}
    </button>
  );
}

/**
 * Prompt modal: shows the free one-line teaser, then unlocks the full
 * "recreate this design" prompt for credits via the server (which is the only
 * place credits are actually charged). Once unlocked it can be copied or
 * downloaded as a .txt.
 */
function PromptModal({
  item,
  open,
  onClose,
}: Readonly<{ item: ShowcaseItem; open: boolean; onClose: () => void }>) {
  const { enabled, user, credits, promptCost, getToken, setCredits, openPricing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullPrompt, setFullPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const costLabel = enabled ? `${promptCost} credits` : "free";

  async function handleUnlock() {
    setError(null);

    // Client-side gates (the server still enforces them).
    if (enabled && !user) {
      onClose();
      openPricing("register_required");
      return;
    }
    if (enabled && user && (credits ?? 0) < promptCost) {
      onClose();
      openPricing("insufficient_credits");
      return;
    }

    setLoading(true);
    try {
      const token = enabled ? await getToken() : null;
      const { prompt, credits: newCredits } = await requestPrompt(item.host, { token });
      if (typeof newCredits === "number") setCredits(newCredits);
      setFullPrompt(prompt);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "register_required") {
          onClose();
          openPricing("register_required");
          return;
        }
        if (err.code === "insufficient_credits") {
          if (typeof err.credits === "number") setCredits(err.credits);
          onClose();
          openPricing("insufficient_credits");
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "Could not unlock the prompt. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!fullPrompt) return;
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  function handleDownload() {
    if (!fullPrompt) return;
    const blob = new Blob([fullPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.host.replace(/\./g, "-")}-prompt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg" label={`${item.title} design prompt`}>
      <div className="p-6">
        <div className="mb-1 flex items-center gap-2 text-accent">
          <IconSparkles size={16} />
          <span className="font-mono text-[11px] uppercase tracking-wider">Design prompt</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-white">{item.title}</h2>
        <p className="mb-4 font-mono text-[12px] text-ink-dim">{item.host}</p>

        {/* Free teaser — always visible */}
        <div className="mb-4 rounded-lg border border-line-soft bg-white/[0.02] p-4">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Preview
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink-soft">{item.promptPreview}</p>
        </div>

        {fullPrompt ? (
          <>
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-emerald">
              <IconCheck size={14} /> Full prompt unlocked
            </div>
            <pre className="mb-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-line-soft bg-black/30 p-4 font-mono text-[12px] leading-relaxed text-ink-soft">
              {fullPrompt}
            </pre>
            <div className="flex gap-2.5">
              <Button variant="outline" size="sm" leftIcon={<IconCopy size={14} />} onClick={handleCopy}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconDownload size={14} />}
                onClick={handleDownload}
              >
                Download .txt
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Locked full prompt — blurred lines hint at what's behind the paywall */}
            <div className="relative mb-4 overflow-hidden rounded-lg border border-line-soft bg-black/20 p-4">
              <div aria-hidden className="select-none space-y-2 blur-[5px]">
                {["ROLE — senior product designer + front-end engineer", "COLOR SYSTEM — 5 extracted tokens with roles", "TYPOGRAPHY — pairing, sizes, tracking & rhythm", "LAYOUT — nav, hero, feature sections, footer", "MOTION + ready-to-paste CSS custom properties"].map(
                  (line) => (
                    <div key={line} className="font-mono text-[12px] text-ink-soft">
                      {line}
                    </div>
                  ),
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg-soft/40">
                <span className="flex items-center gap-1.5 rounded-full border border-line bg-bg-soft/80 px-3 py-1 text-[12px] font-medium text-ink-soft backdrop-blur">
                  <IconLock size={13} /> Full prompt locked
                </span>
              </div>
            </div>

            {error && <p className="mb-3 text-[12.5px] text-rose">{error}</p>}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleUnlock}
              disabled={loading}
              leftIcon={
                loading ? (
                  <IconLoader size={15} className="animate-spin" />
                ) : (
                  <IconDownload size={15} />
                )
              }
            >
              {loading ? "Unlocking…" : `Download full prompt · ${costLabel}`}
            </Button>
            <p className="mt-2.5 text-center text-[11.5px] text-ink-faint">
              {enabled
                ? `Charges ${promptCost} credits to your account.`
                : "Accounts are off — the full prompt is free here."}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
