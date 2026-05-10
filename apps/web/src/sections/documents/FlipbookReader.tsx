"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import HTMLFlipBook from "react-pageflip";
import { Document, Page as PdfPage, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Icons } from "@repo/ui";

import { DocumentItem } from "@/data/documents";

// Set PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookReaderProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode }>(
  (props, ref) => {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-white" ref={ref}>
        {/* Sharp Glossy Specular Band - High contrast, no tinting */}
        <div className="pointer-events-none absolute inset-0 z-[6] bg-[linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.15)_50%,transparent_55%)]" />

        {/* Edge-Only Intense Lighting Bloom */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[7] h-1 bg-white/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-16 bg-gradient-to-b from-white/15 to-transparent" />

        {/* Softened Depth Crease */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-20 bg-gradient-to-r from-black/[0.08] via-black/[0.02] to-transparent" />

        {/* Page Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center">{props.children}</div>
      </div>
    );
  }
);

Page.displayName = "Page";

export const FlipbookReader = ({ isOpen, onClose, document: doc }: FlipbookReaderProps) => {
  const flipBookRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageDim, setPageDim] = useState({ w: 0, h: 0 }); // Stores exact native PDF dimensions
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerBg, setReaderBg] = useState<"white" | "black" | "brand-blue">("black");
  const [showSettings, setShowSettings] = useState(false);

  // Handle Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Handle Autoplay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && flipBookRef.current) {
      interval = setInterval(() => {
        // @ts-expect-error - pageFlip() is added by the library at runtime
        flipBookRef.current?.pageFlip()?.flipNext();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Preload Page Flipping Audio
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

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {}); // Catch autoplay policy blockers smoothly
    }
  }, []);

  // Safely extract the exact intrinsic aspect ratio and dimensions of the PDF
  const onDocumentLoadSuccess = (pdf: {
    numPages: number;
    getPage: (n: number) => Promise<unknown>;
  }) => {
    setNumPages(pdf.numPages);
    pdf
      .getPage(1)
      .then((page: unknown) => {
        // Safely extract viewport using a precise type cast to satisfy strict linting
        const viewport = (
          page as { getViewport: (o: { scale: number }) => { width: number; height: number } }
        ).getViewport({ scale: 1 });
        setPageDim({ w: viewport.width, h: viewport.height });
      })
      .catch(() => {
        console.error("Could not calculate PDF dimensions");
      });
  };

  // Exact centering using percentage offsets
  const getDynamicXOffset = () => {
    if (isZoomed) return "0%";
    if (currentPage === 0) return "-25%"; // Center front cover
    if (currentPage === numPages - 1 && numPages % 2 === 0) return "25%"; // Center back cover
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

  if (!doc) return null;

  // Calculate spread ratio. A spread is exactly 2 pages wide.
  const spreadRatio = pageDim.w > 0 ? (pageDim.w * 2) / pageDim.h : 1.414; // Default to A4 Spread ratio

  return (
    <AnimatePresence>
      {isOpen && (
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
              readerBg === "white" ? "opacity-[0.03]" : "opacity-[0.5]"
            }`}
          >
            <div
              className={`aspect-square w-full max-w-[1200px] ${readerBg === "brand-blue" ? "bg-white" : "bg-brand-blue"}`}
              style={{
                maskImage: "url(/images/logo/logo.png)",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                maskSize: "contain",
                WebkitMaskImage: "url(/images/logo/logo.png)",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "contain",
              }}
            />
          </div>

          {/* Top Header / Page Info */}
          <div className="pointer-events-none absolute top-0 right-0 left-0 z-[450] flex h-20 items-center justify-between px-6 md:px-8">
            <div
              className={`pointer-events-auto rounded-sm px-4 py-2 text-xs font-medium tracking-wider shadow-sm backdrop-blur-md transition-colors duration-300 md:text-sm ${
                readerBg === "white"
                  ? "border-brand-blue/10 text-brand-blue border bg-white/80"
                  : "border border-white/10 bg-black/40 text-white"
              }`}
            >
              {currentPage === 0
                ? "Cover"
                : `Pages ${currentPage + 1}-${Math.min(currentPage + 2, numPages)}`}{" "}
              / {numPages}
            </div>

            <button
              onClick={onClose}
              className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 ${
                readerBg === "white"
                  ? "text-brand-blue/60 hover:text-brand-blue bg-white/80 shadow-sm"
                  : "bg-black/40 text-white/60 hover:text-white"
              }`}
              title="Close Reader"
            >
              <Icons.Close className="h-6 w-6" />
            </button>
          </div>

          {/* Main Book Area */}
          <div
            ref={containerRef}
            className="absolute inset-x-0 top-20 bottom-24 z-[400] flex items-center justify-center px-4 md:px-16"
          >
            {/* Nav Left */}
            {!isZoomed && (
              <div className="absolute left-4 z-50 flex flex-col gap-4 md:left-8">
                <button
                  onClick={() => {
                    // @ts-expect-error - pageFlip is added at runtime
                    flipBookRef.current?.pageFlip()?.flipPrev();
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all ${
                    readerBg === "white"
                      ? "text-brand-blue/40 hover:text-brand-blue bg-white/50 hover:bg-white"
                      : "bg-black/20 text-white/40 hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Icons.ChevronLeft className="h-8 w-8 stroke-[1.5]" />
                </button>
              </div>
            )}

            {/* Dynamic Sized Flipbook Wrapper */}
            <motion.div
              className={`relative flex items-center justify-center ${isZoomed ? "z-[460] cursor-grab active:cursor-grabbing" : "z-[400] cursor-pointer"}`}
              style={
                pageDim.w > 0
                  ? {
                      aspectRatio: `${spreadRatio}`,
                      width: "100%",
                      maxHeight: "calc(100vh - 12rem)",
                      maxWidth: `calc((100vh - 12rem) * ${spreadRatio})`,
                    }
                  : {
                      width: "600px",
                      height: "850px",
                    }
              }
              drag={isZoomed}
              dragConstraints={containerRef}
              dragElastic={0.1}
              animate={{
                scale: zoomLevel,
                x: getDynamicXOffset(),
                y: isZoomed ? undefined : "0%",
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <Document
                file={doc.fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                className="flex h-full w-full items-center justify-center"
                loading={
                  <div
                    className={`animate-pulse text-xs font-black tracking-[0.5em] uppercase ${readerBg === "white" ? "text-brand-blue" : "text-white"}`}
                  >
                    Loading Monograph...
                  </div>
                }
              >
                {numPages > 0 && (
                  // @ts-expect-error - HTMLFlipBook types are incomplete for some props
                  <HTMLFlipBook
                    width={pageDim.w || 600} // Use native width or fallback for instant load
                    height={pageDim.h || 600 * 1.414} // Use native height or A4 fallback
                    size="stretch"
                    minWidth={200}
                    maxWidth={4000}
                    minHeight={300}
                    maxHeight={4000}
                    maxShadowOpacity={0.4}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    flippingTime={900}
                    usePortrait={false}
                    startPage={0}
                    drawShadow={true}
                    useMouseEvents={!isZoomed}
                    showPageCorners={!isZoomed}
                    className={`pointer-events-auto transition-shadow duration-700 ${
                      currentPage === 0
                        ? "shadow-none"
                        : "shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5),0_20px_40px_-10px_rgba(0,0,0,0.3)]"
                    }`}
                    ref={flipBookRef}
                  >
                    {Array.from(new Array(numPages), (el, index) => {
                      // Only render pages near the current spread to drastically improve performance
                      // We also always force-render the first page to fix the initial load bug
                      const isVisible = index === 0 || Math.abs(index - currentPage) <= 6;
                      return (
                        <Page key={`page_${index + 1}`} number={index + 1}>
                          {isVisible ? (
                            <div className="absolute inset-0 flex items-center justify-center [&_.react-pdf__Page]:!h-full [&_.react-pdf__Page]:!w-full [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:!object-contain">
                              <PdfPage
                                pageNumber={index + 1}
                                width={(pageDim.w || 600) * 1.5} // Use fallback or native width, always high-res
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                loading={
                                  <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                                    <div className="border-brand-blue h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                                  </div>
                                }
                              />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-100/50" />
                          )}
                        </Page>
                      );
                    })}
                  </HTMLFlipBook>
                )}
              </Document>
            </motion.div>

            {/* Nav Right */}
            {!isZoomed && (
              <div className="absolute right-4 z-50 flex flex-col gap-4 md:right-8">
                <button
                  onClick={() => {
                    // @ts-expect-error - pageFlip is added at runtime
                    flipBookRef.current?.pageFlip()?.flipNext();
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all ${
                    readerBg === "white"
                      ? "text-brand-blue/40 hover:text-brand-blue bg-white/50 hover:bg-white"
                      : "bg-black/20 text-white/40 hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <Icons.ChevronRight className="h-8 w-8 stroke-[1.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div
            className={`absolute bottom-6 left-1/2 z-[450] flex -translate-x-1/2 items-center gap-6 rounded-full border px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${
              readerBg === "white"
                ? "border-brand-blue/10 bg-white/90"
                : "border-white/10 bg-zinc-900/90"
            }`}
          >
            <button
              onClick={handleZoomOut}
              className={`rounded-full p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
              title="Zoom Out"
            >
              <Icons.Minus className="h-5 w-5" />
            </button>

            <span
              className={`w-10 text-center text-xs font-bold ${readerBg === "white" ? "text-brand-blue" : "text-white"}`}
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className={`rounded-full p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
              title="Zoom In"
            >
              <Icons.Plus className="h-5 w-5" />
            </button>

            <div
              className={`mx-1 h-6 w-[1px] ${readerBg === "white" ? "bg-brand-blue/10" : "bg-white/10"}`}
            />

            <button
              onClick={() => setShowGrid(true)}
              className={`rounded-full p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
              title="Visual Grid"
            >
              <Icons.LayoutGrid className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`rounded-full p-2 transition-colors ${isAutoPlaying ? (readerBg === "white" ? "text-brand-blue bg-brand-blue/10" : "bg-white/20 text-white") : readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5" : "text-white/60 hover:bg-white/10"}`}
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
                className={`rounded-full p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Theme Settings"
              >
                <Icons.Palette className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute bottom-full left-1/2 mb-4 flex min-w-[140px] -translate-x-1/2 flex-col gap-1 rounded-xl border p-2 shadow-2xl backdrop-blur-xl ${
                      readerBg === "white"
                        ? "border-brand-blue/10 bg-white/95"
                        : "border-white/10 bg-zinc-900/95"
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
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
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
              className={`rounded-full p-2 transition-colors ${readerBg === "white" ? "text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Icons.Minimize className="h-5 w-5" />
              ) : (
                <Icons.Maximize className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Grid View Overlay Component */}
          <AnimatePresence>
            {showGrid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] flex flex-col bg-zinc-950/98 backdrop-blur-3xl"
              >
                {/* Fixed Header */}
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

                {/* Scrollable Content */}
                <div className="scrollbar-thin scrollbar-thumb-brand-blue/20 flex-1 overflow-y-auto p-8 md:p-16">
                  <div className="mx-auto max-w-7xl">
                    <Document file={doc.fileUrl}>
                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from(new Array(numPages), (el, index) => (
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
                                aspectRatio: pageDim.w > 0 ? `${pageDim.w / pageDim.h}` : "0.707",
                              }}
                            >
                              <div className="absolute inset-0 [&_.react-pdf__Page]:!h-full [&_.react-pdf__Page]:!w-full [&_.react-pdf__Page__canvas]:!h-full [&_.react-pdf__Page__canvas]:!w-full [&_.react-pdf__Page__canvas]:!object-cover">
                                <PdfPage
                                  pageNumber={index + 1}
                                  width={300}
                                  renderAnnotationLayer={false}
                                  renderTextLayer={false}
                                />
                              </div>
                              {/* Overlay on hover */}
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
                  {/* Bottom Spacer */}
                  <div className="h-24" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
