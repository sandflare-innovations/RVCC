"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaAward, FaShieldHalved, FaCircleCheck } from "react-icons/fa6";

const CERTS = [
  {
    title: "ISO 9001:2018",
    subtitle: "Quality Management System",
    description: "Certified for excellence in general contracting and infrastructure development standards.",
    icon: FaAward,
  },
  {
    title: "Pre-Qualified",
    subtitle: "Strategic National Entities",
    description: "Approved by major national entities including ARAMCO, RCRC, SEC, and PIF subsidiaries.",
    icon: FaShieldHalved,
  },
  {
    title: "Classified: 01",
    subtitle: "First-Class Status",
    description: "Officially classified as a First-Class general contracting company with proven excellence.",
    icon: FaCircleCheck,
  },
];

export const AboutCertifications = () => {
  return (
    <section className="bg-zinc-900 py-24 text-white lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-4xl uppercase tracking-tight md:text-5xl">
            Certifications & <span className="text-brand-blue serif">Credentials</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400 font-light">
            Our commitment to quality is backed by international certifications and local government approvals, ensuring every project meets the highest industry benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {CERTS.map((cert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative border border-white/10 bg-white/5 p-10 transition-all hover:bg-white/10"
            >
              <cert.icon className="text-brand-blue mb-8" size={48} />
              <h4 className="font-heading text-2xl uppercase mb-2">{cert.title}</h4>
              <p className="text-brand-blue text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                {cert.subtitle}
              </p>
              <p className="text-sm font-light leading-relaxed text-zinc-400">
                {cert.description}
              </p>
              
              {/* Technical detail */}
              <div className="absolute bottom-4 right-4 text-[8px] font-bold tracking-[0.3em] text-white/10 uppercase">
                Verified Compliance
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
