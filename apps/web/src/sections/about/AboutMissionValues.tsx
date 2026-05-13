"use client";

import React from "react";

import { motion } from "framer-motion";
import {
  FaAward,
  FaBolt,
  FaBullseye,
  FaEye,
  FaFlag,
  FaHandshake,
  FaHeart,
  FaIndustry,
  FaLeaf,
  FaLightbulb,
  FaRankingStar,
  FaShieldHalved,
  FaTreeCity,
  FaUsers,
} from "react-icons/fa6";

export const AboutMissionValues = () => {
  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-40">
      {/* Decorative Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#0073BC 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 container mx-auto px-6">
        {/* Mission & Vision Row */}
        <div className="mb-40 flex flex-col gap-12 lg:flex-row">
          {/* Vision Card - The "Luminous Slab" */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-1 flex-col"
          >
            <div className="absolute -inset-4 -z-10 border border-zinc-100 bg-zinc-50 transition-colors duration-700 group-hover:bg-zinc-100/50" />
            <div className="border-brand-blue relative flex h-full flex-col overflow-hidden border-l-4 bg-white p-10 shadow-[0_20px_50px_rgba(0,115,188,0.05)] lg:p-16">
              <div className="text-brand-blue/5 pointer-events-none absolute -top-12 -right-12 rotate-12 select-none">
                <FaEye size={400} />
              </div>

              <div className="relative z-10 mb-10 flex items-center gap-4">
                <div className="bg-brand-blue h-[2px] w-8" />
                <h3 className="font-heading text-3xl tracking-widest text-zinc-900 uppercase">
                  Our <span className="text-brand-blue serif">Vision</span>
                </h3>
              </div>

              <p className="relative z-10 flex-grow text-xl leading-relaxed font-light text-zinc-600">
                At RVCC, we are committed to partnership, transparency, and reliability. Leveraging
                our proven expertise across the construction industry, we build lasting client trust
                and support sustainable growth. Our past achievements continue to shape a confident,
                promising future.
              </p>

              <div className="relative z-10 mt-12 flex gap-4">
                {["Integrity", "Reliability", "Sustainability"].map((tag) => (
                  <span
                    key={tag}
                    className="text-brand-blue/60 border-brand-blue/10 bg-brand-blue/5 border px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mission Card - The "Solid Pillar" */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group relative flex flex-1 flex-col"
          >
            <div className="bg-brand-blue/5 border-brand-blue/10 absolute -inset-4 -z-10 border" />
            <div className="bg-brand-blue relative flex h-full flex-col overflow-hidden p-10 shadow-[0_20px_60px_rgba(0,115,188,0.2)] lg:p-16">
              <div className="pointer-events-none absolute -bottom-12 -left-12 -rotate-12 text-white/5 select-none">
                <FaBullseye size={400} />
              </div>

              <div className="relative z-10 mb-10 flex items-center gap-4">
                <h3 className="font-heading text-3xl tracking-widest text-white uppercase">
                  Our <span className="serif text-white/60">Mission</span>
                </h3>
                <div className="h-[2px] w-8 bg-white" />
              </div>

              <p className="relative z-10 flex-grow text-xl leading-relaxed font-light text-white/90">
                We maximize client value by delivering high-quality, timely, and cost-effective
                solutions. Backed by modern technology and years of industry expertise, we excel in
                both new developments and renovation projects.
              </p>

              <div className="relative z-10 mt-12 flex gap-4">
                {["Technology", "Expertise", "Flexibility"].map((tag) => (
                  <span
                    key={tag}
                    className="border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-white/60 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Core Values / Strengths Heading */}
        <div className="mb-20 text-center">
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Our Excellence
          </span>
          <h3 className="font-heading text-5xl tracking-tighter text-zinc-900 uppercase">
            Core <span className="text-brand-blue serif">Strengths</span>
          </h3>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FaShieldHalved,
              title: "Classified",
              desc: "A Class A certified contracting company with over 18 years of proven excellence in Saudi Arabia, strengthened by extensive international project exposure.",
            },
            {
              icon: FaBolt,
              title: "Capable & Financially Strong",
              desc: "Trusted partner with a robust financial foundation audited by KPMG. Our multi-disciplinary capabilities and operational resilience guarantee the success of every project.",
            },
            {
              icon: FaLightbulb,
              title: "Quality Driven",
              desc: "Steadfast commitment to quality and HSE excellence in alignment with ISO standards and international best practices, ensuring consistent delivery at the highest level.",
            },
            {
              icon: FaUsers,
              title: "Well-Resourced",
              desc: "Dedicated PMO supported by experienced project managers, skilled technical teams, and specialized engineers capable of delivering complex large-scale developments.",
            },
            {
              icon: FaHandshake,
              title: "Trusted",
              desc: "Distinguished record of executing fast-track and high-value projects for leading government and private sector clients, reinforcing our reputation for reliability.",
            },
            {
              icon: FaAward,
              title: "Recognized",
              desc: "Pre-qualified with major national entities including ARAMCO, RCRC, SEC, and PIF subsidiaries, reflecting our proven capability and industry leadership.",
            },
          ].map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col p-1"
            >
              <div className="group-hover:bg-brand-blue/5 group-hover:border-brand-blue/10 absolute inset-0 -z-10 border border-zinc-100 bg-zinc-50 transition-all duration-500" />
              <div className="group-hover:bg-brand-blue flex h-full flex-col border border-zinc-100 bg-white p-8 transition-all duration-500 group-hover:border-transparent group-hover:shadow-[0_20px_40px_rgba(0,115,188,0.2)]">
                <div className="text-brand-blue mb-6 transition-colors duration-500 group-hover:text-white">
                  <val.icon size={28} />
                </div>
                <h4 className="font-heading mb-3 text-lg leading-tight tracking-wider text-zinc-900 uppercase transition-colors duration-500 group-hover:text-white">
                  {val.title}
                </h4>
                <p className="flex-grow text-sm leading-relaxed font-light text-zinc-500 transition-colors duration-500 group-hover:text-white/80">
                  {val.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Strategic Pillars Section */}
        <div className="mt-40 border-t border-zinc-100 pt-24">
          <div className="mb-20 text-center">
            <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
              National Alignment
            </span>
            <h3 className="font-heading text-4xl tracking-tighter text-zinc-900 uppercase">
              Strategic <span className="text-brand-blue serif">Pillars</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                icon: FaIndustry,
                title: "Industrial Advancement",
                desc: "Promoting local manufacturing through state of the art steel and metal fabrication.",
              },
              {
                num: "02",
                icon: FaTreeCity,
                title: "Urban Excellence",
                desc: "Enhancing the public realm with distinguished civil, MEP, and landscaping aligned with Green Riyadh.",
              },
              {
                num: "03",
                icon: FaFlag,
                title: "National Development",
                desc: "Supporting iconic national programs including Red Sea and major Riyadh infrastructure.",
              },
              {
                num: "04",
                icon: FaFlag,
                title: "Sustainable Progress",
                desc: "Embedding energy-efficient, environmentally responsible construction practices across all operations.",
              },
            ].map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex flex-col items-center p-4 text-center transition-all duration-700"
              >
                {/* Background Layer */}
                <div className="group-hover:bg-brand-blue/5 absolute inset-0 -z-10 bg-transparent transition-all duration-700" />

                {/* Content Box (Becomes blue on hover) */}
                <div className="group-hover:bg-brand-blue flex w-full flex-col items-center p-8 transition-all duration-700">
                  <div className="relative mb-8">
                    <div className="bg-brand-blue/5 text-brand-blue group-hover:text-brand-blue flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 group-hover:bg-white">
                      <pillar.icon size={32} />
                    </div>
                    <span className="text-brand-blue group-hover:text-brand-blue absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-white text-[10px] font-bold shadow-sm transition-colors group-hover:bg-zinc-100">
                      {pillar.num}
                    </span>
                  </div>
                  <h4 className="font-heading mb-4 px-4 text-lg leading-tight tracking-wider text-zinc-900 uppercase transition-colors duration-500 group-hover:text-white">
                    {pillar.title}
                  </h4>
                  <p className="text-sm leading-relaxed font-light text-zinc-500 transition-colors duration-500 group-hover:text-white/80">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
