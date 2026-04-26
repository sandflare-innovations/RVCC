"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@ui/Button";
import { cn } from "@lib/utils";

const HERO_CONTENT = [
  {
    subtitle: "Excellence in Construction",
    title1: "Building",
    title2: "Beyond",
    description: "Redefining the architectural landscape through precision engineering and visionary design. We build legacy structures that stand the test of time.",
    img: "/images/hero-bg.png"
  },
  {
    subtitle: "Precision Engineering",
    title1: "Shaping",
    title2: "Reality",
    description: "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
    img: "/images/home-hero.png"
  },
  {
    subtitle: "Visionary Design",
    title1: "Legacy",
    title2: "Defined",
    description: "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
    img: "/images/hero-bg.png"
  }
];

const SLIDE_DURATION = 6000;

export const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % HERO_CONTENT.length);
      setProgress(0);
    }, SLIDE_DURATION);

    const progressTimer = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + 100 / (SLIDE_DURATION / 100), 100));
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [currentIndex]);

  const content = HERO_CONTENT[currentIndex];

  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {HERO_CONTENT.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 transition-opacity duration-[2000ms] ease-in-out",
                isActive ? "z-10 opacity-100" : "z-0 opacity-0"
              )}
            >
              <Image
                src={slide.img}
                alt={`Architecture Slide ${idx + 1}`}
                fill
                priority={idx === 0}
                className={cn(
                  "object-cover transition-transform duration-[6000ms] ease-out",
                  isActive ? "scale-105" : "scale-100"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
            </div>
          );
        })}
      </div>

      {/* Main Content with AnimatePresence */}
      <div className="container relative z-30 flex h-full flex-col justify-center px-6 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
              exit: { opacity: 0, transition: { duration: 0.5 } }
            }}
            className="max-w-4xl"
          >


            <h1 className="mb-8 flex flex-col -space-y-4 font-bold leading-[0.75] text-white md:-space-y-12">
              <div className="overflow-hidden">
                <motion.span
                  variants={{
                    hidden: { y: "100%" },
                    visible: { y: 0, transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } }
                  }}
                  className="block text-5xl uppercase tracking-tight md:text-8xl lg:text-[10rem] "
                >
                  {content.title1}
                </motion.span>
              </div>
              <div className="overflow-hidden">
                <motion.span
                  variants={{
                    hidden: { y: "100%" },
                    visible: { y: 0, transition: { duration: 0.8, delay: 0.1, ease: [0.19, 1, 0.22, 1] } }
                  }}
                  className="block text-5xl uppercase tracking-tight text-brand-blue md:text-8xl lg:text-[10rem]"
                >
                  {content.title2}
                </motion.span>
              </div>
            </h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }
              }}
              className="mb-12 max-w-xl text-lg font-light leading-relaxed text-white/70 md:text-xl"
            >
              {content.description}
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } }
              }}
              className="flex flex-wrap gap-6"
            >
              <Button variant="outline" href="#projects">
                View Projects
              </Button>
              <Button variant="primary" href="#contact">
                Get in Touch
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Luxury Stats Overlay - Bottom Right */}
      <div className="absolute bottom-20 right-12 z-40 hidden flex-col items-end border-l border-white/20 pl-8 md:flex">
        <div className="mb-2 text-4xl font-bold text-white">25+</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Years of Heritage</div>
      </div>

      {/* Pagination - SpaceX Style Minimal Lines */}
      <div className="absolute bottom-12 left-1/2 z-50 flex -translate-x-1/2 items-center space-x-8">
        {HERO_CONTENT.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className="group relative h-12 w-12 flex items-center justify-center"
            >
              <div className="relative h-[2px] w-full bg-white/20 transition-all duration-300 group-hover:bg-white/40">
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-brand-blue transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
              <span className={cn(
                "absolute -top-6 text-[10px] font-bold transition-all duration-300",
                isActive ? "text-white opacity-100" : "text-white/30 opacity-0 group-hover:opacity-100"
              )}>
                0{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
