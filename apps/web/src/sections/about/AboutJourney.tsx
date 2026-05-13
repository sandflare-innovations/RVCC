"use client";

import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { FaBuilding, FaAward, FaRocket, FaGlobe, FaCircleCheck } from "react-icons/fa6";

const MILESTONES = [
  {
    year: "2006",
    title: "Foundation",
    description: "Established in Riyadh. Launched initial Residential & Commercial projects. Secured 100% Foreign Investment status under SAGIA.",
    icon: FaBuilding,
    align: "left"
  },
  {
    year: "2016",
    title: "Excellence",
    description: "Achieved prestigious Class A License. Recognized as a Top-tier Saudi Contractor.",
    icon: FaAward,
    align: "right"
  },
  {
    year: "2023",
    title: "Evolution",
    description: "Major Corporate Identity Uplift and Rebranding project to align with global architectural standards.",
    icon: FaRocket,
    align: "left"
  },
  {
    year: "2030",
    title: "Vision",
    description: "Fully aligned with Saudi Vision 2030. Focusing on Smart Cities, Sustainable Growth, and Infrastructure.",
    icon: FaGlobe,
    align: "right"
  }
];

export const AboutJourney = () => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate if a milestone is "active" based on scroll progress
  const getActiveState = (index: number) => {
    const threshold = (index / (MILESTONES.length - 1));
    return useTransform(scrollYProgress, (latest) => latest >= threshold);
  };

  return (
    <section ref={containerRef} className="relative bg-white py-20 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase"
          >
            Evolution & Growth
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-4xl uppercase tracking-tight md:text-6xl"
          >
            Our Journey: <span className="text-brand-blue serif">Transformation</span>
          </motion.h2>
        </div>

        <div className="relative mx-auto max-w-5xl" ref={trackRef}>
          {/* Robust Vertical Track Background */}
          <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-zinc-100 lg:block hidden">
             <div className="h-full w-full bg-gradient-to-b from-transparent via-zinc-200 to-transparent opacity-50" />
          </div>
          
          {/* Animated Progress Track */}
          <motion.div 
            style={{ scaleY, originY: 0 }}
            className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-brand-blue lg:block hidden z-0 shadow-[0_0_15px_rgba(0,115,188,0.3)]"
          />

          <div className="space-y-16 lg:space-y-24 relative z-10">
            {MILESTONES.map((item, i) => (
              <div key={i} className="flex flex-col items-center lg:grid lg:grid-cols-[1fr_120px_1fr]">
                {/* Milestone Card (Left or Right based on align) */}
                <div className={`w-full ${item.align === 'right' ? 'lg:col-start-3' : 'lg:col-start-1 lg:text-right'}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  >
                    <div className="relative group border border-zinc-100 bg-white p-6 lg:p-8 transition-all duration-500 hover:border-brand-blue/30 hover:shadow-2xl hover:shadow-brand-blue/5">
                      <div className={`mb-4 flex items-center justify-between ${item.align === 'left' ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`flex flex-col ${item.align === 'left' ? 'lg:items-end' : ''}`}>
                          <span className="font-heading text-3xl text-zinc-900 md:text-4xl">{item.year}</span>
                          <div className="h-0.5 w-12 bg-zinc-100 transition-all group-hover:w-full group-hover:bg-brand-blue" />
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-zinc-50 text-brand-blue transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-brand-blue group-hover:text-white">
                          <item.icon size={24} />
                        </div>
                      </div>
                      <h4 className="font-heading mb-2 text-xl uppercase text-brand-blue/80 tracking-wide">{item.title}</h4>
                      <p className="text-sm font-light leading-relaxed text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Central Milestone Node (Always in center column) */}
                <div className="relative z-20 my-6 flex h-12 w-full items-center justify-center lg:col-start-2 lg:my-0">
                   <div className="h-10 w-10 rounded-full border border-zinc-100 bg-white shadow-sm flex items-center justify-center">
                     <motion.div 
                      initial={{ scale: 0, rotate: 45 }}
                      whileInView={{ scale: 1, rotate: 45 }}
                      viewport={{ once: true }}
                      className="relative z-10 h-3 w-3 bg-zinc-200"
                     >
                       <motion.div 
                          className="absolute inset-0 bg-brand-blue shadow-[0_0_15px_rgba(0,115,188,0.8)]"
                          style={{ 
                            opacity: useTransform(scrollYProgress, (v) => v >= (i / (MILESTONES.length - 1)) ? 1 : 0)
                          }}
                       />
                     </motion.div>
                   </div>
                </div>

                {/* Empty spacer for the other side */}
                <div className="hidden lg:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Certifications */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 border-t border-zinc-100 pt-12"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              {[
                "ISO 9001:2018 Certified Excellence",
                "ISO 14001:2015 Environmental Standards",
                "Strong & Trusted Client Partnerships"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-900">
                  <FaCircleCheck className="text-brand-blue/60" size={16} />
                  <span className="text-sm font-medium tracking-tight">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {["SAGIA (Ministry of Investment)", "Class A Contractor Badge", "UAF / IAF Accreditation"].map((tag, i) => (
                <span key={i} className="bg-zinc-50 px-4 py-2 text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase border border-zinc-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
