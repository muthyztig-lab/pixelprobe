/** Normalize a user-typed value into a fully-qualified URL. */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** Basic check that a string looks like a reachable host. */
export function isProbablyUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  try {
    const url = new URL(normalizeUrl(value));
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Pretty hostname, e.g. "https://www.shopify.com/x" -> "shopify.com". */
export function prettyHost(raw: string): string {
  try {
    return new URL(normalizeUrl(raw)).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}
