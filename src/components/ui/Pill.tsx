import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small label chip with a leading icon — used for feature highlights. */
export function Pill({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-soft backdrop-blur-md",
        className,
      )}
    >
      {icon && <span className="flex text-accent">{icon}</span>}
      {children}
    </div>
  );
}
