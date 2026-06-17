/* Shared types for the scan flow — mirror the server response shape. */

export interface ColorToken {
  name: string;
  hex: string;
  role: string; // e.g. "background", "primary", "text"
}

export interface FontToken {
  family: string;
  role: string; // e.g. "Headings", "Body", "Mono"
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
  /** Remaining credits after this scan (present only when logged in). */
  credits?: number | null;
}

export type ScanStage =
  | "idle"
  | "queue"
  | "launching"
  | "capturing"
  | "analyzing"
  | "done"
  | "error";
