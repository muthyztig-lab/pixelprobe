import { useState } from "react";
import { IconCopy, IconCheck } from "@/icons";
import { cn } from "@/lib/cn";

/** Copies text to the clipboard and flips to a check for a moment. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:text-white",
        copied && "border-emerald/40 text-emerald",
        className,
      )}
    >
      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}
