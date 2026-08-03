/**
 * Resolve a public asset path against the Cloudflare PDF CDN.
 * Defaults to the live Worker so production works even if
 * NEXT_PUBLIC_PDF_CDN_URL was forgotten on Vercel (origin can serve LFS stubs).
 */
const DEFAULT_PDF_CDN = "https://rvcc-pdf-cdn.rvcc.workers.dev";

export function cdnUrl(path: string): string {
  const raw = process.env.NEXT_PUBLIC_PDF_CDN_URL || DEFAULT_PDF_CDN;
  const base = raw.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}
