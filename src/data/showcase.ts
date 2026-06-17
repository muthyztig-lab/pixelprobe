export interface ShowcaseItem {
  host: string;
  title: string;
  category: string;
  palette: string[];
  fonts: string;
  accent: string;
  /** Free one-line teaser of the design prompt — the full version is paid. */
  promptPreview: string;
}

/** Sample gallery of interfaces people have scanned. */
export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    host: "shopify.com",
    title: "Shopify",
    category: "E-commerce",
    palette: ["#008060", "#004c3f", "#f6f6f7", "#202223", "#5c6ac4"],
    fonts: "Inter · ShopifySans",
    accent: "#008060",
    promptPreview:
      "Build a high-trust commerce landing page: deep emerald primary, warm photographic hero, generous whitespace and a confident single CTA.",
  },
  {
    host: "framer.com",
    title: "Framer",
    category: "Design tools",
    palette: ["#0099ff", "#111111", "#ffffff", "#8855ff", "#1d1d1d"],
    fonts: "Inter Display · Framer",
    accent: "#0099ff",
    promptPreview:
      "Design a bold dark marketing page with an oversized display headline, electric-blue accent and a playful grid of product previews.",
  },
  {
    host: "resend.com",
    title: "Resend",
    category: "Developer",
    palette: ["#000000", "#ffffff", "#6c47ff", "#fafafa", "#8b8b8b"],
    fonts: "Inter · Geist Mono",
    accent: "#6c47ff",
    promptPreview:
      "Craft a developer-first hero: pure-black canvas, a soft violet light beam, crisp Geist Mono labels and a minimal two-button CTA.",
  },
  {
    host: "clerk.dev",
    title: "Clerk",
    category: "Auth",
    palette: ["#6c47ff", "#1a1523", "#ffffff", "#f4f2ff", "#2f2546"],
    fonts: "Inter · SF Pro",
    accent: "#6c47ff",
    promptPreview:
      "Make a polished auth product page: deep plum background, violet primary, glassy sign-in card and reassuring security microcopy.",
  },
  {
    host: "planetscale.com",
    title: "PlanetScale",
    category: "Database",
    palette: ["#000000", "#f9f9f9", "#3641e9", "#171717", "#e5e5e5"],
    fonts: "ABC Diatype · Mono",
    accent: "#3641e9",
    promptPreview:
      "Design a precise database landing page: stark black-on-white, an indigo accent, technical mono captions and a tidy feature grid.",
  },
  {
    host: "linear.app",
    title: "Linear",
    category: "Productivity",
    palette: ["#5e6ad2", "#08090a", "#f7f8f8", "#222326", "#8a8f98"],
    fonts: "Inter Variable",
    accent: "#5e6ad2",
    promptPreview:
      "Recreate a sleek productivity hero: near-black UI, indigo-periwinkle accent, ultra-tight typography and subtle gradient glows.",
  },
  {
    host: "vercel.com",
    title: "Vercel",
    category: "Cloud",
    palette: ["#000000", "#ffffff", "#0070f3", "#fafafa", "#666666"],
    fonts: "Geist · Geist Mono",
    accent: "#0070f3",
    promptPreview:
      "Build a crisp cloud-platform page: black & white base, a single blue accent, Geist typography and sharp, high-contrast sections.",
  },
  {
    host: "stripe.com",
    title: "Stripe",
    category: "Payments",
    palette: ["#635bff", "#0a2540", "#ffffff", "#425466", "#00d4ff"],
    fonts: "Sohne · Camphor",
    accent: "#635bff",
    promptPreview:
      "Design a premium payments page: indigo-to-cyan gradients over deep navy, immaculate spacing and an animated, layered hero.",
  },
  {
    host: "raycast.com",
    title: "Raycast",
    category: "Productivity",
    palette: ["#ff6363", "#0d0d0d", "#ffffff", "#1c1c1c", "#9b9b9b"],
    fonts: "Inter · SF Mono",
    accent: "#ff6363",
    promptPreview:
      "Make a punchy productivity-tool page: charcoal background, a warm coral accent, mono keyboard-style chips and tight, fast copy.",
  },
];

export const SHOWCASE_CATEGORIES = [
  "All",
  "Developer",
  "Design tools",
  "E-commerce",
  "Auth",
  "Database",
  "Productivity",
  "Payments",
];
