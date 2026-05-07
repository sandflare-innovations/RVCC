"use client";

import { motion } from "framer-motion";
import { cn } from "@lib/utils";
import { AngledSlider } from "@/components/ui/angled-slider";
import { PROJECTS } from "@/data/projects/detailed";
import { LogoMarquee } from "@/components/common/LogoMarquee";


export const ProjectHero = () => {
  const sliderItems = PROJECTS.map((p) => ({
    id: p.id,
    url: p.image,
    alt: p.title,
    title: p.title,
  }));

  return (
    <section className={cn("relative h-screen w-full bg-brand-blue overflow-hidden flex items-center justify-center")}>
      <div className="w-full relative py-20">
        {/* Monumental Background Text */}
        <div className="container mx-auto px-6 relative z-0 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none"
          >
            <h1 className="text-9xl font-black leading-[0.8] text-background/15 md:text-[24rem] uppercase font-heading select-none">
              PROJECTS
            </h1>
          </motion.div>
        </div>

        {/* Dynamic 3D Slider Section - Layered on Top and Centered */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full"
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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-brand-blue/5 blur-[120px] pointer-events-none" />
      
      {/* Client Logos - Bottom Center */}
      <LogoMarquee />
    </section>
  );
};
