import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { NAV_LINKS } from "@/data/navigation";
import { IconZap, IconLogOut, IconUser, IconMenu, IconX, IconScroll } from "@/icons";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { HistoryModal } from "@/components/history/HistoryModal";
import { cn } from "@/lib/cn";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enabled, user, credits, openAuth, openPricing, signOut, scanCost } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const lowCredits = (credits ?? 0) < scanCost;

  return (
    <nav className="fixed inset-x-0 top-0 z-[200] border-b border-line-soft bg-bg/65 backdrop-blur-2xl backdrop-saturate-150 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[58px] max-w-[1140px] items-center justify-between px-5 sm:px-7">
        <NavLink to="/" aria-label="PixelProbe home">
          <Logo />
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                  isActive ? "bg-white/[0.06] text-white" : "text-ink-soft hover:bg-white/[0.07] hover:text-white",
                )
              }
            >
              <Icon size={13} className="opacity-70" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop account / auth cluster */}
          <div className="hidden items-center gap-2 md:flex">
            {enabled && user ? (
              <>
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold",
                    lowCredits ? "border-rose/20 bg-rose/[0.07] text-rose/85" : "border-line bg-white/[0.04] text-ink-soft",
                  )}
                >
                  <IconZap size={12} />
                  <span>{credits ?? "—"}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
                    aria-label="Account menu"
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-sm border border-line bg-white/[0.04] text-ink-soft transition-colors hover:text-white"
                  >
                    <IconUser size={15} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-[42px] w-56 overflow-hidden rounded-md border border-line bg-bg-soft shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
                      <div className="border-b border-line-soft px-4 py-3">
                        <div className="truncate text-[12.5px] font-medium text-ink">{user.email}</div>
                        <div className="mt-0.5 text-[11.5px] text-ink-dim">{credits ?? 0} credits</div>
                      </div>
                      <button
                        onMouseDown={() => {
                          setMenuOpen(false);
                          setHistoryOpen(true);
                        }}
                        className="flex w-full items-center gap-2 border-b border-line-soft px-4 py-2.5 text-left text-[13px] text-ink-soft transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        <IconScroll size={14} /> History
                      </button>
                      <button
                        onMouseDown={() => signOut()}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-ink-soft transition-colors hover:bg-white/[0.05] hover:text-white"
                      >
                        <IconLogOut size={14} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : enabled ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("signin")}>
                  Sign in
                </Button>
                <Button size="sm" onClick={() => openPricing("intro")}>
                  Get started
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/pricing")}>
                Get started
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-sm border border-line bg-white/[0.04] text-ink-soft transition-colors hover:text-white md:hidden"
          >
            {mobileOpen ? <IconX size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[58px] z-[-1] bg-black/40 backdrop-blur-sm md:hidden"
          />
          <div className="fade-up-1 border-t border-line-soft bg-bg/95 backdrop-blur-2xl md:hidden">
            <div className="mx-auto flex max-w-[1140px] flex-col gap-1 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {NAV_LINKS.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3.5 py-3 text-[15px] font-medium transition-colors",
                      isActive ? "bg-white/[0.07] text-white" : "text-ink-soft active:bg-white/[0.05]",
                    )
                  }
                >
                  <Icon size={17} className="opacity-70" />
                  {label}
                </NavLink>
              ))}

              <div className="my-2 h-px bg-line-soft" />

              {enabled && user ? (
                <>
                  <div className="flex items-center justify-between rounded-md px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-ink">{user.email}</div>
                      <div className="text-[12px] text-ink-dim">{credits ?? 0} credits</div>
                    </div>
                    <span
                      className={cn(
                        "flex flex-shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold",
                        lowCredits ? "border-rose/20 bg-rose/[0.07] text-rose/85" : "border-line bg-white/[0.04] text-ink-soft",
                      )}
                    >
                      <IconZap size={12} />
                      {credits ?? "—"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      setHistoryOpen(true);
                    }}
                  >
                    <IconScroll size={16} /> History
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => signOut()}>
                    <IconLogOut size={16} /> Sign out
                  </Button>
                </>
              ) : enabled ? (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="lg" className="w-full" onClick={() => openAuth("signin")}>
                    Sign in
                  </Button>
                  <Button size="lg" className="w-full" onClick={() => openPricing("intro")}>
                    Get started
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={() => navigate("/pricing")}>
                  Get started
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </nav>
  );
}
