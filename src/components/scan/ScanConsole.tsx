import { lazy, Suspense, useState } from "react";
import { useScan } from "@/hooks/useScan";
import { LivePreview } from "./LivePreview";
import { SUGGESTIONS } from "@/data/navigation";
import {
  IconGlobe,
  IconArrowRight,
  IconSparkles,
  IconCode2,
  IconPalette,
  IconVariable,
  IconScan,
  IconLoader,
  IconZap,
} from "@/icons";
import { Badge } from "@/components/ui/Badge";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Result views render only after a scan completes, so we split them out — this
// keeps react-markdown (heavy) out of the initial homepage bundle.
const ScanResult = lazy(() => import("./ScanResult").then((m) => ({ default: m.ScanResult })));
const CssExport = lazy(() => import("./CssExport").then((m) => ({ default: m.CssExport })));

const FEATURES = [
  { icon: <IconPalette size={14} />, label: "Color palette" },
  { icon: <IconVariable size={14} />, label: "Design tokens" },
  { icon: <IconScan size={14} />, label: "Full-page capture" },
];

export function ScanConsole() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"inspector" | "exporter">("inspector");
  const { stage, stageMessage, result, error, isBusy, scan, reset } = useScan();

  function run() {
    if (url.trim()) scan(url);
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Tab switcher */}
      <div className="fade-up-3 mb-5 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        {(["inspector", "exporter"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-xs px-4 py-1.5 text-[12.5px] font-medium transition-all duration-200",
                active ? "bg-indigo/20 text-accent-2 ring-1 ring-inset ring-indigo/40" : "text-ink-dim hover:text-ink-soft",
              )}
            >
              {t === "inspector" ? <IconSparkles size={14} /> : <IconCode2 size={14} />}
              {t === "inspector" ? "Visual Inspector" : "CSS Exporter"}
              {t === "exporter" && <Badge>New</Badge>}
            </button>
          );
        })}
      </div>

      {/* Feature pills */}
      <div className="fade-up-3 mb-8 flex flex-wrap items-center justify-center gap-2">
        {FEATURES.map((f) => (
          <Pill key={f.label} icon={f.icon}>
            {f.label}
          </Pill>
        ))}
      </div>

      {/* Input */}
      <div className="fade-up-4 mb-4 w-full max-w-[640px]">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-4.5 pr-2 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/20",
            isBusy && "scanning",
          )}
        >
          <IconGlobe size={16} className="flex-shrink-0 text-ink-faint" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="drop a URL and let's go..."
          disabled={isBusy}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink caret-accent outline-none placeholder:text-ink-faint disabled:opacity-60"
        />
          <Button
            onClick={run}
            disabled={isBusy}
            rightIcon={isBusy ? undefined : <IconArrowRight size={14} />}
            variant="outline"
            size="sm"
            className="border-white/12 bg-white/[0.07] px-4 py-2 text-white hover:bg-white/[0.12]"
          >
            {isBusy ? <IconLoader size={14} className="spin" /> : "Run scan"}
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="fade-up-5 mb-9 flex flex-wrap items-center justify-center gap-1.5">
        <span className="mr-1 text-xs text-ink-faint">Try:</span>
        {SUGGESTIONS.map((site) => (
          <button
            key={site}
            onClick={() => setUrl(site)}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1 text-[12.5px] text-ink-soft backdrop-blur-md transition-all hover:border-accent/50 hover:bg-indigo/10 hover:text-accent"
          >
            {site}
          </button>
        ))}
      </div>

      {/* State body */}
      <div className="w-full max-w-[760px]">
        {stage === "idle" && <IdleNote />}
        {isBusy && (
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4">
            {url.trim() && (
              <LivePreview url={url} active={isBusy} className="w-full max-w-[460px]" />
            )}
            <ProgressNote message={stageMessage} />
          </div>
        )}
        {stage === "error" && <ErrorNote message={error ?? "Unknown error"} onRetry={reset} />}
        {stage === "done" && result && (
          <div className="flex flex-col items-center gap-4">
            <Suspense
              fallback={
                <div className="flex w-full justify-center py-10 text-accent-2">
                  <IconLoader size={20} className="spin" />
                </div>
              }
            >
              {tab === "inspector" ? <ScanResult data={result} /> : <CssExport data={result} />}
            </Suspense>
            <Button variant="outline" size="sm" onClick={reset}>
              Scan another interface
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function IdleNote() {
  return (
    <Card className="fade-up-6 mx-auto flex max-w-[640px] items-start gap-4 border-amber/20 bg-amber/[0.04] p-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-amber/20 bg-amber/10 text-amber">
        <IconZap size={14} />
      </div>
      <div>
        <div className="mb-1 text-[13.5px] font-bold text-amber">Paste a link to begin</div>
        <p className="text-[13px] leading-relaxed text-ink-dim">
          We open the page in a real browser, scroll through it, capture screenshots and let the
          vision model break the design down into tokens. Your first scan is free — create an
          account for more credits.
        </p>
      </div>
    </Card>
  );
}

function ProgressNote({ message }: { message: string }) {
  return (
    <Card className="sheen-host fade-up mx-auto flex max-w-[640px] flex-col gap-3 p-5">
      <div className="flex items-center gap-2.5 text-accent-2">
        <IconLoader size={16} className="spin" />
        <span className="text-[13.5px] font-semibold">{message}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="shimmer h-full w-full rounded-full" />
      </div>
    </Card>
  );
}

function ErrorNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="fade-up mx-auto flex max-w-[640px] items-start gap-4 border-rose/25 bg-rose/[0.05] p-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-rose/25 bg-rose/10 text-rose">
        <IconZap size={14} />
      </div>
      <div className="flex-1">
        <div className="mb-1 text-[13.5px] font-bold text-rose">Scan failed</div>
        <p className="mb-3 text-[13px] leading-relaxed text-ink-dim">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}
