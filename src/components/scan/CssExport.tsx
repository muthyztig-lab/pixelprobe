import type { ScanResult as ScanResultData } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { IconCode2 } from "@/icons";

/** Title-cases the first label of a hostname → e.g. "shopify.com" → "Shopify". */
function siteName(host: string): string {
  const label = host.replace(/^www\./, "").split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * CSS Exporter view — turns a scan into ready-to-use `:root` custom properties.
 * Same scan data as the Visual Inspector, just presented as copy/paste CSS.
 */
export function CssExport({ data }: { data: ScanResultData }) {
  const css = data.cssVariables?.trim() ?? "";

  if (!css) {
    return (
      <Card className="fade-up mx-auto max-w-[640px] p-5 text-center text-[13px] text-ink-dim">
        This scan didn’t produce any CSS variables.
      </Card>
    );
  }

  const lineCount = css.split("\n").length;
  const varCount = (css.match(/^\s*--/gm) ?? []).length;

  return (
    <Card className="fade-up w-full overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line-soft px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-accent">
          <IconCode2 size={16} />
          <h3 className="font-display text-sm font-semibold text-white">CSS variables</h3>
          <Badge>{varCount} tokens</Badge>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton value={css} label="Copy CSS" />
          <DownloadButton
            value={css}
            filename={`${siteName(data.host)}.css`}
            mime="text/css"
            label={`Download ${siteName(data.host)}.css`}
          />
        </div>
      </div>

      <div className="max-h-[36rem] overflow-auto bg-black/20 px-5 py-4">
        <pre className="font-mono text-[12.5px] leading-relaxed text-ink-soft">
          <code>{css}</code>
        </pre>
      </div>

      <div className="border-t border-line-soft px-5 py-2.5 font-mono text-[11px] text-ink-faint">
        {data.host} · {lineCount} lines · drop into your stylesheet and use{" "}
        <span className="text-accent-2">var(--color-…)</span>
      </div>
    </Card>
  );
}
