"use client";

import React from "react";

import { motion } from "framer-motion";
import { FaGlobe, FaHelmetSafety, FaLeaf, FaShieldHalved } from "react-icons/fa6";

export const AboutSafetySustainability = () => {
  return (
    <section className="bg-transparent py-24 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="mb-20 text-center">
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Responsibility
          </span>
          <h3 className="font-heading text-6xl tracking-tighter text-zinc-900 uppercase">
            Safety & <span className="text-brand-blue serif">Sustainability</span>
          </h3>
          <p className="mx-auto mt-4 max-w-2xl font-light text-zinc-500">
            Embedding energy-efficient and environmentally responsible construction practices across
            all operations.
          </p>
        </div>
        <div className="flex flex-col gap-16 lg:flex-row">
          {/* Safety Block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-brand-blue/20 flex flex-1 flex-col border-l bg-white p-12"
          >
            <div className="text-brand-blue mb-8">
              <FaShieldHalved size={48} />
            </div>
            <h4 className="font-heading mb-6 text-3xl text-zinc-900 uppercase">
              Quality & <span className="text-brand-blue serif">HSE Excellence</span>
            </h4>
            <p className="mb-8 text-lg leading-relaxed font-light text-zinc-500">
              We maintain a steadfast commitment to quality and HSE excellence in alignment with ISO
              standards and international best practices, ensuring consistent delivery at the
              highest level.
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {["ISO Compliance", "Zero-Accident Goal", "Site Inspections", "Safety Training"].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                    <div className="bg-brand-blue h-1 w-1 rounded-full" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </motion.div>

          {/* Sustainability Block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-1 flex-col border-l border-zinc-100 bg-white p-12"
          >
            <div className="text-brand-blue mb-8">
              <FaGlobe size={48} />
            </div>
            <h4 className="font-heading mb-6 text-3xl text-zinc-900 uppercase">
              Sustainable <span className="text-brand-blue serif">Progress</span>
            </h4>
            <p className="mb-8 text-lg leading-relaxed font-light text-zinc-500">
              We embed energy-efficient and environmentally responsible construction practices
              across all operations, supporting iconic national programs and sustainable urban
              development.
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Energy Efficiency",
                "Waste Management",
                "Green Building",
                "Responsible Sourcing",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                  <div className="h-1 w-1 rounded-full bg-zinc-300" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
