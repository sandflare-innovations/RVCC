"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { HeroSlideItem } from "@/types/hero";

export const ServicesHero = ({ hero }: { hero?: Partial<HeroSlideItem> | null }) => {
  const badge = hero?.badge || "OUR SERVICES";
  const title1 = hero?.title1 || "SHAPING";
  const title2 = hero?.title2 || "THE FUTURE";
  const description =
    hero?.description ||
    "Delivering excellence through innovative architectural solutions and precision engineering since 2006.";
  const imageUrl =
    hero?.imageUrl ||
    "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp";

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title1}
          fill
          className="object-cover"
          priority
        />
        {/* Subtle Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative container flex h-full flex-col justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-4xl"
        >
          <div className="mb-8 flex items-center space-x-4">
            <div className="h-[2px] w-12 bg-white" />
            <span className="text-[20px] font-bold tracking-[0.5em] text-white uppercase">
              {badge}
            </span>
          </div>

          <h1 className="font-heading mb-10 text-6xl font-normal tracking-tighter text-white uppercase md:text-8xl lg:text-[10rem] lg:leading-[0.6em]">
            {title1} <br />
            <span className="opacity-90">{title2}</span>
          </h1>

          <p className="mb-12 max-w-xl text-lg font-light text-white/90 md:text-xl lg:text-2xl">
            {description}
          </p>
        </motion.div>
      </div>

      {/* Bottom Gradient Overlay (Blending into the white section below) */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-40 bg-linear-to-t from-white to-transparent" />

      {/* Bottom Visual Element */}
      <div className="absolute bottom-12 left-12 hidden md:block">
        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
            SCROLL
          </span>
          <div className="h-px w-24 bg-white/20" />
        </div>
      </div>
    </section>
  );
};
