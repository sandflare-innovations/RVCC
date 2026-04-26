"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import React, { useRef } from "react";

import { useTheme } from "@/context/ThemeContext";

const FinalLogo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Logo rises from 200px below to its center position as we scroll to the bottom
  const logoY = useTransform(scrollYProgress, [0, 1], [300, 150]);
  const logoScale = useTransform(scrollYProgress, [0, 1], [0.8, 1.5]);

  return (
    <section
      ref={containerRef}
      className="bg-theme-bg relative z-0 -mt-50 h-screen w-full overflow-hidden"
    >
      {/* Background Landscape */}
      <div className="absolute inset-0">
        <Image
          src="/images/other/sand.png"
          alt="Desert Landscape"
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
        {/* Subtle Overlay to make logo pop if needed */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Rising Logo */}
      <div className="relative flex h-full w-full items-start justify-center pt-24 md:pt-32">
        <motion.div
          style={{
            y: logoY,
            scale: logoScale,
          }}
          className="relative aspect-video w-72 md:w-[450px]"
        >
          <Image
            src="/images/logo/logo.png"
            alt="RVCC Logo"
            fill
            sizes="(max-width: 768px) 288px, 450px"
            className="object-contain opacity-100"
            style={{
              filter:
                theme === "dark"
                  ? "brightness(0) saturate(100%) invert(33%) sepia(69%) saturate(2541%) hue-rotate(184deg) brightness(96%) contrast(106%)"
                  : "brightness(0) invert(1)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default FinalLogo;
