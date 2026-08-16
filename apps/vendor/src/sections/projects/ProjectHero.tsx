"use client";

import { motion } from "framer-motion";

import { LogoMarquee } from "@/components/common/LogoMarquee";
import { AngledSlider } from "@/components/ui/angled-slider";
import { PROJECTS } from "@/data/projects/detailed";

import { cn } from "@/lib/utils";

export const ProjectHero = () => {
  const sliderItems = PROJECTS.map((p) => ({
    id: p.id,
    url: p.image,
    alt: p.title,
    title: p.title,
  }));

  return (
    <section
      className={cn(
        "bg-brand-blue relative flex h-screen w-full items-center justify-center overflow-hidden"
      )}
    >
      <div className="relative w-full py-20">
        {/* Monumental Background Text */}
        <div className="relative z-0 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none"
          >
            <h1 className="text-background/15 font-heading text-9xl leading-[0.8] font-black uppercase select-none md:text-[24rem]">
              PROJECTS
            </h1>
          </motion.div>
        </div>

        {/* Dynamic 3D Slider Section - Layered on Top and Centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-1/2 left-1/2 z-10 w-full -translate-x-1/2 -translate-y-1/2"
        >
          <AngledSlider
            items={sliderItems}
            speed={25}
            containerHeight="500px"
            cardWidth="400px"
            angle={60}
            className="bg-transparent"
          />
        </motion.div>
      </div>

      {/* Decorative background element */}
      <div className="bg-brand-blue/5 pointer-events-none absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 blur-[120px]" />

      {/* Client Logos - Bottom Center */}
      <LogoMarquee />
    </section>
  );
};
