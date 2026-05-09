"use client";

import { motion } from "framer-motion";

export const DocumentHero = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-40 pb-20">
      <div className="container mx-auto px-6">
        <div className="flex max-w-4xl flex-col items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brand-blue mb-6 block text-[10px] font-black tracking-[0.4em] uppercase">
              Knowledge Repository
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-6xl leading-[0.85] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-[10rem]"
          >
            Documents <span className="text-brand-blue">&</span> <br />
            Resources
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-2xl text-lg leading-relaxed font-medium text-zinc-500"
          >
            Access our comprehensive collection of company profiles, technical specifications, and
            regulatory standards. Designed for clarity, engineered for excellence.
          </motion.p>
        </div>
      </div>

      {/* Background Architectural Accent */}
      <div className="absolute top-0 right-0 -z-10 hidden h-full w-1/3 bg-zinc-50/50 lg:block" />
    </section>
  );
};
