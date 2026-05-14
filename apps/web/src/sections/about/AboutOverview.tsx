"use client";

import React from "react";

import Image from "next/image";

import { motion } from "framer-motion";

export const AboutOverview = () => {
  return (
    <section className="bg-transparent py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          {/* Left Side: Content */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-heading mb-8 text-4xl leading-tight text-zinc-900 uppercase md:text-5xl">
                Where Ideas Are <span className="text-brand-blue serif">Shaped to Reality</span>
              </h2>
              <div className="space-y-6 text-lg leading-relaxed font-light text-zinc-500">
                <p>
                  Founded in 2006, Riyadh Villas Contracting Company (RVCC) has established itself
                  as a leading General Contracting Company in Saudi Arabia. We are your trusted
                  partner for turnkey solutions, specializing in high-end civil construction,
                  residential masterpieces, and large-scale infrastructure developments.
                </p>
                <p>
                  Our journey is defined by a class-A certification and a distinguished record of
                  executing fast-track, high-value projects for leading government and private
                  sector clients. With 18 years of proven excellence, we combine engineering
                  precision with financial operational resilience.
                </p>
                <p className="border-brand-blue border-l-2 pl-6 italic">
                  "At RVCC, we transform ideas into architectural landmarks that stand the test of
                  time, ensuring quality, safety, and innovation in every project."
                </p>
              </div>

              <div className="mt-12 flex flex-wrap gap-8">
                <div>
                  <span className="text-brand-blue block text-3xl font-bold">18+</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Years of Excellence
                  </span>
                </div>
                <div>
                  <span className="text-brand-blue block text-3xl font-bold">Class A</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Certified Status
                  </span>
                </div>
                <div>
                  <span className="text-brand-blue block text-3xl font-bold">ISO</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    9001:2018 Certified
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] w-full overflow-hidden lg:h-[600px] lg:w-1/2"
          >
            <Image
              src="/images/projects/1.png"
              alt="RVCC Construction Site in Riyadh"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            {/* Subtle Overlay */}
            <div className="bg-brand-blue/5 pointer-events-none absolute inset-0" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
