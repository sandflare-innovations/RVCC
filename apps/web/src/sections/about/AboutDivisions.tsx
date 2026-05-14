"use client";

import React from "react";

import { motion } from "framer-motion";
import {
  FaBolt,
  FaBuilding,
  FaCompass,
  FaIndustry,
  FaScrewdriverWrench,
  FaWater,
} from "react-icons/fa6";

const DIVISIONS = [
  {
    title: "Civil Contracting",
    description:
      "High-end architectural execution including structural works, GRP cladding, and turnkey construction for residential and commercial landmarks.",
    icon: FaBuilding,
  },
  {
    title: "MEP Contracting",
    description:
      "Comprehensive mechanical, electrical, and plumbing solutions including HVAC, fire protection, and low current BMS automation.",
    icon: FaBolt,
  },
  {
    title: "Steel & Metal Division",
    description:
      "Precision fabrication of structural steel, ornamental metal works, PEB building systems, and iconic urban shading structures.",
    icon: FaIndustry,
  },
  {
    title: "Interior & Fit-out",
    description:
      "Expert interior fit-out and finishing services that transform spaces with modern aesthetics and technical functionality.",
    icon: FaCompass,
  },
  {
    title: "Landscaping & Water Features",
    description:
      "Enhancing the public realm with distinguished civil landscaping, specialized water features, and sustainable urban developments.",
    icon: FaWater,
  },
  {
    title: "Facility Management",
    description:
      "Professional operations and maintenance services ensuring the long-term integrity and performance of high-value infrastructures.",
    icon: FaScrewdriverWrench,
  },
];

export const AboutDivisions = () => {
  return (
    <section className="bg-transparent py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mb-20 text-center">
          <h2 className="font-heading text-4xl tracking-tight uppercase md:text-5xl">
            Our Business <span className="text-brand-blue serif">Divisions</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-light text-zinc-500">
            Integrated expertise across the construction spectrum, delivering comprehensive
            solutions with engineering precision.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-zinc-100 lg:grid-cols-3">
          {DIVISIONS.map((division, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group hover:shadow-brand-blue/10 relative bg-white p-12 transition-all hover:z-10 hover:shadow-2xl"
            >
              <div className="text-brand-blue group-hover:bg-brand-blue mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 transition-colors group-hover:text-white">
                <division.icon size={32} />
              </div>
              <h4 className="font-heading group-hover:text-brand-blue mb-4 text-2xl text-zinc-900 uppercase transition-colors">
                {division.title}
              </h4>
              <p className="text-sm leading-relaxed font-light text-zinc-500">
                {division.description}
              </p>

              {/* Minimalist corner accent */}
              <div className="absolute top-0 right-0 h-12 w-12 overflow-hidden">
                <div className="group-hover:bg-brand-blue/5 absolute top-[-25px] right-[-25px] h-12 w-12 rotate-45 bg-zinc-50 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
