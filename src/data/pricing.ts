export interface PricingPlan {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  highlighted: boolean;
  cta: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For trying PixelProbe on a few interfaces.",
    highlighted: false,
    cta: "Start free",
    features: [
      "5 scans per month",
      "Color palette extraction",
      "Basic font detection",
      "Copy CSS variables",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "per month",
    blurb: "For designers and developers who scan every day.",
    highlighted: false,
    cta: "Upgrade to Pro",
    features: [
      "100 scans per month",
      "Full typography breakdown",
      "Spacing & radius tokens",
      "Component pattern detection",
      "Export to CSS, JSON & Figma",
      "Priority rendering queue",
    ],
  },
  {
    name: "Team",
    price: "$59",
    cadence: "per month",
    blurb: "For teams building a shared design language.",
    highlighted: false,
    cta: "Start team trial",
    features: [
      "Unlimited scans",
      "Shared token libraries",
      "5 team seats included",
      "Version history & diffs",
      "API access + webhooks",
      "Dedicated support",
    ],
  },
];

export const PRICING_FAQ = [
  {
    q: "How does a scan actually work?",
    a: "You paste a URL, our renderer opens the page in a real headless browser, auto-scrolls and captures 2–3 screenshots, then a vision model analyzes the typography, color and spacing and returns ready-to-use design tokens.",
  },
  {
    q: "Do scans roll over each month?",
    a: "Unused scans on Free and Pro reset at the start of each billing cycle. Team plans are unlimited, so there is nothing to roll over.",
  },
  {
    q: "Can I export tokens to my own pipeline?",
    a: "Yes. Pro and Team can export to CSS custom properties, JSON design tokens (W3C format) and a Figma-ready variables file.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan never expires. Team plans include a 14-day trial with no credit card required.",
  },
];
