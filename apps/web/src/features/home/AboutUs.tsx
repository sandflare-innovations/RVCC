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
  { value: 20, label: "Years of Trust" },
  { value: 300, label: "PROJECTS COMPLETED" },
  { value: 30, label: "ONGOING PROJECTS" },
  { value: 20, label: "SATISFIED CLIENTS" },
];

const CLIENT_IMAGES = Array.from({ length: 18 }, (_, i) => `/images/clients/client${i + 1}.png`);

const Counter = ({ from = 0, to }: { from?: number; to: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest) + "+");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (inView) {
      animate(count, to, {
        duration: 2.5,
        ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier easeOut
        onComplete: () => setIsComplete(true),
      });
    }
  }, [inView, count, to]);

  return (
    <motion.span ref={ref} className={cn("mx-8 text-black tabular-nums")}>
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
          <div ref={containerRef} className="max-w-4xl flex-[1.5]">
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
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        {/* <div className="mt-40 grid grid-cols-1 items-end gap-16 md:grid-cols-2">
          <div className="flex gap-6">
            <div className="relative h-40 w-64 overflow-hidden rounded-3xl">
              <Image src="/images/home-hero.png" alt="Architecture" fill className="object-cover" />
            </div>
            <div className="relative -mb-8 h-48 w-72 overflow-hidden rounded-3xl">
              <Image src="/images/hero-bg.png" alt="Interior" fill className="object-cover" />
            </div>
          </div>

          <div className="text-muted grid grid-cols-2 gap-12 pb-8 text-sm leading-relaxed">
            <p>
              By integrating innovative technologies and sustainable solutions, we ensure long-term
              value for both homeowners and investors.
            </p>
            <p>
              By uniting vision, precision and craftsmanship, we deliver exceptional residences that
              reflect confidence, quality and enduring distinction.
            </p>
          </div>
        </div> */}

        {/* Stats Section */}
        <div className="mt-40 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center justify-center px-4 text-center",
                idx !== STATS.length - 1 ? "border-border md:border-r-2" : ""
              )}
            >
              <span className="font-primary mb-6 text-6xl font-medium tracking-tighter md:text-7xl lg:text-[5.5rem]">
                <Counter to={stat.value} />
              </span>
              <span className="text-muted text-[14px] tracking-widest uppercase">{stat.label}</span>
            </div>
          ))}
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
            <Image src={src} alt={`Client logo`} fill className="object-contain" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
