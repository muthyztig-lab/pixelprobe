import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Standard inner-page wrapper with top padding to clear the fixed navbar. */
export function PageShell({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <main
      className={cn(
        "relative z-10 mx-auto w-full max-w-[1140px] px-5 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-7",
        className,
      )}
    >
      {children}
    </main>
  );
}
