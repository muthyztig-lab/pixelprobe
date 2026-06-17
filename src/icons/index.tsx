/* ────────────────────────────────────────────────────────────
   Icon module — a thin facade over `lucide-react`.

   Every icon is re-exported under our own `Icon*` name so call sites
   (`<IconZap size={12} />`) and `@/icons` imports stay unchanged. Each one is
   wrapped to keep our project default of 16px (lucide defaults to 24px) and the
   `IconProps` signature. Brand glyphs (GitHub / X / Google) are hand-drawn
   because lucide 1.x no longer ships brand icons.
   ──────────────────────────────────────────────────────────── */
import type { SVGProps } from "react";
import {
  Globe,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Code2,
  Download,
  FileText,
  Zap,
  Moon,
  Sun,
  LayoutGrid,
  Component,
  Tag,
  Scroll,
  Lock,
  Palette,
  Variable,
  Scan,
  Type,
  Ruler,
  Box,
  Check,
  Copy,
  Star,
  LoaderCircle,
  Image as ImageIcon,
  X,
  ChevronLeft,
  Menu,
  ChevronRight,
  Maximize,
  Layers,
  Mail,
  User,
  LogOut,
  Trash2,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Wrap a lucide icon so it keeps our 16px default and `IconProps` signature. */
function icon(Glyph: LucideIcon) {
  return ({ size = 16, ...rest }: IconProps) => <Glyph size={size} {...rest} />;
}

export const IconGlobe = icon(Globe);
export const IconArrowRight = icon(ArrowRight);
export const IconArrowUpRight = icon(ArrowUpRight);
export const IconSparkles = icon(Sparkles);
export const IconCode2 = icon(Code2);
export const IconDownload = icon(Download);
export const IconFileText = icon(FileText);
export const IconZap = icon(Zap);
export const IconMoon = icon(Moon);
export const IconSun = icon(Sun);
export const IconLayoutGrid = icon(LayoutGrid);
export const IconComponent = icon(Component);
export const IconTag = icon(Tag);
export const IconScroll = icon(Scroll);
export const IconLock = icon(Lock);
export const IconPalette = icon(Palette);
export const IconVariable = icon(Variable);
export const IconScan = icon(Scan);
export const IconType = icon(Type);
export const IconRuler = icon(Ruler);
export const IconBox = icon(Box);
export const IconCheck = icon(Check);
export const IconCopy = icon(Copy);
export const IconStar = icon(Star);
export const IconLoader = icon(LoaderCircle);
export const IconImage = icon(ImageIcon);
export const IconX = icon(X);
export const IconChevronLeft = icon(ChevronLeft);
export const IconMenu = icon(Menu);
export const IconChevronRight = icon(ChevronRight);
export const IconMaximize = icon(Maximize);
export const IconLayers = icon(Layers);
export const IconMail = icon(Mail);
export const IconUser = icon(User);
export const IconLogOut = icon(LogOut);
export const IconTrash = icon(Trash2);
export const IconClock = icon(Clock);

/* ── Brand glyphs (not in lucide 1.x) ──────────────────────── */

function Svg({ size = 16, children, strokeWidth = 1.75, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGithub = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </Svg>
);

export const IconTwitter = (p: IconProps) => (
  <Svg fill="currentColor" stroke="none" {...p}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </Svg>
);

/** Full-colour Google "G" — uses fill paths, ignores the shared stroke. */
export const IconGoogle = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...rest}>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);
