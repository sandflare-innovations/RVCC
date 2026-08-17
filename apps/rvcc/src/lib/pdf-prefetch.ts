import { pdfjs } from "react-pdf";

/**
 * Warm PDF bytes + pdf.js worker on READ click so the reader isn't blank on first paint.
 */
export function prefetchDocumentReader(fileUrl: string, _filePath?: string) {
  if (typeof window === "undefined") return;

  // Prefer the public S3/Tigris URL (books are no longer on Vercel /public).
  const urls = [fileUrl].filter(Boolean) as string[];
  for (const url of urls) {
    const cross = (() => {
      try {
        return new URL(url, window.location.href).origin !== window.location.origin;
      } catch {
        return false;
      }
    })();
    void fetch(url, {
      mode: cross ? "cors" : "same-origin",
      credentials: "omit",
      // Only Range-probe same-origin; CDN Range is unreliable.
      ...(cross ? {} : { headers: { Range: "bytes=0-65535" } }),
    }).catch(() => {});
  }

  // Same version-pinned worker the reader uses (local /pdfjs was 404 on Vercel).
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  void fetch(workerSrc, { mode: "cors", credentials: "omit" }).catch(() => {});

  void import("@/sections/documents/FlipbookReader").catch(() => {});

  try {
    sessionStorage.setItem("rvcc-pdf-prefetch", urls[0] || fileUrl);
    sessionStorage.setItem("rvcc-pdf-prefetch-at", String(Date.now()));
  } catch {
    /* private mode */
  }
}
