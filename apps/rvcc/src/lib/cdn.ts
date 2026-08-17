/**
 * Public asset CDN (Cloudflare R2). App only renders — no uploads.
 * Object keys match logical paths, e.g. /pdf/books/….pdf, /media/about.mp4
 */
const DEFAULT_ASSET_CDN = "https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev";

export function assetCdnUrl(path: string): string {
  const raw =
    process.env.NEXT_PUBLIC_ASSET_CDN_URL ||
    process.env.NEXT_PUBLIC_PDF_CDN_URL ||
    DEFAULT_ASSET_CDN;
  const base = raw.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Alias used by documents / flipbook. */
export function cdnUrl(path: string): string {
  return assetCdnUrl(path);
}
