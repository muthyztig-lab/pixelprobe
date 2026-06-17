import { Link } from "react-router-dom";
import { FOOTER_LINKS } from "@/data/navigation";
import { IconGithub, IconTwitter } from "@/icons";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line-soft">
      <div className="mx-auto grid max-w-[1140px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 sm:grid-cols-3 sm:px-7 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-[13px] leading-relaxed text-ink-dim">
            Paste a link and extract the colors, spacing, typography and component patterns of any
            interface into ready-to-use design tokens.
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-white/[0.03] text-ink-dim transition-colors hover:text-white"
            >
              <IconGithub size={16} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-white/[0.03] text-ink-dim transition-colors hover:text-white"
            >
              <IconTwitter size={14} />
            </a>
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
              {col.title}
            </span>
            {col.links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-[13px] text-ink-soft transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-3 border-t border-line-soft px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-ink-faint sm:flex-row sm:px-7">
        <span>© {new Date().getFullYear()} PixelProbe. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <Link to="/" className="transition-colors hover:text-ink-soft">
            Privacy
          </Link>
          <Link to="/" className="transition-colors hover:text-ink-soft">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
