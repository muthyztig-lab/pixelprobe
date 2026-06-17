import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PRICING_PLANS, PRICING_FAQ } from "@/data/pricing";
import { IconCheck } from "@/icons";
import { useAuth } from "@/lib/auth";

export function PricingPage() {
  const { user } = useAuth();

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Pricing"
        title="Simple, scan-based pricing"
        subtitle="Start free, upgrade when you scan every day. No hidden fees, cancel anytime."
        className="mb-14"
      />

      {/* Plans */}
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          // A logged-in user is on the Free tier by default, so its card
          // reflects that rather than inviting them to "start free" again.
          const isCurrentPlan = !!user && plan.name === "Free";
          return (
          <Card
            key={plan.name}
            interactive
            className="relative flex h-full flex-col p-7"
          >
            <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
            <p className="mt-1 mb-5 min-h-10 text-[13px] text-ink-dim">{plan.blurb}</p>
            <div className="mb-6 flex items-end gap-1.5">
              <span className="font-display text-4xl font-bold tracking-tight text-white">{plan.price}</span>
              <span className="mb-1 text-[13px] text-ink-dim">/ {plan.cadence}</span>
            </div>
            <Button variant="outline" size="lg" className="w-full" disabled={isCurrentPlan}>
              {isCurrentPlan ? "Current plan" : plan.cta}
            </Button>
            <div className="mt-6 flex flex-col gap-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                    <IconCheck size={11} />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-2xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" className="mb-10" />
        <div className="flex flex-col gap-3">
          {PRICING_FAQ.map((item) => (
            <Card key={item.q} className="p-5">
              <h4 className="mb-1.5 font-display text-[14.5px] font-semibold text-white">{item.q}</h4>
              <p className="text-[13.5px] leading-relaxed text-ink-dim">{item.a}</p>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-[13px] text-ink-dim">
          Still have questions?{" "}
          <Link to="/" className="font-medium text-accent hover:text-accent-2">
            Talk to us →
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
