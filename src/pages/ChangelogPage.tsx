import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CHANGELOG } from "@/data/changelog";
import { IconCheck } from "@/icons";

const TAG_TONE = { New: "brand", Improved: "emerald", Fixed: "amber" } as const;

export function ChangelogPage() {
  return (
    <PageShell>
      <SectionHeading
        eyebrow="Changelog"
        title="What's new in PixelProbe"
        subtitle="Every release, fix and improvement — shipped continuously."
        className="mb-14"
      />

      <div className="relative mx-auto max-w-2xl sm:-translate-x-8">
        {/* Timeline spine */}
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-indigo/40 via-line to-transparent sm:left-[calc(4rem+7px)]" />

        <div className="flex flex-col gap-8">
          {CHANGELOG.map((entry) => (
            <div
              key={entry.version}
              className="relative flex flex-col gap-3 pl-7 sm:flex-row sm:gap-6 sm:pl-0"
            >
              {/* Date + version */}
              <div className="flex items-baseline gap-2.5 sm:w-15 sm:flex-col sm:items-end sm:gap-1 sm:pt-0.5">
                <div className="font-display text-sm font-bold text-accent-2">{entry.version}</div>
                <div className="font-mono text-[11px] text-ink-faint">{entry.date}</div>
              </div>

              {/* Dot on the spine */}
              <div className="absolute left-[1px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-indigo bg-bg pulse-glow sm:left-16" />

              {/* Card */}
              <Card className="flex-1 p-5 sm:ml-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={TAG_TONE[entry.tag]}>{entry.tag}</Badge>
                  <h3 className="font-display text-[15.5px] font-semibold text-white">{entry.title}</h3>
                </div>
                <p className="mb-3 text-[13.5px] leading-relaxed text-ink-dim">{entry.body}</p>
                <div className="flex flex-col gap-1.5">
                  {entry.points.map((p) => (
                    <div key={p} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <IconCheck size={13} className="mt-0.5 flex-shrink-0 text-emerald" />
                      {p}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
