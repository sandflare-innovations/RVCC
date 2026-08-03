import { pdfjs } from "react-pdf";

/**
 * Warm PDF bytes + pdf.js worker on READ click so the reader isn't blank on first paint.
 */
export function prefetchDocumentReader(fileUrl: string, filePath?: string) {
  if (typeof window === "undefined") return;

  // Prefer same-origin path for Range-friendly warm-up; fall back to CDN URL
  const primary = filePath || fileUrl;
  void fetch(primary, { credentials: "omit", headers: { Range: "bytes=0-65535" } }).catch(() => {
    void fetch(primary, { credentials: "omit" }).catch(() => {});
  });
  if (fileUrl !== primary) {
    void fetch(fileUrl, { mode: "cors", credentials: "omit" }).catch(() => {});
  }
  // Same version-pinned worker the reader uses (local /pdfjs was 404 on Vercel).
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  void fetch(workerSrc, { mode: "cors", credentials: "omit" }).catch(() => {});

  void import("@/sections/documents/FlipbookReader").catch(() => {});

  try {
    sessionStorage.setItem("rvcc-pdf-prefetch", primary);
    sessionStorage.setItem("rvcc-pdf-prefetch-at", String(Date.now()));
  } catch {
    /* private mode */
  }
}
