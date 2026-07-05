import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // IPv6 ULA
  if (ip.includes(":")) return false;

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function assertPublicHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host)) {
    throw new Error("That URL is not allowed");
  }

  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("Private network URLs are not allowed");
  }

  return parsed;
}

export async function assertResolvablePublicHost(url: URL): Promise<void> {
  const host = url.hostname;
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private network URLs are not allowed");
    return;
  }

  try {
    const results = await lookup(host, { all: true });
    for (const { address } of results) {
      if (isPrivateIp(address)) {
        throw new Error("URL resolves to a private network address");
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("private")) throw error;
    // DNS failure — allow fetch to fail naturally for unknown hosts
  }
}
