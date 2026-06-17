import {
  IconLayoutGrid,
  IconTag,
  IconScroll,
  type IconProps,
} from "@/icons";

export interface NavLink {
  label: string;
  to: string;
  icon: (p: IconProps) => React.ReactElement;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Showcase", to: "/showcase", icon: IconLayoutGrid },
  { label: "Pricing", to: "/pricing", icon: IconTag },
  { label: "Changelog", to: "/changelog", icon: IconScroll },
];

export const SUGGESTIONS = ["shopify.com", "framer.com", "resend.com", "clerk.dev", "planetscale.com"];

export const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Showcase", to: "/showcase" },
      { label: "Pricing", to: "/pricing" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/" },
      { label: "API reference", to: "/" },
      { label: "Design tokens", to: "/" },
      { label: "Status", to: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Blog", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Contact", to: "/" },
    ],
  },
];
