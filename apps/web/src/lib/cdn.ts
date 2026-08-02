/**
 * Resolve a public asset path against the optional Cloudflare PDF CDN.
 * When NEXT_PUBLIC_PDF_CDN_URL is unset, returns the local `/...` path.
 */
export function cdnUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_PDF_CDN_URL?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}
