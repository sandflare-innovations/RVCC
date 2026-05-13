"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaClipboardList, FaPenNib, FaHelmetSafety, FaCircleCheck } from "react-icons/fa6";

const STEPS = [
  {
    title: "Planning",
    description: "Deep analysis of project requirements, feasibility studies, and strategic resource allocation.",
    icon: FaClipboardList,
  },
  {
    title: "Design",
    description: "Collaborative architectural and engineering design focused on precision and structural integrity.",
    icon: FaPenNib,
  },
  {
    title: "Execution",
    description: "On-site construction managed by expert engineers using modern technology and safety standards.",
    icon: FaHelmetSafety,
  },
  {
    title: "Delivery",
    description: "Rigorous quality checks and final handover ensuring complete client satisfaction and compliance.",
    icon: FaCircleCheck,
  },
];

export const AboutProcess = () => {
  return (
    <section className="bg-zinc-50 py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mb-20 text-center">
          <h2 className="font-heading text-4xl uppercase tracking-tight md:text-5xl">
            Our Work <span className="text-brand-blue serif">Process</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500 font-light">
            A systematic approach to construction that ensures every project is delivered on time, within budget, and to the highest quality standards.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Horizontal on Desktop) */}
          <div className="absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 bg-zinc-200 lg:block" />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon Container */}
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white border border-zinc-100 text-brand-blue shadow-sm transition-all duration-300 group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand-blue/20">
                  <step.icon size={36} />
                </div>
                
                {/* Step Number */}
                <span className="mb-4 text-[10px] font-bold tracking-[0.4em] text-zinc-300 uppercase">
                  Step 0{i + 1}
                </span>
                
                <h4 className="font-heading mb-4 text-2xl uppercase text-zinc-900">{step.title}</h4>
                <p className="text-sm font-light leading-relaxed text-zinc-500 max-w-[240px]">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
