"use client";

import { motion } from "framer-motion";

import { MarqueeImage, ThreeDMarquee } from "@/components/ui/3d-marquee";
import { GALLARY_PROJECTS } from "@/data/gallary";

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
      <div className="pointer-events-auto absolute inset-0 z-0 opacity-50">
        <ThreeDMarquee images={marqueeImages} cols={4} className="h-full" />
      </div>

      <div className="pointer-events-none relative z-10 container mx-auto h-full px-6 select-none">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-bold text-7xl tracking-tight text-white md:text-9xl lg:text-[12rem]">
              GALLERY
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed font-light text-white/60 md:text-xl">
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
            <span className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
              Discover Collections
            </span>
            <div className="from-brand-blue h-12 w-px bg-gradient-to-b to-transparent" />
          </motion.div>
        </div>
      </div>

      {/* Decorative Overlays - Black Themed */}
      {/* <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 z-[1]" />
 */}
    </section>
  );
};
