"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@repo/ui";
import { Button } from "@/components/ui/Button";

const SERVICES_DATA = [
  {
    id: "civil",
    title: "Civil Construction",
    subtitle: "High-end villa construction and commercial developments.",
    image: "/images/home-hero.png",
  },
  {
    id: "landscaping",
    title: "Landscaping",
    subtitle: "Sustainable outdoor environments that harmonize with architecture.",
    image: "/images/hero-bg.png",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    subtitle: "Foundational systems and complex utility networks.",
    image: "/images/home-hero.png",
  },
  {
    id: "surveying",
    title: "Surveying",
    subtitle: "State-of-the-art instruments for absolute measurement accuracy.",
    image: "/images/hero-bg.png",
  },
];

export const Services = () => {
  const [activeId, setActiveId] = useState(SERVICES_DATA[0].id);

  const activeService = SERVICES_DATA.find(s => s.id === activeId) || SERVICES_DATA[0];

  return (
    <section className="bg-gray-100 relative w-full px-8 py-12  md:px-16 md:py-30 lg:px-24" id="services">
      <div className="mx-auto flex h-full max-w-[100rem] items-center">
        <div className="grid h-full w-full grid-cols-1 gap-1 md:grid-cols-12 md:gap-2">
          {/* Left Column: Service Items */}
          <div className="flex h-full flex-col md:col-span-7 gap-2">
            {SERVICES_DATA.map((service) => {
              const isActive = activeId === service.id;

              return (
                <div
                  key={service.id}
                  onMouseEnter={() => setActiveId(service.id)}
                  className={`group relative flex flex-1 cursor-pointer flex-col justify-center border-b border-black/5 rounded-xl p-8 transition-all duration-500 md:p-6 ${isActive ? "bg-brand-blue" : "bg-white"
                    }`}
                >
                  <div className="flex flex-col items-start justify-between">
                    <h3 className={`text-2xl font-bold uppercase transition-colors duration-500 text-end w-full md:text-5xl ${isActive ? "text-white" : "text-brand-blue"
                      }`}>
                      {service.title}
                    </h3>
                    <div className="w-full flex justify-between gap-2 md:gap-4 items-end">

                      <p className={`max-w-lg text-[10px] leading-relaxed transition-colors duration-500 md:text-xl ${isActive ? "text-white/70" : "text-brand-blue/50"
                        }`}>
                        {service.subtitle}
                      </p>
                      <Icons.ArrowRight className={`h-16 w-16 -rotate-45 transition-all duration-500 md:h-16 md:w-16 mt-2 ${isActive ? "text-white translate-x-1 -translate-y-1" : "text-brand-blue/30"
                        }`} />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Featured Image */}
          <div className="relative h-64 overflow-hidden md:col-span-5 md:h-full rounded-xl">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="relative h-full w-full bg-zinc-200"
            >
              <Image
                src={activeService.image}
                alt={activeService.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </motion.div>

            {/* Architectural Info Overlay */}
            <div className="absolute right-12 bottom-12 z-20 text-right">
              <div className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">Featured Capability</div>
              <div className="text-xl font-bold text-white uppercase">{activeService.title}</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
