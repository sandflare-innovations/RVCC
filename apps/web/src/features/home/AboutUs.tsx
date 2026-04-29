"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import {
  MotionValue,
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { useTheme } from "next-themes";

import { cn } from "@lib/utils";

const WORDS = [
  "WE",
  "DEVELOP",
  "CONTEMPORARY",
  "RESIDENCES",
  "WHERE",
  "ARCHITECTURE,",
  "LIGHT",
  "AND",
  "[img1]",
  "LANDSCAPE",
  "EXIST",
  "IN",
  "PERFECT",
  "[img2]",
  "BALANCE",
  "OUR",
  "FOCUS",
  "IS",
  "NOT",
  "JUST",
  "TO",
  "BUILD",
  "HOUSES",
  "—",
  "BUT",
  "TO",
  "CREATE",
  "SPACES",
  "THAT",
  "ELEVATE",
  "[img3]",
  "LIVING",
];

const STATS = [
  { value: 2006, label: "YEAR FOUNDED", suffix: "" },
  { value: 100, label: "COMPLETED PROJECTS", suffix: "+" },
  { value: 30, label: "ONGOING PROJECTS", suffix: "+" },
  { value: 15, label: "GOVERNMENT PROJECTS", suffix: "+" },
  { value: 100, label: "SATISFIED CLIENTS", suffix: "%" },
];

const CLIENT_IMAGES = Array.from({ length: 18 }, (_, i) => `/images/clients/${i + 1}.png`);

const Counter = ({
  from = 0,
  to,
  suffix = "+",
}: {
  from?: number;
  to: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest) + suffix);

  useEffect(() => {
    if (inView) {
      animate(count, to, {
        duration: 2.5,
        ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier easeOut
      });
    }
  }, [inView, count, to]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  );
};

const Word = ({
  children,
  progress,
  range,
  inactiveColor,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  inactiveColor: string;
}) => {
  const color = useTransform(progress, range, [inactiveColor, "#0073bc"]);

  return (
    <motion.span style={{ color }} className="mr-3 mb-3 inline-block">
      {children}
    </motion.span>
  );
};

export const AboutUs = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inactiveColor = mounted && resolvedTheme === "dark" ? "#ffffff" : "#000000";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 70%"],
  });

  return (
    <section className="bg-background relative z-10 mx-auto max-w-7xl py-30" id="about">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h2 className="text-brand-blue font-primary text-[8rem] leading-[0.8] font-normal tracking-tighter uppercase">
              about us
            </h2>
          </div>
        </div>

        {/* Scroll Reveal Text & Image */}
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div ref={containerRef} className="relative max-w-4xl flex-[1.5]">
            <h3 className="font-primary flex flex-wrap justify-start text-left text-4xl leading-snug font-medium tracking-tight">
              {WORDS.map((word, i) => {
                const start = i / WORDS.length;
                const end = start + 1 / WORDS.length;

                if (word.startsWith("[img")) {
                  return (
                    <span
                      key={i}
                      className="relative top-2 mx-3 mb-3 inline-block h-12 w-24 overflow-hidden rounded-none md:h-10 md:w-32"
                    >
                      <Image
                        src="/images/home-hero.png"
                        alt="Detail"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100px, 200px"
                      />
                    </span>
                  );
                }

                return (
                  <Word
                    key={i}
                    progress={scrollYProgress}
                    range={[start, end]}
                    inactiveColor={inactiveColor}
                  >
                    {word}
                  </Word>
                );
              })}
            </h3>
          </div>

          <div className="flex w-full flex-1 justify-end">
            <div className="relative aspect-[3.5/4] w-full max-w-md overflow-hidden rounded-none bg-gray-100">
              <Image
                src="/images/home-hero.png"
                alt="About RVCC"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-brand-blue mt-40 grid grid-cols-1 border-3 md:grid-cols-3">
          {/* Row 1: Item 1 (Spans 2/3 width) */}
          <div className="border-brand-blue flex flex-col items-center justify-center gap-4 p-8 md:col-span-2 md:flex-row md:gap-10 md:border-r-3 md:p-12 lg:p-16">
            <span className="font-primary text-brand-blue/70 mt-16 text-3xl font-medium tracking-tight uppercase md:text-4xl lg:text-6xl">
              since
            </span>
            <span className="font-primary text-brand-blue text-[6rem] leading-[0.8] font-medium tracking-tighter md:text-[8rem] lg:text-[10rem]">
              <Counter to={STATS[0].value} suffix={STATS[0].suffix} />
            </span>
          </div>

          {/* Row 1: Item 2 (Spans 1/3 width) */}
          <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-16">
            <span className="font-primary text-brand-blue mb-2 text-6xl font-medium tracking-tighter md:text-7xl lg:text-8xl">
              <Counter to={STATS[1].value} suffix={STATS[1].suffix} />
            </span>
            <span className="text-brand-blue font-primary text-xs tracking-[0.2em] uppercase lg:text-sm">
              {STATS[1].label}
            </span>
          </div>

          {/* Row 2: Item 3 (1/3 width) */}
          <div className="border-brand-blue flex flex-col items-center justify-center border-t-3 border-b-3 p-8 md:border-r-3 md:border-b-0 md:p-12 lg:p-16">
            <span className="font-primary text-brand-blue mb-2 text-5xl font-medium tracking-tighter md:text-6xl lg:text-7xl">
              <Counter to={STATS[2].value} suffix={STATS[2].suffix} />
            </span>
            <span className="text-brand-blue font-primary text-xs tracking-[0.2em] uppercase lg:text-sm">
              {STATS[2].label}
            </span>
          </div>

          {/* Row 2: Item 4 (1/3 width) */}
          <div className="border-brand-blue flex flex-col items-center justify-center border-t-3 border-b-3 p-8 md:border-r-3 md:border-b-0 md:p-12 lg:p-16">
            <span className="font-primary text-brand-blue mb-2 text-5xl font-medium tracking-tighter md:text-6xl lg:text-7xl">
              <Counter to={STATS[3].value} suffix={STATS[3].suffix} />
            </span>
            <span className="text-brand-blue font-primary text-xs tracking-[0.2em] uppercase lg:text-sm">
              {STATS[3].label}
            </span>
          </div>

          {/* Row 2: Item 5 (1/3 width) */}
          <div className="border-brand-blue flex flex-col items-center justify-center border-t-3 p-8 md:p-12 lg:p-16">
            <span className="font-primary text-brand-blue mb-2 text-5xl font-medium tracking-tighter md:text-6xl lg:text-7xl">
              <Counter to={STATS[4].value} suffix={STATS[4].suffix} />
            </span>
            <span className="text-brand-blue font-primary text-xs tracking-[0.2em] uppercase lg:text-sm">
              {STATS[4].label}
            </span>
          </div>
        </div>
      </div>

      <ClientMarquee />
    </section>
  );
};

const ClientMarquee = () => {
  // Use a doubled array to create the infinite effect
  const logos = [...CLIENT_IMAGES, ...CLIENT_IMAGES];

  return (
    <div className="w-full overflow-hidden pt-20">
      <motion.div
        className="flex w-max items-center gap-16 px-8"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 40,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {logos.map((src, i) => (
          <div
            key={i}
            className="relative h-42 w-42 flex-shrink-0 transition-all duration-300 hover:scale-110"
          >
            <Image
              src={src}
              alt={`Client logo`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100px, 200px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
