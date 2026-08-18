"use client";

import React from "react";

import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";

import { Button } from "@/components/ui/Button";

export const AboutCTA = () => {
  return (
    <section className="relative overflow-hidden py-24 lg:py-24">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0 bg-[url('/images/projects/4.webp')] bg-cover bg-fixed bg-center" />
      <div className="absolute inset-0 z-10 bg-zinc-900/80 backdrop-blur-[2px]" />

      <div className="relative z-20 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl"
        >
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Collaboration
          </span>
          <h2 className="font-heading mb-8 text-6xl leading-[0.6em] tracking-tighter text-white uppercase">
            Let's Build Something <br />
            <span className="text-brand-blue serif text-6xl">Great Together</span>
          </h2>
          <p className="mb-12 text-xl leading-relaxed font-light text-zinc-300">
            Whether it's a residential masterpiece or a complex infrastructure project, RVCC has the
            expertise and dedication to bring your vision to life in Riyadh.
          </p>

          <Button
            href="/contact"
            variant="brand-outline"
            className="group h-16 min-w-[240px] border-white text-white hover:bg-white hover:text-zinc-900"
          >
            <span className="flex items-center gap-3 text-lg">
              Contact Us <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </span>
          </Button>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="via-brand-blue absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-50" />
    </section>
  );
};
