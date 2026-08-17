"use client";

import { motion } from "framer-motion";

import { Icons } from "@/lib/ui";

export const CareerHero = () => {
  const scrollToPositions = () => {
    const element = document.getElementById("open-positions");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Background Image with Architectural Overlay */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          className="h-full w-full bg-[url('/images/careers/premium_studio.webp')] bg-cover bg-center grayscale-0"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 container mx-auto flex h-full flex-col justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-5xl"
        >
          <div className="mb-8 flex items-center space-x-4">
            <div className="h-[2px] w-12 bg-white" />
            <span className="text-[20px] font-bold tracking-[0.5em] text-white uppercase">
              EVOLVE WITH US
            </span>
          </div>

          <h1 className="font-heading mb-10 text-6xl font-normal tracking-tighter text-white uppercase md:text-8xl lg:text-[10rem] lg:leading-[0.6em]">
            ARCHITECT <br />
            <span className="opacity-90">THE FUTURE</span>
          </h1>

          <div className="mb-16 flex flex-col justify-between gap-12 md:gap-24 lg:flex-row lg:items-center">
            <p className="max-w-xl text-lg leading-relaxed font-light text-white/90 md:text-xl lg:text-2xl">
              Join a team of visionaries and creators dedicated to reshaping the skyline of the
              Kingdom through monumental design and engineering.
            </p>

            <div className="order-first flex gap-12 border-r border-white/20 pr-8 md:pr-16 lg:order-last">
              <div className="space-y-1 text-right">
                <span className="font-heading block text-4xl text-white">12+</span>
                <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase">
                  Open Roles
                </span>
              </div>
              <div className="space-y-1 text-right">
                <span className="font-heading block text-4xl text-white">150+</span>
                <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase">
                  Experts
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient Overlay (Blending into the white section below) */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-40 bg-linear-to-t from-white to-transparent dark:from-zinc-950" />

      {/* Bottom Visual Element - Centered */}
      <div className="absolute bottom-12 left-1/2 z-30 hidden -translate-x-1/2 md:block">
        <button
          onClick={scrollToPositions}
          className="group flex cursor-pointer flex-col items-center space-y-4"
        >
          <span className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase transition-colors group-hover:text-white">
            SCROLL
          </span>
          <div className="group-hover:bg-brand-blue h-24 w-px bg-white/20 transition-all group-hover:h-32" />
        </button>
      </div>
    </section>
  );
};
