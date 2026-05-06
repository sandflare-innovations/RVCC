"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@repo/ui";
import { GallaryProject } from "@/data/gallary";
import { cn } from "../../../lib/utils";

interface ProjectClientProps {
  project: GallaryProject;
}

export default function ProjectClient({ project }: ProjectClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setIsZoomed(false);
    setDirection(1);
    setSelectedImageIndex((selectedImageIndex + 1) % project.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setIsZoomed(false);
    setDirection(-1);
    setSelectedImageIndex((selectedImageIndex - 1 + project.images.length) % project.images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 20,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <>
      {/* Full-Screen Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <Image
          src={project.thumbnail}
          alt={project.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={100}
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto"
          >
            <h1 className="text-5xl md:text-9xl font-bold text-white mb-6 uppercase">
              {project.title}
            </h1>
            <div className="h-1 w-24 bg-brand-blue mx-auto" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
              <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase">Scroll to explore</span>
              <div className="w-px h-12 bg-gradient-to-b from-brand-blue to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="container mx-auto">
          {/* Header Info */}
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <Link
                href="/gallary"
                className="group flex items-center gap-3 text-brand-blue font-bold tracking-widest text-[10px] uppercase mb-12 hover:gap-5 transition-all"
              >
                <Icons.ChevronRight className="w-4 h-4 rotate-180" />
                Back to Collections
              </Link>
              <h2 className="text-brand-blue font-bold tracking-widest uppercase text-xs mb-6">About the Project</h2>
              <p className="text-foreground/80 text-xl md:text-3xl font-light leading-snug">
                {project.description}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-foreground/30">
              <span className="text-6xl font-black font-primary">{project.images.length}</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Captured Moments</span>
            </div>
          </div>

          {/* Masonry Gallery */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {project.images.map((img, i) => (
              <motion.div
                key={`${project.slug}-img-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => setSelectedImageIndex(i)}
                className="break-inside-avoid rounded-none overflow-hidden group relative bg-muted shadow-lg cursor-zoom-in transition-all duration-500"
              >
                <Image
                  src={img}
                  alt={`${project.title} - image ${i + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={85}
                />
                <div className="absolute inset-0 bg-brand-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Screen Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/98 backdrop-blur-2xl"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-8 right-8 text-foreground/50 hover:text-foreground transition-colors z-[110]"
              onClick={() => setSelectedImageIndex(null)}
            >
              <Icons.Close className="w-10 h-10" />
            </button>

            {/* Carousel Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  {/* Previous Image Preview */}
                  {!isZoomed && (
                    <motion.div
                      key={`prev-${selectedImageIndex}`}
                      initial={{ opacity: 0, x: "-50%", scale: 0.8 }}
                      animate={{ opacity: 0.2, x: "-80%", scale: 1 }}
                      exit={{ opacity: 0, x: "-100%", scale: 0.8 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute hidden xl:block w-[20vw] h-screen cursor-pointer pointer-events-auto"
                      onClick={prevImage}
                    >
                      <Image
                        src={project.images[(selectedImageIndex - 1 + project.images.length) % project.images.length]}
                        alt="Previous"
                        fill
                        className="object-cover grayscale"
                        sizes="20vw"
                      />
                    </motion.div>
                  )}

                  {/* Active Main Image */}
                  <motion.div
                    key={selectedImageIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.4 },
                      scale: { duration: 0.4 }
                    }}
                    className="relative w-screen h-screen z-20 shadow-2xl pointer-events-auto cursor-crosshair select-none overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={() => setIsZoomed(!isZoomed)}
                    onMouseMove={handleMouseMove}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      animate={{
                        scale: isZoomed ? 4 : 1,
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                      }}
                      transition={{ type: "spring", stiffness: 150, damping: 25, mass: 0.5 }}
                    >
                      <Image
                        src={project.images[selectedImageIndex]}
                        alt="Fullscreen view"
                        fill
                        className={cn(
                          "transition-all duration-300",
                          isZoomed ? "object-cover" : "object-contain"
                        )}
                        sizes="100vw"
                        quality={100}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Next Image Preview */}
                  {!isZoomed && (
                    <motion.div
                      key={`next-${selectedImageIndex}`}
                      initial={{ opacity: 0, x: "50%", scale: 0.8 }}
                      animate={{ opacity: 0.2, x: "80%", scale: 1 }}
                      exit={{ opacity: 0, x: "100%", scale: 0.8 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute hidden xl:block w-[20vw] h-screen cursor-pointer pointer-events-auto"
                      onClick={nextImage}
                    >
                      <Image
                        src={project.images[(selectedImageIndex + 1) % project.images.length]}
                        alt="Next"
                        fill
                        className="object-cover grayscale"
                        sizes="20vw"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Overlay Navigation (Invisible areas for clicking) */}
            {!isZoomed && (
              <>
                <div className="absolute inset-y-0 left-0 w-[15%] z-[105] cursor-pointer group" onClick={prevImage}>
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.ChevronRight className="w-12 h-12 rotate-180 text-brand-blue" />
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 w-[15%] z-[105] cursor-pointer group" onClick={nextImage}>
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.ChevronRight className="w-12 h-12 text-brand-blue" />
                  </div>
                </div>
              </>
            )}

            {/* Footer Counter */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[110]">
              <div className="flex items-center">
                <div className="bg-black/20 backdrop-blur-sm px-10 py-2 rounded-full border border-white/10 flex flex-col items-center">
                  <div className="text-white text-xl font-light tracking-widest font-sans flex items-center gap-2">
                    <span className="text-white">{selectedImageIndex + 1}</span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/40">{project.images.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
