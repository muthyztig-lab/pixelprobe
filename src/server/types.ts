/* Server-side scan types — kept in sync with the client's src/lib/types.ts */

export interface ColorToken {
  name: string;
  hex: string;
  role: string;
}

export interface FontToken {
  family: string;
  role: string;
  weights: string;
  fallback: string;
  notes?: string;
}

export interface SpacingToken {
  name: string;
  value: string;
}

export interface ScanResult {
  url: string;
  host: string;
  summary: string;
  vibe: string;
  colors: ColorToken[];
  fonts: FontToken[];
  spacing: SpacingToken[];
  radii: string[];
  shadows: string[];
  components: string[];
  cssVariables: string;
  /** Full-page screenshots the scan captured (data:image/png;base64,... ready to render). */
  shots: string[];
  /** Big A→Z Markdown design specification, copyable / downloadable as {Host}.md */
  markdownPrompt: string;
  screenshots: number;
  model: string;
}

/** Real design data extracted directly from the rendered DOM by capture.ts. */
export interface PageData {
  title: string;
  description: string;
  themeColor: string;
  ogImage: string;
  finalUrl: string;
  cssVars: Record<string, string>;
  backgroundColors: { hex: string; count: number }[];
  textColors: { hex: string; count: number }[];
  borderColors: { hex: string; count: number }[];
  brandColors: { hex: string; source: string }[];
  fontFamilies: { family: string; count: number }[];
  fontSamples: { tag: string; family: string; size: string; weight: string; lineHeight: string; color: string }[];
  radii: { value: string; count: number }[];
  shadows: { value: string; count: number }[];
  spacings: { value: string; count: number }[];
  buttons: {
    bg: string;
    color: string;
    radius: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
    text: string;
  }[];
  containerMaxWidths: string[];
}
