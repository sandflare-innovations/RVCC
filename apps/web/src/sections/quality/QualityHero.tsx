"use client";

import React from "react";
import { motion } from "framer-motion";

export const QualityHero = () => {
  return (
    <section className="relative flex h-screen items-center overflow-hidden bg-white border-b border-zinc-100">
      {/* Uniform Blueprint Grid */}
      <div className="absolute inset-0 z-0" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', 
             backgroundSize: '60px 60px' 
           }} />
      
      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-heading mb-0 text-6xl leading-[0.85] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-9xl">
                Quality <br />
                <span className="text-brand-blue serif">Management</span>
              </h1>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md pb-6 border-l border-zinc-100 pl-10"
          >
            <div className="mb-6 flex items-baseline gap-2">
               <span className="text-3xl font-heading text-brand-blue leading-none">ISO 9001</span>
               <span className="text-[10px] font-black tracking-widest text-zinc-300 uppercase leading-none">:2008</span>
            </div>
            <p className="text-lg font-light leading-relaxed text-zinc-500">
              Architecting precision through rigorous standards and 
              continuous improvement in every project landscape.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
