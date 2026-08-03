"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import HTMLFlipBook from "react-pageflip";
import { Document, Page as PdfPage, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Icons } from "@repo/ui";

import { DocumentItem } from "@/data/documents";

/**
 * Pin worker to the same pdfjs-dist version as the app.
 * Production was 404ing `/pdfjs/pdf.worker.min.mjs` (stale Vercel 404 cache),
 * which left the reader stuck at "Loading PDF 99%" with a minified "H" error.
 */
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

function formatPdfError(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    if (error.name && error.name !== "Error") return error.name;
  }
  const anyErr = error as { message?: string; name?: string };
  if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
  if (typeof anyErr.name === "string" && anyErr.name) return anyErr.name;
  return "Failed to load PDF";
}

/** Keep a tight live window. Wider windows cause white pages + jank. */
const PAGE_BEHIND = 1;
const PAGE_AHEAD = 3;
const STICKY_RADIUS = 5;
/** Cap canvas backing-store DPR. */
const MAX_DEVICE_PIXEL_RATIO = 1.25;

/**
 * Same-origin PDFs support HTTP Range — pdf.js can open the first page
 * without downloading the entire file (critical for 20–160MB books).
 * CDN full-object mode forced disableRange and made init feel endless.
 */
const PDF_DOCUMENT_OPTIONS = {
  disableAutoFetch: false,
  disableStream: false,
  disableRange: false,
} as const;

interface FlipbookReaderProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode }>(
  (props, ref) => {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white" ref={ref}>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-6 bg-gradient-to-r from-black/[0.05] to-transparent" />
        <div className="absolute inset-0 overflow-hidden bg-white">{props.children}</div>
      </div>
    );
  }
);

Page.displayName = "Page";

/** Renders a PDF page sized to the flip slot — never force canvas CSS (that caused white sheets). */
const FlipPdfPage = ({
  pageNumber,
  width,
  devicePixelRatio,
  onReady,
}: {
  pageNumber: number;
  width: number;
  devicePixelRatio: number;
  onReady?: () => void;
}) => {
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    setPainted(false);
  }, [width, pageNumber]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-white">
      {!painted && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-zinc-100">
          <div className="border-brand-blue/50 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
      <PdfPage
        pageNumber={pageNumber}
        width={width}
        devicePixelRatio={devicePixelRatio}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        className={painted ? "opacity-100" : "opacity-0"}
        onRenderSuccess={() => {
          setPainted(true);
          onReady?.();
        }}
        onRenderError={(error) => {
          console.error(`PDF page ${pageNumber} render error:`, error);
          setPainted(true);
        }}
        loading=""
      />
    </div>
  );
};
export const FlipbookReader = ({ isOpen, onClose, document: doc }: FlipbookReaderProps) => {
  const flipBookRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageDim, setPageDim] = useState({ w: 0, h: 0 });
  const [bookBox, setBookBox] = useState({ w: 0, h: 0 });
  const [pdfReady, setPdfReady] = useState(false);
  const [coverReady, setCoverReady] = useState(false);
  const [flipMounted, setFlipMounted] = useState(false);
  /** Flipbook visible only after static cover painted + pageFlip.update — avoids blank-until-click */
  const [flipLive, setFlipLive] = useState(false);
  const [mountedPages, setMountedPages] = useState<Set<number>>(() => new Set([0, 1, 2, 3]));
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerBg, setReaderBg] = useState<"white" | "black" | "brand-blue">("brand-blue");
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const devicePixelRatio = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  }, []);

  // Reset pipeline when switching documents
  useEffect(() => {
    setCurrentPage(0);
    setNumPages(0);
    setPageDim({ w: 0, h: 0 });
    setBookBox({ w: 0, h: 0 });
    setPdfReady(false);
    setCoverReady(false);
    setFlipMounted(false);
    setFlipLive(false);
    setMountedPages(new Set([0, 1, 2, 3]));
    setLoadProgress(0);
    setLoadError(null);
    setIsZoomed(false);
    setZoomLevel(1);
    setShowGrid(false);
    setIsAutoPlaying(false);
  }, [doc?.filePath]);

  // Fit the book into the real container — useLayoutEffect so size exists before paint
  useLayoutEffect(() => {
    if (!isOpen || pageDim.w <= 0 || pageDim.h <= 0) return;

    const spread = (pageDim.w * 2) / pageDim.h;

    const measure = () => {
      const el = containerRef.current;
      const cw = el?.clientWidth || Math.max(320, window.innerWidth - 48);
      const ch = el?.clientHeight || Math.max(240, window.innerHeight - 176);
      if (cw < 40 || ch < 40) return;

      let w = cw;
      let h = w / spread;
      if (h > ch) {
        h = ch;
        w = h * spread;
      }

      const next = { w: Math.round(w), h: Math.round(h) };
      setBookBox((prev) =>
        Math.abs(prev.w - next.w) > 4 || Math.abs(prev.h - next.h) > 4 ? next : prev
      );
    };

    measure();
    const el = containerRef.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pageDim.w, pageDim.h, pdfReady, isOpen]);

  // Mount flipbook after layout, then force update() (the work a first click used to do)
  useEffect(() => {
    if (bookBox.w < 40 || !pdfReady) return;
    setFlipMounted(true);

    const bump = () => {
      try {
        // @ts-expect-error pageFlip runtime API
        flipBookRef.current?.pageFlip()?.update();
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("resize"));
    };

    const t1 = window.setTimeout(bump, 80);
    const t2 = window.setTimeout(bump, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [bookBox.w, bookBox.h, pdfReady, numPages]);

  // If flipbook cover never reports paint, still hand off after preview is up
  useEffect(() => {
    if (!coverReady || flipLive) return;
    const t = window.setTimeout(() => setFlipLive(true), 2200);
    return () => clearTimeout(t);
  }, [coverReady, flipLive]);

  // Single mounting policy: live window + short sticky trail. No competing prefetch loops.
  useEffect(() => {
    if (!pdfReady || numPages === 0) return;
    setMountedPages((prev) => {
      const next = new Set<number>();
      next.add(0);
      const start = Math.max(0, currentPage - PAGE_BEHIND);
      const end = Math.min(numPages - 1, currentPage + PAGE_AHEAD);
      for (let i = start; i <= end; i++) next.add(i);
      for (const p of prev) {
        if (p !== 0 && Math.abs(p - currentPage) <= STICKY_RADIUS) next.add(p);
      }
      return next;
    });
  }, [currentPage, pdfReady, numPages]);

  // Reveal UI once layout exists even if cover paint is slow
  useEffect(() => {
    if (coverReady || bookBox.w <= 0 || !pdfReady) return;
    const timer = setTimeout(() => setCoverReady(true), 1800);
    return () => clearTimeout(timer);
  }, [bookBox.w, pdfReady, coverReady]);

  // Safety: never leave users on a stuck boot overlay
  useEffect(() => {
    if (pageDim.w <= 0 || coverReady) return;
    const timer = setTimeout(() => setCoverReady(true), 8_000);
    return () => clearTimeout(timer);
  }, [pageDim.w, coverReady]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && flipBookRef.current && coverReady) {
      interval = setInterval(() => {
        // @ts-expect-error - pageFlip() is added by the library at runtime
        flipBookRef.current?.pageFlip()?.flipNext();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, coverReady]);

  useEffect(() => {
    audioRef.current = new Audio("https://www.soundjay.com/misc/sounds/page-flip-01.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const onFlip = useCallback(
    (e: { data: number }) => {
      const page = e.data;
      setCurrentPage(page);
      setMountedPages((prev) => {
        const next = new Set(prev);
        const end = Math.min(numPages - 1, page + PAGE_AHEAD);
        for (let i = Math.max(0, page - PAGE_BEHIND); i <= end; i++) next.add(i);
        return next;
      });
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    },
    [numPages]
  );

  const onDocumentLoadSuccess = useCallback(
    (pdf: { numPages: number; getPage: (n: number) => Promise<unknown> }) => {
      setLoadError(null);
      setNumPages(pdf.numPages);
      setPdfReady(true);
      setLoadProgress(100);
      pdf
        .getPage(1)
        .then((page: unknown) => {
          const viewport = (
            page as { getViewport: (o: { scale: number }) => { width: number; height: number } }
          ).getViewport({ scale: 1 });
          setPageDim({ w: Math.round(viewport.width), h: Math.round(viewport.height) });
        })
        .catch(() => {
          console.error("Could not calculate PDF dimensions");
          setPageDim({ w: 600, h: 848 });
        });
    },
    []
  );

  const onDocumentLoadProgress = useCallback(
    ({ loaded, total }: { loaded: number; total: number }) => {
      if (total > 0) {
        setLoadProgress(Math.min(99, Math.round((loaded / total) * 100)));
      }
    },
    []
  );

  const onDocumentLoadError = useCallback((error: unknown) => {
    const message = formatPdfError(error);
    console.error("PDF Load Error:", message, error);
    setLoadError(message);
    setPdfReady(false);
    setNumPages(0);
    setCoverReady(false);
  }, []);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setLoadProgress(0);
    setPdfReady(false);
    setNumPages(0);
    setPageDim({ w: 0, h: 0 });
    setBookBox({ w: 0, h: 0 });
    setCoverReady(false);
    setFlipMounted(false);
    setFlipLive(false);
    setMountedPages(new Set([0, 1, 2, 3]));
    setLoadNonce((n) => n + 1);
  }, []);

  const onPreviewRenderSuccess = useCallback(() => {
    setCoverReady(true);
    requestAnimationFrame(() => {
      try {
        // @ts-expect-error pageFlip runtime API
        flipBookRef.current?.pageFlip()?.update();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const onCoverRenderSuccess = useCallback(() => {
    setCoverReady(true);
    setFlipLive(true);
  }, []);

  const getDynamicXOffset = () => {
    if (isZoomed) return "0%";
    if (currentPage === 0) return "-25%";
    if (currentPage === numPages - 1 && numPages % 2 === 0) return "25%";
    return "0%";
  };

  const handleZoomIn = () => {
    setIsZoomed(true);
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    if (zoomLevel <= 1.5) {
      setIsZoomed(false);
      setZoomLevel(1);
    } else {
      setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    }
  };

  const isPageVisible = useCallback(
    (index: number) => {
      if (index === 0) return true;
      return mountedPages.has(index);
    },
    [mountedPages]
  );

  // One flip page = half the spread. Canvas must fit *inside* that slot (contain), not stretch past it.
  const pageSlotW = bookBox.w > 0 ? Math.round(bookBox.w / 2) : Math.min(420, pageDim.w || 420);
  const pageSlotH = bookBox.h > 0 ? bookBox.h : Math.round(pageSlotW * 1.414);
  const pageCanvasWidth = (() => {
    if (pageDim.w <= 0 || pageDim.h <= 0) return pageSlotW;
    const scale = Math.min(pageSlotW / pageDim.w, pageSlotH / pageDim.h);
    return Math.max(1, Math.round(pageDim.w * scale));
  })();
  const coverHeight =
    pageDim.w > 0 ? Math.round(pageCanvasWidth * (pageDim.h / pageDim.w)) : pageSlotH;
  const layoutReady = bookBox.w > 40 && bookBox.h > 40;

  if (!doc) return null;

  const dimsReady = pageDim.w > 0 && pageDim.h > 0;
  const showBootOverlay = isOpen && !coverReady;

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[400] flex flex-col items-center justify-center transition-colors duration-700 ${
        readerBg === "black"
          ? "bg-zinc-950"
          : readerBg === "brand-blue"
            ? "bg-brand-blue"
            : "bg-zinc-100"
      } overflow-hidden`}
    >
      {/* Branded Background Watermark */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          readerBg === "white" ? "opacity-[0.05]" : "opacity-[0.1]"
        }`}
      >
        <div
          className={`aspect-square w-full ${readerBg === "brand-blue" ? "bg-white" : "bg-brand-blue"}`}
          style={{
            maskImage: "url(/images/logo/rvcc-grid.png)",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: "url(/images/logo/rvcc-grid.png)",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
      </div>

      {/* Boot overlay — stays until cover canvas has painted (not just PDF parse) */}
      <AnimatePresence>
        {showBootOverlay && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-brand-blue absolute inset-0 z-[480] flex flex-col items-center justify-center gap-4 px-6"
          >
            {loadError ? (
              <>
                <div className="text-xs font-black tracking-[0.4em] text-white uppercase">
                  Could not open PDF
                </div>
                <p className="max-w-md text-center text-sm text-white/70">{loadError}</p>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={retryLoad}
                    className="border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase hover:bg-white/20"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-white/10 px-4 py-2 text-[10px] font-black tracking-widest text-white/60 uppercase hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <div className="text-xs font-black tracking-[0.5em] text-white uppercase">
                  {coverReady
                    ? "Opening Book..."
                    : dimsReady
                      ? "Rendering Cover..."
                      : loadProgress > 0 && loadProgress < 100
                        ? `Loading PDF ${loadProgress}%`
                        : "Initializing Reader..."}
                </div>
                {loadProgress > 0 && loadProgress < 100 && (
                  <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-white transition-[width] duration-200"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Left - Back Button */}
      <div className="absolute top-8 left-8 z-[450]">
        <button
          onClick={onClose}
          className={`group flex h-12 w-12 items-center justify-center rounded-none backdrop-blur-xl transition-all duration-300 ${
            readerBg === "white"
              ? "text-brand-blue/60 hover:text-brand-blue border-brand-blue/5 border bg-white/40 shadow-sm"
              : "border border-white/5 bg-black/20 text-white/60 hover:bg-black/40 hover:text-white"
          }`}
          title="Back to Gallery"
        >
          <Icons.ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
        </button>
      </div>

      {/* Left Center - Vertical Page Index */}
      <div className="pointer-events-none absolute top-1/2 left-8 z-[450] -translate-y-1/2">
        <div
          className={`pointer-events-auto flex flex-col items-center gap-4 rounded-none border px-3 py-6 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${
            readerBg === "white"
              ? "border-brand-blue/10 text-brand-blue bg-white/30"
              : "border-white/10 bg-black/30 text-white"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black tracking-widest uppercase opacity-40 [writing-mode:vertical-lr]">
              PAGE
            </span>
            <div
              className={`h-8 w-[1px] ${readerBg === "white" ? "bg-brand-blue/10" : "bg-white/10"}`}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-black tracking-tighter">
              {String(currentPage + 1).padStart(2, "0")}
            </span>
            <div
              className={`h-[1px] w-4 ${readerBg === "white" ? "bg-brand-blue/20" : "bg-white/20"}`}
            />
            <span className="text-[10px] font-bold opacity-40">
              {String(numPages).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Book Area */}
      <div
        ref={containerRef}
        className="absolute inset-x-0 top-20 bottom-24 z-[400] flex items-center justify-center px-4 md:px-16"
      >
        <motion.div
          ref={bookRef}
          className={`relative flex items-center justify-center ${isZoomed ? "z-[460] cursor-grab active:cursor-grabbing" : "z-[400] cursor-pointer"}`}
          style={
            layoutReady
              ? {
                  width: bookBox.w,
                  height: bookBox.h,
                }
              : {
                  width: pageCanvasWidth,
                  height: coverHeight,
                }
          }
          drag={isZoomed}
          dragConstraints={containerRef}
          dragElastic={0.1}
          animate={{
            scale: zoomLevel,
            x: !flipLive || isZoomed ? 0 : getDynamicXOffset(),
            y: isZoomed ? undefined : 0,
          }}
          transition={
            flipLive ? { type: "tween", duration: 0.28, ease: "easeOut" } : { duration: 0 }
          }
        >
          <Document
            key={`${doc.filePath}:${loadNonce}`}
            file={doc.filePath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadProgress={onDocumentLoadProgress}
            onLoadError={onDocumentLoadError}
            onSourceError={onDocumentLoadError}
            options={PDF_DOCUMENT_OPTIONS}
            renderMode="canvas"
            className="relative flex h-full w-full items-center justify-center"
            loading={null}
          >
            {/* Instant cover (no StPageFlip) — visible from first paint / after READ prefetch */}
            {!flipLive && (
              <div
                className="relative z-20 flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)]"
                style={{ width: pageCanvasWidth, height: coverHeight }}
              >
                <div className="absolute inset-0 overflow-hidden bg-white">
                  <FlipPdfPage
                    pageNumber={1}
                    width={pageCanvasWidth}
                    devicePixelRatio={devicePixelRatio}
                    onReady={onPreviewRenderSuccess}
                  />
                </div>
              </div>
            )}

            {/* Flipbook mounts under/after preview; shown once update() has run */}
            {pdfReady && numPages > 0 && dimsReady && layoutReady && flipMounted && (
              // @ts-expect-error - HTMLFlipBook types are incomplete for some props
              <HTMLFlipBook
                key={`flip-${bookBox.w}x${bookBox.h}`}
                width={Math.max(1, pageSlotW)}
                height={Math.max(1, pageSlotH)}
                size="fixed"
                minWidth={Math.max(1, pageSlotW)}
                maxWidth={Math.max(1, pageSlotW)}
                minHeight={Math.max(1, pageSlotH)}
                maxHeight={Math.max(1, pageSlotH)}
                maxShadowOpacity={0.25}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={onFlip}
                flippingTime={550}
                usePortrait={false}
                startPage={0}
                drawShadow={true}
                useMouseEvents={!isZoomed}
                showPageCorners={!isZoomed}
                className={`transition-opacity duration-300 ${
                  flipLive
                    ? "relative z-10 opacity-100"
                    : "pointer-events-none absolute inset-0 opacity-0"
                } ${isZoomed ? "pointer-events-none" : "pointer-events-auto"} ${
                  currentPage === 0 ? "shadow-none" : "shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)]"
                }`}
                style={{ width: bookBox.w, height: bookBox.h }}
                ref={flipBookRef}
              >
                {Array.from(new Array(numPages), (_el, index) => {
                  const mounted = isPageVisible(index);
                  return (
                    <Page key={`page_${index + 1}`} number={index + 1}>
                      {mounted && pdfReady ? (
                        <FlipPdfPage
                          pageNumber={index + 1}
                          width={pageCanvasWidth}
                          devicePixelRatio={devicePixelRatio}
                          onReady={index === 0 ? onCoverRenderSuccess : undefined}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                          <div className="border-brand-blue/30 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                      )}
                    </Page>
                  );
                })}
              </HTMLFlipBook>
            )}
          </Document>
        </motion.div>
      </div>

      {/* Floating Right Toolbar */}
      <div className="fixed top-1/2 right-6 z-[450] flex -translate-y-1/2 flex-col items-end gap-3">
        <AnimatePresence>
          {showTools && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex flex-col items-center gap-4 rounded-none border p-2 shadow-2xl backdrop-blur-2xl transition-colors duration-300 ${
                readerBg === "white"
                  ? "border-brand-blue/10 bg-white/30"
                  : "border-white/10 bg-black/30"
              }`}
            >
              <button
                onClick={handleZoomIn}
                className={`rounded-none p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Zoom In"
              >
                <Icons.Plus className="h-5 w-5" />
              </button>

              <span
                className={`text-center text-[10px] font-bold ${readerBg === "white" ? "text-brand-blue" : "text-white"}`}
              >
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                onClick={handleZoomOut}
                className={`rounded-none p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Zoom Out"
              >
                <Icons.Minus className="h-5 w-5" />
              </button>

              <div
                className={`h-[1px] w-6 ${readerBg === "white" ? "bg-brand-blue/10" : "bg-white/10"}`}
              />

              <button
                onClick={() => setShowGrid(true)}
                className={`rounded-none p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Visual Grid"
              >
                <Icons.LayoutGrid className="h-5 w-5" />
              </button>

              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`rounded-none p-2 transition-colors ${isAutoPlaying ? (readerBg === "white" ? "text-brand-blue bg-brand-blue/10" : "bg-white/20 text-white") : readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5" : "text-white/60 hover:bg-white/10"}`}
                title="Auto-play Slideshow"
              >
                {isAutoPlaying ? (
                  <Icons.Pause className="h-5 w-5" />
                ) : (
                  <Icons.Play className="h-5 w-5" />
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`rounded-none p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                  title="Theme Settings"
                >
                  <Icons.Palette className="h-5 w-5" />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      className={`absolute top-0 right-full mr-4 flex min-w-[140px] flex-col gap-1 rounded-none border p-2 shadow-2xl backdrop-blur-2xl ${
                        readerBg === "white"
                          ? "border-brand-blue/10 bg-white/40"
                          : "border-white/10 bg-black/40"
                      }`}
                    >
                      {(
                        [
                          { id: "white", label: "Light", color: "bg-white border-zinc-200" },
                          { id: "black", label: "Dark", color: "bg-zinc-900 border-zinc-700" },
                          {
                            id: "brand-blue",
                            label: "Brand",
                            color: "bg-brand-blue border-brand-blue/20",
                          },
                        ] as const
                      ).map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => {
                            setReaderBg(bg.id);
                            setShowSettings(false);
                          }}
                          className={`flex items-center gap-3 rounded-none px-3 py-2.5 text-xs font-semibold transition-all ${
                            readerBg === bg.id
                              ? readerBg === "white"
                                ? "bg-brand-blue/10 text-brand-blue"
                                : "bg-white/15 text-white"
                              : readerBg === "white"
                                ? "text-zinc-600 hover:bg-zinc-100"
                                : "text-zinc-400 hover:bg-white/5"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border shadow-sm ${bg.color}`} />
                          {bg.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={toggleFullscreen}
                className={`rounded-none p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Icons.Minimize className="h-5 w-5" />
                ) : (
                  <Icons.Maximize className="h-5 w-5" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowTools(!showTools)}
          className={`flex h-12 w-12 items-center justify-center rounded-none border shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
            readerBg === "white"
              ? "text-brand-blue border-brand-blue/10 bg-white/30 hover:bg-white/50"
              : "border-white/10 bg-black/30 text-white hover:bg-black/50"
          } ${showTools ? "rotate-45" : "rotate-0"}`}
          title="Toggle Tools"
        >
          <Icons.Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Grid View — thumbnails only when opened; smaller canvases */}
      <AnimatePresence>
        {showGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex flex-col bg-zinc-950/98 backdrop-blur-3xl"
          >
            <div className="flex flex-none items-center justify-between border-b border-white/5 px-8 py-8 md:px-16">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">
                  Monograph Overview
                </h3>
                <p className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
                  Visual Index — {numPages} Pages
                </p>
              </div>
              <button
                onClick={() => setShowGrid(false)}
                className="group flex h-12 w-12 items-center justify-center rounded-full text-white/40 transition-all hover:bg-white/5 hover:text-white"
              >
                <Icons.Close className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>

            <div className="scrollbar-thumb-brand-blue/20 flex-1 scrollbar-thin overflow-y-auto p-8 md:p-16">
              <div className="mx-auto max-w-7xl">
                <Document file={doc.filePath} options={PDF_DOCUMENT_OPTIONS}>
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from(new Array(numPages), (_el, index) => (
                      <div
                        key={`grid_${index}`}
                        className="group relative flex cursor-pointer flex-col gap-4"
                        onClick={() => {
                          // @ts-expect-error - pageFlip is added at runtime
                          flipBookRef.current?.pageFlip()?.turnToPage(index);
                          setShowGrid(false);
                        }}
                      >
                        <div
                          className="group-hover:ring-brand-blue group-hover:shadow-brand-blue/20 relative overflow-hidden bg-white shadow-2xl ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02]"
                          style={{
                            aspectRatio: dimsReady ? `${pageDim.w / pageDim.h}` : "0.707",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PdfPage
                              pageNumber={index + 1}
                              width={180}
                              devicePixelRatio={1}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                          </div>
                          <div className="bg-brand-blue/0 group-hover:bg-brand-blue/10 absolute inset-0 flex items-center justify-center transition-colors">
                            <div className="translate-y-4 opacity-0 transition-opacity duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                              <div className="bg-brand-blue rounded-sm px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-xl">
                                Go to Page
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3 rounded-sm bg-black/90 px-2.5 py-1.5 text-[8px] font-black tracking-tighter text-white">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Document>
              </div>
              <div className="h-24" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
