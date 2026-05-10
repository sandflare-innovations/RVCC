"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@repo/ui";
import { pdfjs, Document, Page as PdfPage } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
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
      <div className="bg-white overflow-hidden flex flex-col h-full w-full relative" ref={ref}>
        {/* Sharp Glossy Specular Band - High contrast, no tinting */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.15)_50%,transparent_55%)] pointer-events-none z-[6]" />

        {/* Edge-Only Intense Lighting Bloom */}
        <div className="absolute inset-x-0 top-0 h-1 bg-white/40 pointer-events-none z-[7]" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/15 to-transparent pointer-events-none z-[6]" />

        {/* Softened Depth Crease */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/[0.08] via-black/[0.02] to-transparent pointer-events-none z-[5]" />

        {/* Page Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center">
          {props.children}
        </div>
      </div>
    );
  }
);

Page.displayName = "Page";

export const FlipbookReader = ({ isOpen, onClose, document: doc }: FlipbookReaderProps) => {
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState<number>(0);
  const [windowSize, setWindowSize] = useState({ w: 1200, h: 800 });
  const [pageDim, setPageDim] = useState({ w: 0, h: 0 }); // Stores exact native PDF dimensions
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerBg, setReaderBg] = useState<'white' | 'black' | 'brand-blue'>('black');
  const [showSettings, setShowSettings] = useState(false);

  // Handle Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Autoplay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && flipBookRef.current) {
      interval = setInterval(() => {
        flipBookRef.current.pageFlip().flipNext();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Handle Window Resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Preload Page Flipping Audio
  useEffect(() => {
    audioRef.current = new Audio("https://www.soundjay.com/misc/sounds/page-flip-01.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { }); // Catch autoplay policy blockers smoothly
    }
  }, []);

  // Safely extract the exact intrinsic aspect ratio and dimensions of the PDF
  const onDocumentLoadSuccess = (pdf: any) => {
    setNumPages(pdf.numPages);
    pdf.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      setPageDim({ w: viewport.width, h: viewport.height });
    }).catch(() => {
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
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    if (zoomLevel <= 1.5) {
      setIsZoomed(false);
      setZoomLevel(1);
    } else {
      setZoomLevel(prev => Math.max(prev - 0.5, 1));
    }
  };

  if (!doc) return null;

  // Calculate spread ratio. A spread is exactly 2 pages wide.
  const spreadRatio = pageDim.w > 0 ? (pageDim.w * 2) / pageDim.h : 1.414; // Default to A4 Spread ratio

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[400] flex flex-col items-center justify-center transition-colors duration-700 ${readerBg === 'black' ? 'bg-zinc-950' : readerBg === 'brand-blue' ? 'bg-brand-blue' : 'bg-zinc-100'
          } overflow-hidden`}>

          {/* Branded Background Watermark */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${readerBg === 'white' ? 'opacity-[0.03]' : 'opacity-[0.5]'
            }`}>
            <div
              className={`w-full max-w-[1200px] aspect-square ${readerBg === 'brand-blue' ? 'bg-white' : 'bg-brand-blue'}`}
              style={{
                maskImage: 'url(/images/logo/logo.png)',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskImage: 'url(/images/logo/logo.png)',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskSize: 'contain',
              }}
            />
          </div>

          {/* Top Header / Page Info */}
          <div className="absolute top-0 left-0 right-0 h-20 px-6 md:px-8 flex items-center justify-between z-[450] pointer-events-none">
            <div className={`px-4 py-2 text-xs md:text-sm font-medium tracking-wider rounded-sm pointer-events-auto transition-colors duration-300 shadow-sm backdrop-blur-md ${readerBg === 'white'
              ? 'bg-white/80 border border-brand-blue/10 text-brand-blue'
              : 'bg-black/40 border border-white/10 text-white'
              }`}>
              {currentPage === 0 ? 'Cover' : `Pages ${currentPage + 1}-${Math.min(currentPage + 2, numPages)}`} / {numPages}
            </div>

            <button
              onClick={onClose}
              className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 pointer-events-auto backdrop-blur-md ${readerBg === 'white' ? 'bg-white/80 text-brand-blue/60 hover:text-brand-blue shadow-sm' : 'bg-black/40 text-white/60 hover:text-white'
                }`}
              title="Close Reader"
            >
              <Icons.Close className="h-6 w-6" />
            </button>
          </div>

          {/* Main Book Area */}
          <div ref={containerRef} className="absolute inset-x-0 top-20 bottom-24 flex items-center justify-center z-[400] px-4 md:px-16 ">

            {/* Nav Left */}
            {!isZoomed && (
              <div className="absolute left-4 md:left-8 flex flex-col gap-4 z-50">
                <button
                  onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
                  className={`h-14 w-14 flex items-center justify-center rounded-full transition-all backdrop-blur-sm shadow-lg ${readerBg === 'white' ? 'bg-white/50 text-brand-blue/40 hover:text-brand-blue hover:bg-white' : 'bg-black/20 text-white/40 hover:text-white hover:bg-black/40'
                    }`}
                >
                  <Icons.ChevronLeft className="h-8 w-8 stroke-[1.5]" />
                </button>
              </div>
            )}

            {/* Dynamic Sized Flipbook Wrapper */}
            <motion.div
              className={`relative flex items-center justify-center ${isZoomed ? "cursor-grab active:cursor-grabbing z-[460]" : "cursor-pointer z-[400]"}`}
              style={pageDim.w > 0 ? {
                aspectRatio: `${spreadRatio}`,
                width: '100%',
                maxHeight: "calc(100vh - 12rem)",
                maxWidth: `calc((100vh - 12rem) * ${spreadRatio})`,
              } : {
                width: '600px',
                height: '850px'
              }}
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
                className="w-full h-full flex items-center justify-center"
                loading={
                  <div className={`text-xs font-black tracking-[0.5em] uppercase animate-pulse ${readerBg === 'white' ? 'text-brand-blue' : 'text-white'}`}>
                    Loading Monograph...
                  </div>
                }
              >
                {numPages > 0 && pageDim.w > 0 && (
                  /* @ts-ignore */
                  <HTMLFlipBook
                    width={pageDim.w} // Exact native width
                    height={pageDim.h} // Exact native height
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
                    className={`transition-shadow duration-700 pointer-events-auto ${currentPage === 0
                      ? "shadow-none"
                      : "shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5),0_20px_40px_-10px_rgba(0,0,0,0.3)]"
                      }`}
                    ref={flipBookRef}
                  >
                    {Array.from(new Array(numPages), (el, index) => {
                      // Only render pages near the current spread to drastically improve performance
                      const isVisible = Math.abs(index - currentPage) <= 4;
                      return (
                        <Page key={`page_${index + 1}`} number={index + 1}>
                          {isVisible ? (
                            <div className="absolute inset-0 flex items-center justify-center [&_.react-pdf__Page]:!w-full [&_.react-pdf__Page]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!object-contain">
                              <PdfPage
                                pageNumber={index + 1}
                                width={pageDim.w * 1.5} // High-res render, scale to fit with CSS
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                loading={
                                  <div className="flex items-center justify-center h-full w-full bg-zinc-50">
                                    <div className="h-6 w-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                                  </div>
                                }
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-zinc-100/50" />
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
              <div className="absolute right-4 md:right-8 flex flex-col gap-4 z-50">
                <button
                  onClick={() => flipBookRef.current?.pageFlip().flipNext()}
                  className={`h-14 w-14 flex items-center justify-center rounded-full transition-all backdrop-blur-sm shadow-lg ${readerBg === 'white' ? 'bg-white/50 text-brand-blue/40 hover:text-brand-blue hover:bg-white' : 'bg-black/20 text-white/40 hover:text-white hover:bg-black/40'
                    }`}
                >
                  <Icons.ChevronRight className="h-8 w-8 stroke-[1.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-xl px-4 py-2.5 flex items-center gap-6 rounded-full shadow-2xl z-[450] border transition-colors duration-300 ${readerBg === 'white' ? 'bg-white/90 border-brand-blue/10' : 'bg-zinc-900/90 border-white/10'
            }`}>

            <button
              onClick={handleZoomOut}
              className={`p-2 rounded-full transition-colors ${readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Zoom Out"
            >
              <Icons.Minus className="h-5 w-5" />
            </button>

            <span className={`text-xs font-bold w-10 text-center ${readerBg === 'white' ? 'text-brand-blue' : 'text-white'}`}>
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className={`p-2 rounded-full transition-colors ${readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Zoom In"
            >
              <Icons.Plus className="h-5 w-5" />
            </button>

            <div className={`w-[1px] h-6 mx-1 ${readerBg === 'white' ? 'bg-brand-blue/10' : 'bg-white/10'}`} />

            <button
              onClick={() => setShowGrid(true)}
              className={`p-2 rounded-full transition-colors ${readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Visual Grid"
            >
              <Icons.LayoutGrid className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2 rounded-full transition-colors ${isAutoPlaying ? (readerBg === 'white' ? 'text-brand-blue bg-brand-blue/10' : 'text-white bg-white/20') : (readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5' : 'text-white/60 hover:bg-white/10')}`}
              title="Auto-play Slideshow"
            >
              {isAutoPlaying ? <Icons.Pause className="h-5 w-5" /> : <Icons.Play className="h-5 w-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-colors ${readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
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
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-2 rounded-xl shadow-2xl border flex flex-col gap-1 min-w-[140px] backdrop-blur-xl ${readerBg === 'white' ? 'bg-white/95 border-brand-blue/10' : 'bg-zinc-900/95 border-white/10'
                      }`}
                  >
                    {[
                      { id: 'white', label: 'Light', color: 'bg-white border-zinc-200' },
                      { id: 'black', label: 'Dark', color: 'bg-zinc-900 border-zinc-700' },
                      { id: 'brand-blue', label: 'Brand', color: 'bg-brand-blue border-brand-blue/20' }
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => { setReaderBg(bg.id as any); setShowSettings(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${readerBg === bg.id
                          ? (readerBg === 'white' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-white/15 text-white')
                          : (readerBg === 'white' ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-white/5')
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
              className={`p-2 rounded-full transition-colors ${readerBg === 'white' ? 'text-brand-blue/60 hover:bg-brand-blue/5 hover:text-brand-blue' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
              title="Fullscreen"
            >
              {isFullscreen ? <Icons.Minimize className="h-5 w-5" /> : <Icons.Maximize className="h-5 w-5" />}
            </button>
          </div>

          {/* Grid View Overlay Component */}
          <AnimatePresence>
            {showGrid && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] bg-zinc-950/98 backdrop-blur-3xl flex flex-col"
              >
                {/* Fixed Header */}
                <div className="flex-none px-8 md:px-16 py-8 flex justify-between items-center border-b border-white/5">
                  <div className="space-y-1">
                    <h3 className="text-white text-2xl font-black uppercase tracking-tighter">Monograph Overview</h3>
                    <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">Visual Index — {numPages} Pages</p>
                  </div>
                  <button
                    onClick={() => setShowGrid(false)}
                    className="h-12 w-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all group"
                  >
                    <Icons.Close className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-16 scrollbar-thin scrollbar-thumb-brand-blue/20">
                  <div className="max-w-7xl mx-auto">
                    <Document file={doc.fileUrl}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {Array.from(new Array(numPages), (el, index) => (
                          <div
                            key={`grid_${index}`}
                            className="group relative flex flex-col gap-4 cursor-pointer"
                            onClick={() => {
                              flipBookRef.current?.pageFlip().turnToPage(index);
                              setShowGrid(false);
                            }}
                          >
                            <div
                              className="relative bg-white overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-500 group-hover:ring-brand-blue group-hover:scale-[1.02] group-hover:shadow-brand-blue/20"
                              style={{ aspectRatio: pageDim.w > 0 ? `${pageDim.w / pageDim.h}` : '0.707' }}
                            >
                              <div className="absolute inset-0 [&_.react-pdf__Page]:!w-full [&_.react-pdf__Page]:!h-full [&_.react-pdf__Page__canvas]:!w-full [&_.react-pdf__Page__canvas]:!h-full [&_.react-pdf__Page__canvas]:!object-cover">
                                <PdfPage
                                  pageNumber={index + 1}
                                  width={300}
                                  renderAnnotationLayer={false}
                                  renderTextLayer={false}
                                />
                              </div>
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-brand-blue/0 group-hover:bg-brand-blue/10 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                                  <div className="bg-brand-blue text-white text-[10px] font-black px-4 py-2 uppercase tracking-widest rounded-sm shadow-xl">
                                    Go to Page
                                  </div>
                                </div>
                              </div>
                              <div className="absolute bottom-3 left-3 bg-black/90 text-white text-[8px] px-2.5 py-1.5 font-black tracking-tighter rounded-sm">
                                {String(index + 1).padStart(2, '0')}
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