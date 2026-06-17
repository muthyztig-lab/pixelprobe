import { ScanConsole } from "@/components/scan/ScanConsole";

export function HomePage() {
  return (
    <main className="relative z-10">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-[1140px] flex-col items-center px-5 pb-16 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-7 sm:pt-20">
        <h1 className="fade-up-2 mb-5 max-w-3xl text-center font-display text-[clamp(40px,6.5vw,72px)] font-bold leading-[1.06] tracking-[-2.5px] text-white">
          Extract the DNA of <span className="text-gradient">any interface</span>
        </h1>
        <p className="fade-up-3 mb-9 max-w-md text-center text-[16px] leading-relaxed text-ink-dim">
          Paste a link — get colors, spacing, fonts, and component patterns broken down into
          ready-to-use <span className="font-medium text-accent-2">design tokens</span>.
        </p>

        <ScanConsole />
      </section>
    </main>
  );
}
