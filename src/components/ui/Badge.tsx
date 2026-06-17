import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "amber" | "emerald" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  brand: "text-white bg-gradient-to-br from-indigo to-accent-2",
  amber: "text-amber bg-amber/10 ring-1 ring-inset ring-amber/25",
  emerald: "text-emerald bg-emerald/10 ring-1 ring-inset ring-emerald/25",
  rose: "text-rose bg-rose/10 ring-1 ring-inset ring-rose/25",
  neutral: "text-ink-soft bg-white/5 ring-1 ring-inset ring-line",
};

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
