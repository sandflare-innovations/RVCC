"use client";

import { ThreeDMarquee } from "@components/ui/3d-marquee";
import { motion } from "framer-motion";

import type { ClientItemProp } from "./ClientsGrid";

export const ClientsHero = ({ initialClients }: { initialClients?: ClientItemProp[] }) => {
  const marqueeImages = (initialClients || [])
    .map((client) => ({
      src: client.logoUrl || client.logo || "",
      alt: client.name,
    }))
    .filter((img) => Boolean(img.src));

  return (
    <section className="relative flex h-screen items-center overflow-hidden bg-white">
      {/* Dynamic 3D Card Background */}
      {marqueeImages.length > 0 && (
        <div className="pointer-events-auto absolute inset-0 z-0 opacity-100">
          <ThreeDMarquee images={marqueeImages} cols={4} className="h-full" />
        </div>
      )}

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
        </div>
      </div>
    </section>
  );
};
