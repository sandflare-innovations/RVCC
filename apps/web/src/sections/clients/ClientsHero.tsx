"use client";

import { clients } from "@data/clients";
import { motion } from "framer-motion";

import { ThreeDMarquee } from "@components/ui/3d-marquee";

export const ClientsHero = () => {
  const marqueeImages = clients.map((client) => ({
    src: client.logo,
    alt: client.name,
  }));

  return (
    <section className="relative flex min-h-[95vh] items-center overflow-hidden bg-white pt-32 pb-20">
      {/* Dynamic 3D Card Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10">
          <ThreeDMarquee
            images={marqueeImages}
            className="h-full transition-all duration-1000"
            cols={6}
          />
        </div>
      </div>

      <div className="relative z-30 container mx-auto flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brand-blue mb-6 block text-[10px] font-black tracking-[0.5em] uppercase">
              Our Ecosystem
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-brand-blue text-6xl leading-[0.6] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-[8.5rem] xl:text-[10rem]"
          >
            Clients{" "}
            <span className="text-brand-blue">
              <br /> &
            </span>{" "}
            Partners
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-xl text-lg leading-relaxed font-medium text-zinc-900"
          >
            We take pride in our long-standing relationships with industry leaders, government
            entities, and private visionaries across the Middle East. Together, we are building the
            future.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
