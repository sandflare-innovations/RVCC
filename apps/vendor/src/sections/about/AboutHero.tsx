"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { Button } from "@/components/ui/Button";

const SkyscraperCanvas = dynamic(
  () => import("@/components/ui/SkyscraperCanvas").then((m) => m.SkyscraperCanvas),
  { ssr: false, loading: () => <div className="h-full w-full" aria-hidden /> }
);

export const AboutHero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const rotationY = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 1.5]);
  const rotationX = useTransform(scrollYProgress, [0, 1], [0, -Math.PI * 0.15]);
  const positionY = useTransform(scrollYProgress, [0, 1], [-500, -480]);
  const bgTextY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const smoothRotationY = useSpring(rotationY, { stiffness: 100, damping: 30 });
  const smoothRotationX = useSpring(rotationX, { stiffness: 100, damping: 30 });
  const smoothPositionY = useSpring(positionY, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-[100vh] items-start overflow-hidden pt-20"
    >
      <div className="from-background via-background/80 pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-48 bg-gradient-to-t to-transparent" />

      <motion.div
        style={{ y: bgTextY }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <h2 className="text-brand-blue mb-[52vh] text-[20vw] leading-none tracking-tighter uppercase opacity-10 select-none">
          ABOUT RVCC
        </h2>
      </motion.div>

      <div className="sticky top-0 z-10 container mx-auto flex h-screen items-center justify-center px-6">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <motion.div className="h-full w-full max-w-5xl" style={{ opacity }}>
            <SkyscraperCanvas
              rotationY={smoothRotationY}
              rotationX={smoothRotationX}
              positionY={smoothPositionY}
            />
          </motion.div>
        </div>

        <div className="pointer-events-none relative z-10 grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="pointer-events-auto z-20 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h1 className="font-heading mb-8 text-6xl leading-[0.6] tracking-tighter text-zinc-900 uppercase md:text-8xl">
                Shaping <br />
                <span className="text-brand-blue serif">The Future</span>
              </h1>

              <div className="shadow-brand-blue/5 max-w-[280px] border border-zinc-100 bg-white p-6 shadow-2xl">
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-brand-blue text-4xl font-bold">99%</span>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Client Satisfied
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-light text-zinc-500">
                  Turning your aspirations into achievable reality through precision engineering.
                </p>
                <div className="mt-6 flex gap-4">
                  <Button variant="primary" className="h-10 min-w-[120px] text-[8px]">
                    Contact Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4" />

          <div className="pointer-events-auto z-20 flex flex-col items-end text-right lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="max-w-xs"
            >
              <p className="mb-8 text-lg leading-relaxed font-light text-zinc-500">
                A sanctuary where ideas find harmony, and excellence is built into every brick and
                beam. RVCC is where the future feels at home.
              </p>

              <div className="border border-zinc-100 bg-zinc-50 p-6 text-left shadow-xl">
                <div className="mb-6 flex items-center gap-4">
                  <div className="bg-brand-blue flex h-12 w-12 items-center justify-center rounded-none font-bold text-white">
                    20+
                  </div>
                  <div>
                    <h4 className="text-[20px] text-zinc-900 uppercase">Years of Experience</h4>
                    <p className="text-[12px] text-zinc-400 uppercase">Class A Contractor</p>
                  </div>
                </div>
                <div className="mb-4 h-[2px] w-full bg-zinc-200" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-900 uppercase">ISO CERTIFIED</span>
                  <span className="text-brand-blue text-[10px] font-bold">9001:2018</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </section>
  );
};
