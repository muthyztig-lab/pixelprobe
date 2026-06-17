import type { ScanResult as ScanResultData } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { TokenSwatch } from "./TokenSwatch";
import { MarkdownView } from "./MarkdownView";
import { ScanShots } from "./ScanShots";
import { IconPalette, IconType, IconRuler, IconBox, IconLayers, IconFileText } from "@/icons";

/** Title-cases the first label of a hostname → e.g. "shopify.com" → "Shopify". */
function siteName(host: string): string {
  const label = host.replace(/^www\./, "").split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-accent">
        {icon}
        <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export function ScanResult({ data }: { data: ScanResultData }) {
  return (
    <div className="fade-up flex w-full flex-col gap-4">
      {/* Header */}
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="emerald">Scan complete</Badge>
            <span className="font-mono text-xs text-ink-dim">{data.host}</span>
          </div>
          <p className="max-w-2xl text-[14px] leading-relaxed text-ink-soft">{data.summary}</p>
          {data.vibe && (
            <p className="text-[13px] text-ink-dim">
              <span className="text-accent-2">Vibe:</span> {data.vibe}
            </p>
          )}
        </div>
        <span className="whitespace-nowrap font-mono text-[11px] text-ink-faint">
          {data.screenshots} shots · {data.model}
        </span>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Colors */}
        <Panel icon={<IconPalette size={16} />} title="Color palette">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.colors.map((c) => (
              <TokenSwatch key={c.hex + c.name} token={c} />
            ))}
          </div>
        </Panel>

        {/* Typography */}
        <Panel icon={<IconType size={16} />} title="Typography">
          <div className="flex flex-col gap-2.5">
            {data.fonts.map((f) => (
              <div key={f.role} className="rounded-md border border-line-soft bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink" style={{ fontFamily: `'${f.family}', sans-serif` }}>
                    {f.family}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-accent">{f.role}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-ink-dim">
                  weights {f.weights} · fallback {f.fallback}
                </div>
                {f.notes && <div className="mt-1 text-[12px] text-ink-dim">{f.notes}</div>}
              </div>
            ))}
          </div>
        </Panel>

        {/* Spacing */}
        <Panel icon={<IconRuler size={16} />} title="Spacing scale">
          <div className="flex flex-wrap gap-2">
            {data.spacing.map((s) => (
              <span
                key={s.name}
                className="rounded-sm border border-line-soft bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-ink-soft"
              >
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </Panel>

        {/* Radii & shadows */}
        <Panel icon={<IconBox size={16} />} title="Radii & shadows">
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">Radii</div>
              <div className="flex flex-wrap gap-2">
                {data.radii.map((r) => (
                  <span key={r} className="rounded-sm border border-line-soft px-2.5 py-1 font-mono text-[11px] text-ink-soft">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">Shadows</div>
              <div className="flex flex-col gap-1.5">
                {data.shadows.map((s) => (
                  <span key={s} className="truncate font-mono text-[11px] text-ink-soft">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Components */}
      <Panel icon={<IconLayers size={16} />} title="Component patterns">
        <div className="flex flex-wrap gap-2">
          {data.components.map((c) => (
            <span
              key={c}
              className="rounded-sm border border-indigo/25 bg-indigo/10 px-3 py-1 text-[12px] font-medium text-accent-2"
            >
              {c}
            </span>
          ))}
        </div>
      </Panel>

      {/* What the scan saw — captured full-page screenshots */}
      {data.shots && data.shots.length > 0 && <ScanShots shots={data.shots} host={data.host} />}

      {/* Full A→Z design prompt */}
      {data.markdownPrompt && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line-soft px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-accent">
              <IconFileText size={16} />
              <h3 className="font-display text-sm font-semibold text-white">Design prompt</h3>
              </div>
            <div className="flex items-center gap-2">
              <CopyButton value={data.markdownPrompt} label="Copy markdown" />
              <DownloadButton value={data.markdownPrompt} filename={`${siteName(data.host)}.md`} label={`Download ${siteName(data.host)}.md`} />
            </div>
          </div>
          <div className="max-h-[36rem] overflow-auto px-5 py-4">
            <MarkdownView markdown={data.markdownPrompt} />
          </div>
        </Card>
      )}
    </div>
  );
}
