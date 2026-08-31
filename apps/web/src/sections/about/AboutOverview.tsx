"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const IMAGES = [
  "/images/projects/1.webp",
  "/images/projects/2.webp",
  "/images/projects/3.webp",
  "/images/projects/4.webp",
];

export const AboutOverview = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:pt-32">
      <div className="container mx-auto px-6">
        {/* TOP: Refined Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-brand-blue mb-6 block text-[10px] font-bold tracking-[0.8em] uppercase">
              Company Profile
            </span>
            <h3 className="font-heading mx-auto max-w-4xl text-6xl leading-[0.6] tracking-tighter text-zinc-900 lg:text-[8rem]">
              The Art of <br />
              <span className="serif text-brand-blue normal-case">Structural Perfection.</span>
            </h3>
          </motion.div>
        </div>

        {/* MIDDLE: Immersive Gallery Image Slider */}
        <div className="relative mb-16 aspect-[21/9] w-full overflow-hidden bg-zinc-100 shadow-2xl">
          {IMAGES.map((img, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{ opacity: index === currentIndex ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={img}
                alt={`RVCC Luxury Architecture ${index + 1}`}
                fill
                className="object-cover brightness-95"
                priority={index === 0}
              />
            </motion.div>
          ))}

          {/* Subtle Decorative Frame & Progress Indicator */}
          <div className="pointer-events-none absolute inset-8 border border-white/20" />
          <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-3">
            {IMAGES.map((_, i) => (
              <div
                key={i}
                className={`h-[2px] w-8 transition-all duration-700 ${
                  i === currentIndex ? "w-12 bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM: Minimalist Content Grid */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Narrative Column */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="space-y-8 text-xl leading-relaxed font-light text-zinc-500"
            >
              <p>
                Riyadh Villas Contracting Company (RVCC) stands as a beacon of refined engineering
                and timeless structural design. For nearly two decades, we have been the quiet force
                behind the Kingdom's most prestigious developments.
              </p>
              <p className="text-lg opacity-80">
                Our philosophy is simple: perfection is not when there is nothing more to add, but
                when there is nothing left to take away. We bring this minimalist precision to every
                civil, structural, and engineering challenge we undertake.
              </p>
            </motion.div>
          </div>

          {/* Metrics & Accreditation Column */}
          <div className="flex flex-col justify-between border-l border-zinc-100 pl-12 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="space-y-12"
            >
              <div>
                <span className="text-brand-blue mb-2 block text-5xl font-bold">Class A</span>
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  Ministry Accredited Excellence
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div>
                  <span className="block text-3xl font-light text-zinc-900">150+</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Deliveries
                  </span>
                </div>
                <div>
                  <span className="block text-3xl font-light text-zinc-900">20+</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Years
                  </span>
                </div>
              </div>

              {/* Signature Line */}
              <div className="bg-brand-blue h-[1px] w-12" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
