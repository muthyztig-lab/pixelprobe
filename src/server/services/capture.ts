import { chromium, type Browser } from "playwright";
import type { PageData } from "../types.js";

export interface CaptureResult {
  /** base64-encoded PNG screenshots (no data: prefix) */
  shots: string[];
  finalUrl: string;
  /** Real design data extracted directly from the rendered DOM. */
  pageData: PageData;
}

/**
 * Open the URL in a headless browser, scroll through the page, capture 2-3
 * viewport screenshots AND extract the real computed design tokens straight
 * from the DOM (exact colors, fonts, spacing, radii, shadows, CSS variables).
 * The DOM data is far more accurate than asking a vision model to guess hex
 * values from a screenshot, so we treat it as ground truth in the analyzer.
 */
export async function captureScreenshots(url: string, max = 3): Promise<CaptureResult> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    });
    // tsx/esbuild compiles with `--keep-names`, which injects a `__name(...)`
    // helper into our functions. When extractPageData() is serialized and run
    // in the browser via page.evaluate, that helper doesn't exist there and
    // throws "ReferenceError: __name is not defined". Define a no-op shim in
    // every document so the serialized function resolves it harmlessly.
    await context.addInitScript(() => {
      const w = window as unknown as { __name?: (fn: unknown) => unknown };
      if (typeof w.__name === "undefined") w.__name = (fn: unknown) => fn;
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(async () => {
      // Some pages never reach networkidle (analytics, websockets). Fall back.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    });

    // Let fonts/animations settle.
    await page.waitForTimeout(1200);

    const viewportHeight = 900;

    // Many modern apps (Moodle, admin shells, dashboards) keep <body> at 100vh
    // and scroll an INNER container with overflow:auto — so window.scrollTo does
    // nothing and the page looks like a single screen. We "unlock" those
    // constrained scrollers so their content flows into the normal document
    // flow; then standard window scrolling + a full-page screenshot capture the
    // whole page reliably.
    await page.evaluate(() => {
      const unlock = (el: HTMLElement) => {
        el.style.setProperty("height", "auto", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
      };
      for (const el of Array.from(document.querySelectorAll("body *")) as HTMLElement[]) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 80 && el.clientHeight > 200) {
          unlock(el);
        }
      }
      document.documentElement.style.setProperty("height", "auto", "important");
      document.body.style.setProperty("height", "auto", "important");
      document.body.style.setProperty("overflow", "visible", "important");
    });
    await page.waitForTimeout(300);

    const measureHeight = () =>
      page.evaluate(() =>
        Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight,
        ),
      );

    // Step through the page so anything lazy-loaded on scroll renders.
    await page.evaluate(async (vh: number) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const maxScroll = () =>
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
      let y = 0;
      for (let guard = 0; guard < 40 && y < maxScroll() - 4; guard++) {
        y = Math.min(y + Math.round(vh * 0.9), maxScroll());
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        await sleep(160);
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, viewportHeight);
    await page.waitForTimeout(350);

    const totalHeight = Math.max(await measureHeight(), viewportHeight);
    const shots: string[] = [];

    // How many distinct frames are worth taking — only add one when there's
    // meaningfully more content below (~90% of a viewport), capped at `max`.
    const sections = Math.min(max, Math.max(1, Math.round(totalHeight / (viewportHeight * 0.9))));
    const maxScrollY = Math.max(0, totalHeight - viewportHeight);
    for (let i = 0; i < sections; i++) {
      const y = sections === 1 ? 0 : Math.round(maxScrollY * (i / (sections - 1)));
      await page.evaluate(
        (scrollY) => window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior }),
        Math.max(0, y),
      );
      await page.waitForTimeout(450);
      const buf = await page.screenshot({ type: "png" });
      shots.push(buf.toString("base64"));
    }

    // Back to top, then mine the real design tokens out of the DOM.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(200);
    const pageData = await page.evaluate(extractPageData);
    pageData.finalUrl = page.url();

    return { shots, finalUrl: page.url(), pageData };
  } finally {
    await browser?.close().catch(() => {});
  }
}

/**
 * Runs INSIDE the browser. Walks the rendered DOM and aggregates the real
 * computed design tokens. Kept as a single self-contained function (no outer
 * scope refs) because Playwright serializes it into the page context.
 */
function extractPageData(): PageData {
  const toHex = (input: string): string | null => {
    if (!input) return null;
    const s = input.trim().toLowerCase();
    if (s === "transparent" || s === "none" || s.includes("gradient")) return null;
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
      const [r, g, b, a = 1] = parts;
      if (a === 0) return null; // fully transparent — not a real color
      const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
      return `#${h(r)}${h(g)}${h(b)}`;
    }
    if (/^#[0-9a-f]{3,8}$/i.test(s)) {
      if (s.length === 4) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
      return s.slice(0, 7);
    }
    return null;
  };

  const bump = (map: Map<string, number>, key: string | null, weight = 1) => {
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + weight);
  };
  const top = (map: Map<string, number>, n: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));
  const topHex = (map: Map<string, number>, n: number) =>
    top(map, n).map(({ value, count }) => ({ hex: value, count }));

  const bgColors = new Map<string, number>();
  const textColors = new Map<string, number>();
  const borderColors = new Map<string, number>();
  const fontFamilies = new Map<string, number>();
  const radii = new Map<string, number>();
  const shadows = new Map<string, number>();
  const spacings = new Map<string, number>();
  const brand = new Map<string, string>(); // hex -> source label

  const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));
  const sample = all.slice(0, 4000);

  for (const el of sample) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const area = Math.max(0, rect.width) * Math.max(0, rect.height);
    const visible = area > 0 && cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05;
    if (!visible) continue;

    // Backgrounds weighted by painted area (page bg dominates).
    const bg = toHex(cs.backgroundColor);
    if (bg) bump(bgColors, bg, 1 + Math.min(20, area / 40000));

    // Text color, only for nodes that actually render text.
    const hasText = (el.textContent ?? "").trim().length > 0 && el.children.length === 0;
    if (hasText) bump(textColors, toHex(cs.color), 1);

    // Borders (visible width only).
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0) bump(borderColors, toHex(cs.borderTopColor), 1);

    // Fonts — first family in the stack.
    const fam = (cs.fontFamily || "").split(",")[0]?.trim().replace(/['"]/g, "");
    if (fam) bump(fontFamilies, fam, 1);

    // Radii / shadows / spacing.
    const br = cs.borderTopLeftRadius;
    if (br && br !== "0px") bump(radii, br, 1);
    if (cs.boxShadow && cs.boxShadow !== "none") bump(shadows, cs.boxShadow, 1);
    for (const v of [cs.paddingTop, cs.paddingLeft, cs.gap, cs.marginBottom]) {
      const px = parseFloat(v);
      if (px >= 4 && px <= 160 && /px$/.test(v)) bump(spacings, `${Math.round(px)}px`, 1);
    }

    // Brand/accent candidates: buttons and links with a solid fill or strong color.
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const isButton = tag === "button" || role === "button" || (tag === "a" && /button|btn|cta/i.test(el.className || ""));
    if (isButton && bg) brand.set(bg, "button");
    if (tag === "a") {
      const lc = toHex(cs.color);
      if (lc) brand.set(lc, brand.get(lc) ?? "link");
    }
  }

  // Sample concrete font usages from key elements.
  const fontSamples: PageData["fontSamples"] = [];
  for (const sel of ["h1", "h2", "h3", "p", "button", "a", "body"]) {
    const node = document.querySelector<HTMLElement>(sel);
    if (!node) continue;
    const cs = getComputedStyle(node);
    fontSamples.push({
      tag: sel,
      family: (cs.fontFamily || "").split(",")[0]?.replace(/['"]/g, "").trim(),
      size: cs.fontSize,
      weight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      color: toHex(cs.color) ?? cs.color,
    });
  }

  // Sample a few real buttons in full.
  const buttons: PageData["buttons"] = [];
  const btnNodes = Array.from(
    document.querySelectorAll<HTMLElement>("button, a[class*='btn'], a[class*='button'], [role='button']"),
  ).slice(0, 6);
  for (const b of btnNodes) {
    const cs = getComputedStyle(b);
    const text = (b.textContent ?? "").trim().slice(0, 40);
    if (!text) continue;
    buttons.push({
      bg: toHex(cs.backgroundColor) ?? "transparent",
      color: toHex(cs.color) ?? cs.color,
      radius: cs.borderTopLeftRadius,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      text,
    });
  }

  // CSS custom properties declared on :root.
  const cssVars: Record<string, string> = {};
  const rootCs = getComputedStyle(document.documentElement);
  for (let i = 0; i < rootCs.length; i++) {
    const prop = rootCs[i];
    if (prop.startsWith("--")) {
      const val = rootCs.getPropertyValue(prop).trim();
      if (val && val.length < 80) cssVars[prop] = val;
    }
  }

  // Container widths (common max-width on big wrappers).
  const containerMaxWidths = new Map<string, number>();
  for (const el of sample.slice(0, 1500)) {
    const cs = getComputedStyle(el);
    const mw = cs.maxWidth;
    if (mw && mw !== "none" && /px$/.test(mw) && parseFloat(mw) >= 600) bump(containerMaxWidths, mw, 1);
  }

  const meta = (name: string) =>
    (document.querySelector(`meta[name='${name}']`) || document.querySelector(`meta[property='${name}']`))?.getAttribute(
      "content",
    ) ?? "";

  return {
    title: document.title || "",
    description: meta("description") || meta("og:description"),
    themeColor: meta("theme-color"),
    ogImage: meta("og:image"),
    finalUrl: location.href,
    cssVars,
    backgroundColors: topHex(bgColors, 12),
    textColors: topHex(textColors, 8),
    borderColors: topHex(borderColors, 6),
    brandColors: [...brand.entries()].slice(0, 8).map(([hex, source]) => ({ hex, source })),
    fontFamilies: top(fontFamilies, 8).map(({ value, count }) => ({ family: value, count })),
    fontSamples,
    radii: top(radii, 8),
    shadows: top(shadows, 6),
    spacings: top(spacings, 12),
    buttons,
    containerMaxWidths: top(containerMaxWidths, 4).map((c) => c.value),
  };
}
