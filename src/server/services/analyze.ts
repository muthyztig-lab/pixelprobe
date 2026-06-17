import OpenAI from "openai";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { config, provider, activeModel } from "../config.js";
import type { ScanResult, ColorToken, FontToken, SpacingToken, PageData } from "../types.js";

/* ──────────────────────────────────────────────────────────────────────────
 * Prompts
 * The capture step extracts REAL computed styles from the DOM, so the model is
 * told to treat those exact values as ground truth and never invent hex codes
 * or font names. Screenshots are used for layout, hierarchy, components & vibe.
 * ────────────────────────────────────────────────────────────────────────── */

const TOKENS_SYSTEM = `You are PixelProbe, an expert design-systems engineer.
You receive (1) REAL design data extracted directly from a live website's DOM — exact computed colors with usage counts, fonts, CSS variables, spacing, radii, shadows and button styles — and (2) screenshots captured top-to-bottom.
The extracted DOM data is GROUND TRUTH for exact values: choose hex codes, font families and sizes ONLY from it. Never invent values that are not in the data. Use the screenshots to judge hierarchy, roles (which color is the brand/accent vs background vs text) and to detect components.
Return STRICT JSON (no markdown, no commentary) matching:
{
  "summary": string,        // 1-2 sentences on the overall design
  "vibe": string,           // short adjectives, e.g. "minimal, technical, high-contrast"
  "colors": { "name": string, "hex": "#rrggbb", "role": string }[],  // 5-8, role = background|surface|primary|accent|text|muted|border
  "fonts": { "family": string, "role": string, "weights": string, "fallback": string, "notes"?: string }[],
  "spacing": { "name": string, "value": string }[],
  "radii": string[],
  "shadows": string[],
  "components": string[]
}`;

const MARKDOWN_SYSTEM = `You are PixelProbe, a senior design-systems engineer and brand strategist.
Write an EXHAUSTIVE, book-length Markdown design specification (a "design prompt") that reverse-engineers the given website from A to Z — so complete that a skilled designer or an AI could rebuild a pixel-faithful clone of the site's entire look, feel and behaviour from THIS DOCUMENT ALONE, without ever seeing the original.
You are given REAL design data extracted directly from the page's DOM (exact colors with usage counts, fonts, CSS variables, spacing, radii, shadows, button styles) plus screenshots captured top-to-bottom. Base EVERY concrete value on this real data — it is exact and authoritative; do NOT invent hex codes, font names or sizes. Use the screenshots to describe layout, sections, components, imagery, hierarchy, density and overall feel.

LENGTH & DEPTH (critical):
- Be maximally thorough. This must be a LONG document — aim for 2,500+ words and use every bit of the available output budget. Never summarize, never cut a section short, never write "etc." — enumerate everything you see.
- For every numeric/visual claim give the EXACT value (px, rem, hex, weight, ms) from the data. Pair each abstract statement with a concrete value.
- Prefer many short, information-dense bullets and tables over vague prose. When unsure of an exact value, give your best grounded estimate and mark it "(approx.)".
- The extracted DOM data covers colors, fonts, spacing, radii, shadows and button styles only. For anything NOT in that data (modal/badge/form-state details, breakpoints, motion timings, accessibility numbers), make a sensible inference and clearly tag it "(inferred)" — never present a guess as a measured fact.

ABSOLUTELY NO CODE:
- Do NOT write any code. No CSS, no HTML, no fenced \`\`\` code blocks of any kind. Describe everything in plain prose, bullet lists and Markdown tables only.
- State exact values inline as plain text (e.g. "background #0b0e18", "radius 12px", "heading 48px / 700 / 1.1 line-height") — never inside a code block.

FORMAT:
Output ONLY the Markdown document (no preamble, no closing remarks, no \`\`\`markdown fence around the whole thing). Use rich real Markdown: a single # title, ## sections, ### subsections, bullet lists, Markdown tables and blockquotes — but NO fenced code blocks.

Include ALL of these sections, in order, each developed in depth:
1. # <Site name> — Design Specification  (use the REAL site or brand name as the title — derive it from the page title / host, e.g. "University of King Daniel" for online.ukd.edu.ua. NEVER output the literal placeholder text "{Site}" or "<Site name>". Follow with a 2–3 paragraph overview: what the product is, the brand impression, and the single sentence that captures its design DNA)
2. ## Vibe & Personality  (8+ precise adjectives, the emotional tone, who it's for, and 3–5 comparable products with a similar aesthetic)
3. ## Design Principles  (4–6 guiding principles the design seems to follow, each one sentence)
4. ## Layout & Grid  (page structure section-by-section, max container width, column grid, gutters, vertical rhythm, content density, alignment)
5. ## Color System  (a full Markdown table: Token | Hex | Role | Where it's used; describe light/dark treatment and contrast pairings)
6. ## Typography  (every family + role + fallback; a full type scale TABLE with size / line-height / weight / letter-spacing per level from display→caption; heading vs body treatment)
7. ## Spacing & Sizing  (the spacing scale as tokens, the base unit, and how spacing is applied to sections/components)
8. ## Border Radii  (each radius value and where it applies)
9. ## Elevation & Shadows  (each shadow value and its purpose)
10. ## Components  — this is the LONGEST section. Describe EACH in detail with real values, in prose and bullets: ### Navbar / Header, ### Hero, ### Buttons (primary, secondary, ghost — describe hover/active/focus/disabled states), ### Cards, ### Forms & Inputs (default/focus/error states), ### Badges & Pills, ### Links, ### Tables or Lists (if present), ### Modals/Overlays (if present), ### Footer. Add any other distinctive components you observe.
11. ## Iconography & Imagery  (icon style/weight, illustration vs photography, image treatment, corner rounding on media, logo usage)
12. ## Motion & Interaction  (transition durations & easings, hover/scroll/entrance animations, micro-interactions; give concrete timings in ms)
13. ## Voice & Tone  (copywriting style with 3–5 real example phrases quoted from the visible text, capitalization & punctuation habits)
14. ## Responsive Behaviour  (likely breakpoints, how the nav/grid/typography adapt mobile→desktop)
15. ## Accessibility Notes  (contrast observations, focus visibility, hit-target sizes, anything to preserve or improve)
16. ## Recreation Prompt  (one long, ready-to-paste paragraph that instructs an AI to rebuild this EXACT design end-to-end — naming the real colors, fonts, spacing, radii, key components and mood — detailed enough to one-shot a faithful clone)

Be specific, exhaustive and generous with detail throughout. Use the FULL output budget. Remember: NOT a single line of code anywhere.`;

function tokensUser(host: string, pageData: PageData, n: number): string {
  return `Site: ${host} (${pageData.finalUrl})
Page title: ${pageData.title}
Meta description: ${pageData.description}

REAL DESIGN DATA EXTRACTED FROM THE DOM (ground truth — use these exact values):
${JSON.stringify(pageData, null, 2)}

${n} screenshot(s) follow, captured top to bottom. Return only the JSON object.`;
}

function markdownUser(host: string, pageData: PageData, tokens: Partial<ScanResult>, n: number): string {
  return `Write the full Markdown design specification for ${host} (${pageData.finalUrl}).

REAL DESIGN DATA EXTRACTED FROM THE DOM (ground truth — use these exact values):
${JSON.stringify(pageData, null, 2)}

Tokens already identified (roles assigned):
${JSON.stringify({ summary: tokens.summary, vibe: tokens.vibe, colors: tokens.colors, fonts: tokens.fonts, spacing: tokens.spacing, radii: tokens.radii, shadows: tokens.shadows, components: tokens.components }, null, 2)}

${n} screenshot(s) follow, captured top to bottom. Output ONLY the Markdown document.`;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Model dispatch (OpenAI-compatible or Gemini), with vision
 * ────────────────────────────────────────────────────────────────────────── */

interface CallOpts {
  json?: boolean;
  maxTokens?: number;
}

/** Single chat call against the configured provider; returns the raw text. */
async function callModel(system: string, user: string, shots: string[], opts: CallOpts = {}): Promise<string> {
  if (provider === "gemini") return callGemini(system, user, shots, opts);
  return callOpenAI(system, user, shots, opts);
}

async function callOpenAI(system: string, user: string, shots: string[], opts: CallOpts): Promise<string> {
  const client = new OpenAI({
    apiKey: config.ai.apiKey,
    baseURL: config.ai.baseUrl,
    defaultHeaders: { "HTTP-Referer": "https://pixelprobe.app", "X-Title": "PixelProbe" },
  });

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: user },
    ...shots.map(
      (b64): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${b64}` },
      }),
    ),
  ];
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content },
  ];

  const run = (withJson: boolean) =>
    client.chat.completions.create({
      model: config.ai.model,
      temperature: 0.3,
      max_tokens: opts.maxTokens ?? 2048,
      messages,
      ...(withJson && opts.json ? { response_format: { type: "json_object" as const } } : {}),
    });

  try {
    const resp = await run(true);
    return resp.choices[0]?.message?.content ?? "";
  } catch (err) {
    // Some models reject response_format — retry once without it.
    if (/response_format|json_object|not supported|invalid/i.test(String(err))) {
      const resp = await run(false);
      return resp.choices[0]?.message?.content ?? "";
    }
    throw err;
  }
}

async function callGemini(system: string, user: string, shots: string[], opts: CallOpts): Promise<string> {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: system,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: opts.maxTokens ?? 2048,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });
  const imageParts: Part[] = shots.map((b64) => ({ inlineData: { mimeType: "image/png", data: b64 } }));
  const result = await model.generateContent([{ text: user }, ...imageParts]);
  return result.response.text() ?? "";
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function extractJson(text: string): Partial<ScanResult> {
  let cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);
  return JSON.parse(cleaned) as Partial<ScanResult>;
}

function stripMarkdownFence(text: string): string {
  const t = text.trim();
  // If the whole thing is wrapped in a ```markdown ... ``` fence, unwrap it.
  const m = t.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (m ? m[1] : t).trim();
}

/** Build a :root CSS block from the extracted tokens. */
export function buildCssVariables(
  colors: ColorToken[],
  fonts: FontToken[],
  spacing: SpacingToken[],
  radii: string[],
): string {
  const lines: string[] = [":root {", "  /* Colors */"];
  for (const c of colors) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    lines.push(`  --color-${slug}: ${c.hex};`);
  }
  if (fonts.length) {
    lines.push("", "  /* Typography */");
    for (const f of fonts) {
      const slug = f.role.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      lines.push(`  --font-${slug}: '${f.family}', ${f.fallback};`);
    }
  }
  if (spacing.length) {
    lines.push("", "  /* Spacing */");
    for (const s of spacing) lines.push(`  --space-${s.name}: ${s.value};`);
  }
  if (radii.length) {
    lines.push("", "  /* Radii */");
    radii.forEach((r, i) => lines.push(`  --radius-${i + 1}: ${r};`));
  }
  lines.push("}");
  return lines.join("\n");
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────────────────── */

/** Run the configured vision model over the screenshots + real DOM data. */
export async function analyzeScreenshots(
  url: string,
  host: string,
  shots: string[],
  pageData: PageData,
): Promise<ScanResult> {
  // 1) Structured tokens, grounded in the real DOM data.
  const parsed = extractJson(
    (await callModel(TOKENS_SYSTEM, tokensUser(host, pageData, shots.length), shots, { json: true, maxTokens: 2048 })) ||
      "{}",
  );

  const colors = parsed.colors ?? [];
  const fonts = parsed.fonts ?? [];
  const spacing = parsed.spacing ?? [];
  const radii = parsed.radii ?? [];

  // 2) The big A→Z Markdown design prompt (plain markdown, not JSON).
  let markdownPrompt = "";
  try {
    markdownPrompt = stripMarkdownFence(
      await callModel(MARKDOWN_SYSTEM, markdownUser(host, pageData, parsed, shots.length), shots, {
        json: false,
        maxTokens: 8192,
      }),
    );
  } catch (err) {
    console.error("[analyze] markdown generation failed:", err instanceof Error ? err.message : err);
    markdownPrompt = `# ${host} — Design Specification\n\n_Could not generate the full design prompt (the AI request failed). The structured tokens above are still based on the real page data._`;
  }

  return {
    url,
    host,
    summary: parsed.summary ?? "Design analysis completed.",
    vibe: parsed.vibe ?? "",
    colors,
    fonts,
    spacing,
    radii,
    shadows: parsed.shadows ?? [],
    components: parsed.components ?? [],
    cssVariables: buildCssVariables(colors, fonts, spacing, radii),
    shots: shots.map((b64) => `data:image/png;base64,${b64}`),
    markdownPrompt,
    screenshots: shots.length,
    model: activeModel,
  };
}

/** Clearly-labelled sample result used when no AI key is configured. */
export function buildDemoResult(url: string, host: string): ScanResult {
  const colors: ColorToken[] = [
    { name: "Background", hex: "#0b0e18", role: "background" },
    { name: "Surface", hex: "#141826", role: "surface" },
    { name: "Primary", hex: "#6366f1", role: "primary" },
    { name: "Accent", hex: "#a855f7", role: "accent" },
    { name: "Text", hex: "#e8ecf6", role: "text" },
    { name: "Muted", hex: "#8a90a6", role: "muted" },
  ];
  const fonts: FontToken[] = [
    { family: "Space Grotesk", role: "Headings", weights: "500–700", fallback: "sans-serif", notes: "Geometric display face" },
    { family: "Manrope", role: "Body", weights: "400–600", fallback: "sans-serif" },
    { family: "JetBrains Mono", role: "Mono", weights: "400–500", fallback: "monospace" },
  ];
  const spacing: SpacingToken[] = [
    { name: "xs", value: "4px" },
    { name: "sm", value: "8px" },
    { name: "md", value: "16px" },
    { name: "lg", value: "24px" },
    { name: "xl", value: "40px" },
  ];
  const radii = ["8px", "12px", "9999px"];
  const markdownPrompt = `# ${host} — Design Specification (sample)

> This is a **demo** document. Add an \`AI_API_KEY\` (e.g. a free Groq key) to \`.env\` and re-run the scan to get a real, full A→Z design prompt built from the live page.

## Vibe & Personality
Dark, modern, indigo-violet. Technical yet friendly — aimed at developers and product teams.

## Color System
| Token | Hex | Role |
| --- | --- | --- |
| Background | #0b0e18 | page background |
| Surface | #141826 | cards / panels |
| Primary | #6366f1 | primary actions |
| Accent | #a855f7 | highlights |
| Text | #e8ecf6 | body text |

## Typography
- Headings: Space Grotesk 500–700
- Body: Manrope 400–600
- Mono: JetBrains Mono

## Recreation Prompt
Build a dark, modern SaaS landing page using a #0b0e18 background with #141826 surfaces, indigo (#6366f1) primary buttons and violet (#a855f7) accents, Space Grotesk headings and Manrope body text, 8/16/24px spacing, 8–12px radii and soft shadows.`;
  return {
    url,
    host,
    summary: `Sample tokens for ${host}. Add an AI_API_KEY (e.g. a free Groq key) to the .env file to run a real AI analysis of the live page.`,
    vibe: "demo · dark, indigo-violet, modern",
    colors,
    fonts,
    spacing,
    radii,
    shadows: ["0 1px 2px rgba(0,0,0,0.4)", "0 8px 30px rgba(99,102,241,0.18)"],
    components: ["Primary button", "Elevated card", "Sticky nav", "Input field", "Badge"],
    cssVariables: buildCssVariables(colors, fonts, spacing, radii),
    shots: [],
    markdownPrompt,
    screenshots: 0,
    model: "demo (no AI key)",
  };
}
