import { pdfjs } from "react-pdf";

import { cachePdf, hasCachedPdf } from "./pdf-cache";

/**
 * Warm PDF bytes + pdf.js worker on READ click so the reader opens instantly.
 * Now stores fetched bytes in the two-tier cache so back-navigation is free.
 */
export function prefetchDocumentReader(fileUrl: string, filePath?: string) {
  if (typeof window === "undefined") return;

  const urls = [fileUrl, filePath].filter(
    (u, i, a) => Boolean(u) && a.indexOf(u) === i
  ) as string[];

  for (const url of urls) {
    if (hasCachedPdf(url)) continue;

    const cross = (() => {
      try {
        return new URL(url, window.location.href).origin !== window.location.origin;
      } catch {
        return false;
      }
    })();

    fetch(url, {
      mode: cross ? "cors" : "same-origin",
      credentials: "omit",
      ...(cross ? {} : { headers: { Range: "bytes=0-65535" } }),
    })
      .then(async (res) => {
        if (res.ok && res.status === 200) {
          const buf = await res.arrayBuffer();
          await cachePdf(url, buf);
        }
      })
      .catch(() => {});
  }

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
