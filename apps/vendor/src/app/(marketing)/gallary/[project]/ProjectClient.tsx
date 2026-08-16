"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { GallaryProject } from "@/data/gallary";

import { cn } from "@/lib/utils";

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
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto"
          >
            <h1 className="mb-6 text-5xl font-bold text-white uppercase md:text-9xl">
              {project.title}
            </h1>
            <div className="bg-brand-blue mx-auto h-1 w-24" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4"
            >
              <span className="text-[10px] font-bold tracking-[0.5em] text-white/40 uppercase">
                Scroll to explore
              </span>
              <div className="from-brand-blue h-12 w-px bg-gradient-to-b to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-32">
        <div className="container mx-auto">
          {/* Header Info */}
          <div className="mb-24 flex flex-col justify-between gap-12 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <Link
                href="/gallary"
                className="group text-brand-blue mb-12 flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase transition-all hover:gap-5"
              >
                <Icons.ChevronRight className="h-4 w-4 rotate-180" />
                Back to Collections
              </Link>
              <h2 className="text-brand-blue mb-6 text-xs font-bold tracking-widest uppercase">
                About the Project
              </h2>
              <p className="text-foreground/80 text-xl leading-snug font-light md:text-3xl">
                {project.description}
              </p>
            </div>

            <div className="text-foreground/30 flex flex-col items-end gap-2">
              <span className="font-primary text-6xl font-black">{project.images.length}</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">
                Captured Moments
              </span>
            </div>
          </div>

          {/* Masonry Gallery */}
          <div className="columns-1 gap-8 space-y-8 md:columns-2 lg:columns-3">
            {project.images.map((img, i) => (
              <motion.div
                key={`${project.slug}-img-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => setSelectedImageIndex(i)}
                className="group bg-muted relative cursor-zoom-in break-inside-avoid overflow-hidden rounded-none shadow-lg transition-all duration-500"
              >
                <Image
                  src={img}
                  alt={`${project.title} - image ${i + 1}`}
                  width={800}
                  height={600}
                  className="h-auto w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="bg-brand-blue/10 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
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
            className="bg-background/98 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close Button */}
            <button
              className="text-foreground/50 hover:text-foreground absolute top-8 right-8 z-[110] transition-colors"
              onClick={() => setSelectedImageIndex(null)}
            >
              <Icons.Close className="h-10 w-10" />
            </button>

            {/* Carousel Container */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <div className="relative flex h-full w-full items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  {/* Previous Image Preview */}
                  {!isZoomed && (
                    <motion.div
                      key={`prev-${selectedImageIndex}`}
                      initial={{ opacity: 0, x: "-50%", scale: 0.8 }}
                      animate={{ opacity: 0.2, x: "-80%", scale: 1 }}
                      exit={{ opacity: 0, x: "-100%", scale: 0.8 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-auto absolute hidden h-screen w-[20vw] cursor-pointer xl:block"
                      onClick={prevImage}
                    >
                      <Image
                        src={
                          project.images[
                            (selectedImageIndex - 1 + project.images.length) % project.images.length
                          ]
                        }
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
                      scale: { duration: 0.4 },
                    }}
                    className="pointer-events-auto relative z-20 h-screen w-screen cursor-crosshair overflow-hidden shadow-2xl select-none"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={() => setIsZoomed(!isZoomed)}
                    onMouseMove={handleMouseMove}
                  >
                    <motion.div
                      className="relative h-full w-full"
                      animate={{
                        scale: isZoomed ? 4 : 1,
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
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
                      className="pointer-events-auto absolute hidden h-screen w-[20vw] cursor-pointer xl:block"
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
                <div
                  className="group absolute inset-y-0 left-0 z-[105] w-[15%] cursor-pointer"
                  onClick={prevImage}
                >
                  <div className="absolute top-1/2 left-12 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Icons.ChevronRight className="text-brand-blue h-12 w-12 rotate-180" />
                  </div>
                </div>
                <div
                  className="group absolute inset-y-0 right-0 z-[105] w-[15%] cursor-pointer"
                  onClick={nextImage}
                >
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Icons.ChevronRight className="text-brand-blue h-12 w-12" />
                  </div>
                </div>
              </>
            )}

            {/* Footer Counter */}
            <div className="absolute bottom-10 left-1/2 z-[110] flex -translate-x-1/2 flex-col items-center gap-4">
              <div className="flex items-center">
                <div className="flex flex-col items-center rounded-full border border-white/10 bg-black/20 px-10 py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2 font-sans text-xl font-light tracking-widest text-white">
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
