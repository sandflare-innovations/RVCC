"use client";

import { cn } from "@lib/utils";
import { motion } from "framer-motion";

import { LogoMarquee } from "@/components/common/LogoMarquee";
import { AngledSlider } from "@/components/ui/angled-slider";
import type { DetailedProject } from "@/data/projects/detailed";

export const ProjectHero = ({ initialProjects }: { initialProjects?: DetailedProject[] }) => {
  const sliderItems = (initialProjects || []).map((p) => ({
    id: String(p.id),
    url: p.image || p.coverImage || "",
    alt: p.title,
    title: p.title,
  })).filter((item) => Boolean(item.url));

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

        {/* Dynamic Project Slider Cards */}
        {sliderItems.length > 0 && (
          <div className="relative z-10 mx-auto -mt-36 max-w-[120vw] px-4 md:-mt-64">
            <AngledSlider items={sliderItems} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 z-20 w-full">
        <LogoMarquee />
      </div>
    </section>
  );
};
