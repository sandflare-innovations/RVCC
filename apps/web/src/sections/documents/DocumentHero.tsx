"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export const DocumentHero = () => {

  return (
    <section className="relative flex h-screen items-center overflow-hidden border-b border-zinc-100 bg-white">
      {/* Uniform Blueprint Grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-1 items-center gap-12 pt-20 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          {/* Left: Content Section */}
          <div className="relative z-10 flex flex-col items-start pt-20 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-brand-blue mb-6 block text-[10px] font-black tracking-[0.5em] uppercase">
                Knowledge Repository
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-heading text-brand-blue text-6xl leading-[0.6] tracking-tighter text-zinc-900 uppercase md:text-8xl lg:text-[8rem] xl:text-[10rem]"
            >
              Documents{" "}
              <span className="text-brand-blue">
                {" "}
                <br /> & Resources
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 max-w-xl text-lg leading-relaxed font-medium text-zinc-500"
            >
              Access our comprehensive collection of company profiles, technical specifications, and
              regulatory standards. Designed for clarity, engineered for excellence.
            </motion.p>
          </div>

          <Link
            href="/documents/rvcc-general-profile"
            className="block w-full"
          >

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: -20 }}
              whileHover={{ scale: 1.05, rotateY: -10 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="perspective-3000 relative flex cursor-pointer items-center justify-center"
            >
              {/* The Book Container */}
              <div className="relative aspect-[3/4.2] w-full max-w-[280px] xl:max-w-[340px]">
                {/* Thick Stacked Pages Effect (Behind) */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute border border-zinc-200 bg-white"
                    style={{
                      inset: `${(i + 1) * 3}px ${-(i + 1) * 6}px ${(i + 1) * 3}px 0`,
                      zIndex: -(i + 1),
                      boxShadow: i === 2 ? "30px 30px 80px rgba(0,0,0,0.15)" : "none",
                    }}
                  />
                ))}

                {/* Main Book Body */}
                <div className="rotate-y-negative-10 absolute inset-0 z-10 origin-left overflow-hidden border border-zinc-200 bg-white shadow-[20px_20px_60px_rgba(0,0,0,0.1)] transition-transform duration-700 hover:rotate-y-0">
                  {/* Cover Image */}
                  <div className="absolute inset-2 overflow-hidden bg-zinc-50">
                    <Image
                      src="/images/books/company-profile.webp"
                      alt="RVCC General Profile"
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Overlay Lighting */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                  </div>

                  {/* Spine Details */}
                  <div className="absolute top-0 left-0 z-20 h-full w-8 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
                  <div className="absolute top-0 left-0 z-30 h-full w-[2px] bg-white/20" />
                </div>
              </div>

              {/* Decorative Ambient Light */}
              <div className="bg-brand-blue/10 absolute -top-20 -right-20 -z-20 h-[500px] w-[500px] rounded-full blur-[120px]" />
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Background Architectural Accent */}
      <div className="absolute top-0 right-0 -z-20 hidden h-full w-1/4 bg-zinc-50/50 lg:block" />
    </section>
  );
};
