"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiShield, FiTarget, FiHeart, FiCheckCircle } from "react-icons/fi";

export const QualityContent = () => {
  const qualityObjectives = [
    { title: "Standardization", desc: "Continuously upgrade and maintain quality standards in Project Management and Consultancy Service." },
    { title: "Expectation", desc: "Sustain customer satisfaction by meeting customer expectations and proactively attending to the implied ones." },
    { title: "Leadership", desc: "Retain the platform of leadership by delivering projects on time & within budget without compromising quality." },
    { title: "Improvement", desc: "Continually improve our system by enriching employees with an effective human resource Development system." }
  ];

  const hsePrinciples = [
    "Listening to the views and feedback of our clients.",
    "Meeting expectations with reliable and quality products and services.",
    "Complying with ISO 14001:2004 and OHSAS 18001:2007 requirements.",
    "Provide safe workplace by preventing accidents and occupational ill health.",
    "Encourage HSE considerations into business planning and decisions.",
    "Promoting a workplace with properly trained and compliant employees."
  ];

  const gridStyle = {
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
    backgroundSize: '60px 60px'
  };

  return (
    <div className="bg-white">
      {/* 1. Quality Objectives - Clean Blueprint Grid */}
      <section className="relative py-32 overflow-hidden border-b border-zinc-100">
        <div className="absolute inset-0 z-0 opacity-[0.02]" style={gridStyle} />

        <div className="container relative z-10 mx-auto px-6">
          <div className="mb-20">
            <h2 className="font-heading text-5xl tracking-tight text-zinc-900 uppercase md:text-7xl">Quality Objectives</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 border border-zinc-100">
            {qualityObjectives.map((obj, i) => (
              <div key={i} className="group relative bg-white p-12 transition-all duration-700 hover:bg-zinc-50">
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-brand-blue font-heading text-3xl opacity-20">0{i + 1}</span>
                  <FiTarget className="text-zinc-100 group-hover:text-brand-blue/30 transition-all duration-500" />
                </div>
                <h3 className="mb-6 text-2xl font-bold text-zinc-900 uppercase leading-none">{obj.title}</h3>
                <p className="text-lg font-light leading-relaxed text-zinc-500">{obj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Safety Philosophy - Simplified Dark Section */}
      <section className="relative bg-zinc-950 py-40 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="container relative z-10 mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="lg:w-1/2">
              <h2 className="font-heading text-6xl tracking-tighter uppercase md:text-8xl mb-12 text-brand-blue">Zero Harm</h2>
              <div className="p-10 border border-white/5 bg-white/[0.01] backdrop-blur-md">
                <p className="text-3xl font-light leading-relaxed text-zinc-400">
                  "The Condition of Being Safe from Undergoing or Causing Hurt, Injury, or Loss."
                </p>
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="border-l border-white/10 pl-10">
                <p className="text-xl text-zinc-500 font-light leading-relaxed">
                  RVCC is proud to hold a safety measure program wing to ensure every project is accomplished with maximum safety.
                  Our record is attributed to the commitment of all employees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HSE Principles - Clean Matrix */}
      <section className="relative py-32 bg-white overflow-hidden border-t border-zinc-100">
        <div className="absolute inset-0 z-0 opacity-[0.02]" style={gridStyle} />

        <div className="container relative z-10 mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-5">
              <h2 className="font-heading text-5xl tracking-tighter leading-[0.6] uppercase mb-8">HSE <br /> <span className="text-brand-blue">Principles</span></h2>
              <p className="text-xl text-zinc-500 font-light leading-relaxed">
                Adhering to global Health, Safety & Environment Management Systems.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-zinc-100">
                {hsePrinciples.map((principle, i) => (
                  <div key={i} className="border-r border-b border-zinc-100 p-10 hover:bg-zinc-50 transition-colors">
                    <span className="text-brand-blue font-heading text-xl opacity-20 block mb-4">0{i + 1}</span>
                    <p className="text-lg text-zinc-600 font-medium leading-relaxed">{principle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ISO Seal */}
      <section className="py-20 border-t border-zinc-100 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="flex flex-col gap-2">
              <span className="text-7xl font-heading text-zinc-200 leading-none">ISO</span>
              <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.4em]">Certified Company</span>
            </div>

            <div className="flex flex-wrap justify-center gap-10">
              {["9001:2008", "14001:2004", "18001:2007"].map((std, i) => (
                <div key={i} className="flex flex-col items-center border-l border-zinc-200 pl-8">
                  <span className="text-xl font-bold text-zinc-900">{std}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
