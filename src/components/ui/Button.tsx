import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-sm cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/60 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-indigo to-violet shadow-[0_2px_16px_rgba(99,102,241,0.28)] hover:brightness-110",
  ghost: "text-ink-soft hover:text-white hover:bg-white/[0.07]",
  outline:
    "text-ink-soft border border-line bg-white/[0.03] hover:border-white/20 hover:text-white hover:bg-white/[0.06]",
  subtle: "text-accent-2 bg-indigo/15 ring-1 ring-inset ring-indigo/30 hover:bg-indigo/25",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3.5 py-1.5",
  md: "text-[13px] px-4.5 py-2",
  lg: "text-sm px-6 py-3",
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
