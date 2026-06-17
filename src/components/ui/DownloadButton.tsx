import { IconDownload } from "@/icons";
import { cn } from "@/lib/cn";

/** Triggers a client-side download of `value` as a file named `filename`. */
export function DownloadButton({
  value,
  filename,
  label = "Download",
  mime = "text/markdown",
  className,
}: {
  value: string;
  filename: string;
  label?: string;
  mime?: string;
  className?: string;
}) {
  function handleDownload() {
    const blob = new Blob([value], { type: `${mime};charset=utf-8` });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Free the object URL a tick later so the download can start.
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  return (
    <button
      onClick={handleDownload}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:text-white",
        className,
      )}
      title={`Download ${filename}`}
    >
      <IconDownload size={12} />
      {label}
    </button>
  );
}
