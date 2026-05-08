"use client";

import Image from "next/image";

import { motion } from "framer-motion";

export const ServicesHero = () => {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/services/service_hero_new_v2_1778185307149.png"
          alt="Modern Architecture"
          fill
          className="object-cover"
          priority
        />
        {/* Subtle Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/10" />
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
              OUR SERVICES
            </span>
          </div>

          <h1 className="font-heading mb-10 text-6xl font-normal tracking-tighter text-white uppercase md:text-8xl lg:text-[10rem] lg:leading-[0.6em]">
            SHAPING <br />
            <span className="opacity-90">THE FUTURE</span>
          </h1>

          <p className="mb-12 max-w-xl text-lg font-light text-white/90 md:text-xl lg:text-2xl">
            Delivering excellence through innovative architectural solutions and precision
            engineering since 2006.
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
