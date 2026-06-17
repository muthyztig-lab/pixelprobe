export interface ChangelogEntry {
  version: string;
  date: string;
  tag: "New" | "Improved" | "Fixed";
  title: string;
  body: string;
  points: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.8",
    date: "June 16, 2026",
    tag: "New",
    title: "Accounts, credits & deeper full-page capture",
    body: "PixelProbe now has optional accounts powered by Supabase: email/password and Google sign-in, a credit balance, and a clean pricing flow. New visitors get one free scan, then sign up for 25 credits (5 per scan). Credits are spent and checked entirely server-side — they can't be changed from the browser. Also fixed scanning of apps that scroll an inner container (e.g. Moodle): we now unlock those scrollers so the whole page is captured across up to 3 frames. Leave the Supabase keys blank to keep running in open mode with unlimited free scans.",
    points: [
      "Sign in / sign up with email or Google (Supabase Auth)",
      "Credit system: 1 free scan, 25 credits on signup, 5 per scan",
      "Server-side credit spending via secure RPC — tamper-proof (RLS, no client writes)",
      "Centered pricing modal on first visit + when credits run out",
      "Fixed capture for inner-scroll apps (Moodle, dashboards) → up to 3 distinct frames",
      "Open mode: no keys → no login, unlimited scans (graceful fallback)",
    ],
  },
  {
    version: "v2.7",
    date: "June 16, 2026",
    tag: "Improved",
    title: "See exactly what was scanned",
    body: "Results now open with the real full-page screenshots the scanner captured top-to-bottom, so you can see precisely what the AI analysed. Click any frame to open it full-screen, flip between frames with the arrows, and close with ×. Dropped the separate CSS-variables panel — those values already live inside the design prompt.",
    points: [
      "Full-page capture gallery above the design prompt",
      "Click a frame → full-screen lightbox (× to close, ←/→ to navigate, Esc)",
      "Removed the standalone CSS variables panel",
    ],
  },
  {
    version: "v2.6",
    date: "June 16, 2026",
    tag: "Improved",
    title: "Calmer, hand-built UI",
    body: "Toned down the motion so the interface feels designed, not generated: nothing lifts on hover, and hovering a card softly lights up the whole block with a barely-there dark glow — never a colored one.",
    points: [
      "Buttons: no hover lift, no harsh black shadow — subtle brighten only",
      "Whole-card hover: soft, barely-visible dark glow (not rainbow)",
      "Removed the glow ring on the URL input",
      "Pricing cards are uniform and equal height (no 'Most popular')",
    ],
  },
  {
    version: "v2.5",
    date: "June 16, 2026",
    tag: "New",
    title: "Real DOM extraction + full design prompt",
    body: "Scans now read the page's real computed styles straight from the DOM, so colors and fonts are exact — not guessed from a screenshot. Every scan also produces a complete A→Z Markdown design spec you can copy or download.",
    points: [
      "Exact hex, fonts, CSS variables, spacing, radii & shadows pulled from the live DOM",
      "Brand/accent color detection from real buttons & links",
      "Big A→Z design prompt — copy or download as {Site}.md",
    ],
  },
  {
    version: "v2.4",
    date: "June 12, 2026",
    tag: "New",
    title: "CSS Exporter is out of beta",
    body: "Turn any scan into production-ready CSS custom properties in one click — now with nested theme scopes and dark-mode variants.",
    points: [
      "Export to CSS, JSON (W3C tokens) and Figma variables",
      "Automatic light/dark variant grouping",
      "Copy individual tokens or the full sheet",
    ],
  },
  {
    version: "v2.3",
    date: "May 28, 2026",
    tag: "New",
    title: "Auto-scroll capture",
    body: "The renderer now scrolls through long pages and stitches multiple viewport screenshots so the model sees the whole experience, not just the hero.",
    points: [
      "2–3 screenshots per scan with smart scroll points",
      "Lazy-loaded sections are now captured reliably",
      "Sticky headers are de-duplicated automatically",
    ],
  },
  {
    version: "v2.2",
    date: "May 9, 2026",
    tag: "Improved",
    title: "Sharper font detection",
    body: "Typography analysis is noticeably more accurate, including weight, letter-spacing and the difference between display and body families.",
    points: [
      "Detects variable-font weight ranges",
      "Separates heading vs body vs mono roles",
      "Flags likely web-font sources (Google, Fontshare, custom)",
    ],
  },
  {
    version: "v2.1",
    date: "April 21, 2026",
    tag: "Fixed",
    title: "Faster rendering queue",
    body: "Reduced cold-start time on the rendering workers and fixed a handful of edge cases with single-page apps.",
    points: [
      "40% faster median scan time",
      "Better handling of client-side routed pages",
      "Graceful timeout messaging instead of silent failures",
    ],
  },
];
