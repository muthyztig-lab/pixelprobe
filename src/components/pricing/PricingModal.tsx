import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/icons";
import { useAuth } from "@/lib/auth";
import { PRICING_PLANS } from "@/data/pricing";
import { cn } from "@/lib/cn";

/**
 * Centered pricing dialog shown on first visit and whenever the visitor needs
 * an account / more credits. Restrained: no glow, no "most popular" ribbon,
 * uniform cards.
 *
 * The CTA depends on who's looking:
 *  - Logged out → "create a free account" (every plan opens the signup modal).
 *  - Logged in  → the account already exists, so a paid plan must NOT bounce
 *    back to sign-in. There's no checkout backend yet, so we surface an honest
 *    "checkout coming soon" notice instead.
 */
export function PricingModal() {
  const { pricingModal, closeModals, openAuth, user, signupBonus, scanCost } = useAuth();
  const open = pricingModal !== null;
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  // Reset the transient "coming soon" notice whenever the modal opens/closes.
  useEffect(() => {
    if (!open) setPendingPlan(null);
  }, [open]);

  const heading =
    pricingModal === "register_required"
      ? "You've used your free scan"
      : pricingModal === "insufficient_credits"
        ? "You're out of credits"
        : "Analyze your first site free";

  const outOfCreditsSub = user
    ? `Each scan costs ${scanCost} credits. Upgrade your plan to keep scanning.`
    : `Each scan costs ${scanCost} credits. Create or upgrade your account to keep scanning.`;

  const sub =
    pricingModal === "register_required"
      ? `Create a free account and get ${signupBonus} credits — enough for ${Math.floor(signupBonus / scanCost)} more scans.`
      : pricingModal === "insufficient_credits"
        ? outOfCreditsSub
        : `Run one scan on us. Sign up to get ${signupBonus} credits (${scanCost} per scan).`;

  // Footer copy depends on state: a "coming soon" notice once a logged-in user
  // picks a paid plan, otherwise a sign-in prompt for logged-out visitors.
  let footer: ReactNode = null;
  if (pendingPlan) {
    footer = (
      <p className="mt-6 text-center text-[12.5px] leading-relaxed text-ink-dim">
        Paid plans aren't available to purchase just yet. We'll email you at{" "}
        <span className="font-medium text-ink-soft">{user?.email ?? "your account"}</span> the
        moment {pendingPlan} checkout opens.
      </p>
    );
  } else if (!user) {
    footer = (
      <p className="mt-6 text-center text-[12.5px] text-ink-dim">
        Already have an account?{" "}
        <button onClick={() => openAuth("signin")} className="font-medium text-accent hover:text-accent-2">
          Sign in
        </button>
      </p>
    );
  }

  return (
    <Modal open={open} onClose={closeModals} className="max-w-[860px]" label="Pricing">
      <div className="p-7 sm:p-9">
        <div className="text-center">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">{heading}</h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-dim">{sub}</p>
        </div>

        <div className="mt-7 grid items-stretch gap-3.5 sm:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => {
            const free = plan.name === "Free";
            // Logged-in users already have the Free tier; only paid plans are
            // actionable for them, and those have no checkout yet.
            const isCurrentPlan = !!user && free;
            let ctaLabel = free ? "Start free" : plan.cta;
            if (isCurrentPlan) ctaLabel = "Current plan";
            const onCta = () => {
              if (user) {
                if (!free) setPendingPlan(plan.name);
                return;
              }
              openAuth("signup");
            };
            return (
              <div
                key={plan.name}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface p-5",
                  i === 1 ? "border-line" : "border-line-soft",
                )}
              >
                <div className="text-[13px] font-semibold text-ink">{plan.name}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-[26px] font-semibold text-ink">{plan.price}</span>
                  <span className="text-[12px] text-ink-faint">/ {plan.cadence}</span>
                </div>
                <p className="mt-2 min-h-[34px] text-[12px] leading-relaxed text-ink-dim">{plan.blurb}</p>

                <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-ink-soft">
                      <IconCheck size={13} className="mt-0.5 flex-shrink-0 text-emerald" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={free ? "primary" : "outline"}
                  size="sm"
                  className="mt-5 w-full"
                  onClick={onCta}
                  disabled={isCurrentPlan}
                >
                  {ctaLabel}
                </Button>
              </div>
            );
          })}
        </div>

        {footer}
      </div>
    </Modal>
  );
}
