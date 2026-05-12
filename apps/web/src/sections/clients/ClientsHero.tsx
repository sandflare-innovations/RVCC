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
    <section className="relative flex h-screen items-center overflow-hidden bg-white">
      {/* Dynamic 3D Card Background */}
      <div className={"pointer-events-auto absolute inset-0 z-0 opacity-100"}>
        <ThreeDMarquee images={marqueeImages} cols={4} className="h-full" />
      </div>

      <div className="relative z-30 container mx-auto flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading text-brand-blue text-6xl leading-[0.6] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-[12rem]"
          >
            Clients{" "}
            <span className="text-brand-blue">
              <br /> & Partners
            </span>
          </motion.h1>

          {/* <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-xl text-lg leading-relaxed font-medium text-zinc-900"
          >
            We take pride in our long-standing relationships with industry leaders, government
            entities, and private visionaries across the Middle East. Together, we are building the
            future.
          </motion.p> */}
        </div>
      </div>
    </section>
  );
};
