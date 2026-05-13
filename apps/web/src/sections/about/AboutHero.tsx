"use client";

import React from "react";

import { motion } from "framer-motion";

import { ThreeDCanvas } from "@ui/ThreeDCanvas";

export const AboutHero = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden border-b border-zinc-100 bg-white pt-32 lg:pt-0">
      {/* Uniform Blueprint Grid Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,115,188,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,115,188,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:gap-24">
          {/* Left Content Column */}
          <div className="flex w-full flex-col gap-12 lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
                First-Class Classified
              </span>
              <h1 className="font-heading mb-0 text-6xl leading-[0.8] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-9xl">
                Legacy of <br />
                <span className="text-brand-blue serif">Excellence</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md border-l border-zinc-100 pb-6 pl-6"
            >
              <div className="mb-6 flex items-baseline gap-2">
                <span className="font-heading text-brand-blue text-3xl leading-none">ISO 9001</span>
                <span className="text-[10px] leading-none font-black tracking-widest text-zinc-300 uppercase">
                  :2018
                </span>
              </div>
              <p className="text-lg leading-relaxed font-light text-zinc-500">
                A leading General Contracting Company in Saudi Arabia since 2006. 
                We transform ideas into enduring structures through precision engineering 
                and a steadfast commitment to quality and safety.
              </p>
            </motion.div>
          </div>

          {/* Right 3D Model Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="relative h-[400px] w-full lg:h-[600px] lg:w-1/2"
          >
            <ThreeDCanvas modelUrl="/3D-Objects/safty-helmet-3D.glb" />

            {/* Technical visual elements */}
            <div className="pointer-events-none absolute inset-0 scale-110 rounded-full border border-zinc-100/50 opacity-20" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2">
              <div className="border-brand-blue/30 absolute top-0 left-0 h-8 w-8 border-t border-l" />
              <div className="border-brand-blue/30 absolute right-0 bottom-0 h-8 w-8 border-r border-b" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
