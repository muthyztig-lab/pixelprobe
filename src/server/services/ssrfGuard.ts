/**
 * SSRF guard for the URL scanner.
 *
 * The scanner opens arbitrary user-supplied URLs in a real browser, so without
 * a guard an attacker could point it at internal services or the cloud metadata
 * endpoint (169.254.169.254) and exfiltrate secrets via the screenshots.
 *
 * We therefore: (1) allow only http/https, and (2) resolve the hostname and
 * reject if ANY resolved address is loopback, private, link-local or otherwise
 * non-public. This is the standard pragmatic mitigation; a fully rebinding-proof
 * solution would also pin the resolved IP for the actual request.
 */
import { lookup } from "dns/promises";
import net from "net";

export class BlockedUrlError extends Error {}

/** True for IPv4 addresses that must never be reachable from the scanner. */
function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51) return true; // 198.51.100.0/24 test-net
  if (a === 203 && b === 0) return true; // 203.0.113.0/24 test-net
  if (a >= 224) return true; // multicast + reserved (224.0.0.0/4, 240.0.0.0/4)
  return false;
}

/** True for IPv6 addresses that must never be reachable from the scanner. */
function isPrivateIPv6(ip: string): boolean {
  const s = ip.toLowerCase();
  if (s === "::1" || s === "::") return true; // loopback / unspecified
  // IPv4-mapped (::ffff:127.0.0.1) — validate the embedded IPv4.
  const mapped = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (s.startsWith("fe8") || s.startsWith("fe9") || s.startsWith("fea") || s.startsWith("feb"))
    return true; // fe80::/10 link-local
  if (s.startsWith("fc") || s.startsWith("fd")) return true; // fc00::/7 unique-local
  if (s.startsWith("ff")) return true; // ff00::/8 multicast
  return false;
}

function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return true; // not a recognizable IP → refuse
}

/**
 * Throws BlockedUrlError if `url` is not a public http(s) target. Resolves the
 * hostname and checks every returned address.
 */
export async function assertPublicUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BlockedUrlError("Invalid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BlockedUrlError("Only http and https URLs are allowed.");
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new BlockedUrlError("That host is not allowed.");
  }

  // If the host is already a literal IP, check it directly.
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new BlockedUrlError("That address range is not allowed.");
    return;
  }

  // Otherwise resolve it and reject if ANY address is non-public.
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError("Could not resolve that host.");
  }
  if (addresses.length === 0) throw new BlockedUrlError("Could not resolve that host.");
  for (const { address } of addresses) {
    if (isBlockedIp(address)) throw new BlockedUrlError("That host resolves to a private address.");
  }
}
