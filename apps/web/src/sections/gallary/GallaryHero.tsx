"use client";

import { motion } from "framer-motion";

import { MarqueeImage, ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GALLARY_PROJECTS } from "@/data/gallary";

import { cn } from "@lib/utils";

export const GallaryHero = () => {
  // Collect all images from all projects for the marquee
  const marqueeImages: MarqueeImage[] = GALLARY_PROJECTS.flatMap((project) =>
    project.images.slice(0, 3).map((img) => ({
      src: img,
      alt: project.title,
      href: `/gallary/${project.slug}`,
    }))
  );

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black pt-32 pb-20">
      {/* 3D Marquee Background */}
      <div className={cn("pointer-events-auto absolute inset-0 z-0 opacity-50")}>
        <ThreeDMarquee images={marqueeImages} cols={4} className="h-full" />
      </div>

      <div
        className={cn(
          "pointer-events-none relative z-10 container mx-auto h-full px-6 select-none"
        )}
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1
              className={cn(
                "text-7xl font-bold tracking-tight text-white md:text-9xl lg:text-[12rem]"
              )}
            >
              GALLERY
            </h1>
            <p
              className={cn(
                "mx-auto max-w-2xl text-lg leading-relaxed font-light text-white/60 md:text-xl"
              )}
            >
              Explore our curated portfolio of architectural achievements, where structural
              precision meets visionary design across commercial and residential landscapes.
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-20 flex flex-col items-center gap-4"
          >
            <span className={cn("text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase")}>
              Discover Collections
            </span>
            <div className={cn("from-brand-blue h-12 w-px bg-gradient-to-b to-transparent")} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
