import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-soft bg-surface backdrop-blur-xl",
        interactive &&
          "transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
