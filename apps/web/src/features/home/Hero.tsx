"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

import { Button } from "@/components/ui/Button";

const HERO_CONTENT = [
  {
    title1: "Building",
    title2: "Legacy",
    description:
      "Redefining the architectural landscape through precision engineering and visionary design. We build structures that define generations.",
    img: "/images/projects/major-center.png",
  },
  {
    title1: "Shaping",
    title2: "Reality",
    description:
      "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
    img: "/images/projects/major-left.png",
  },
  {
    title1: "Beyond",
    title2: "Limits",
    description:
      "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
    img: "/images/projects/major-right.png",
  },
];

export const Hero = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Parallax / Scroll Animations
  const bgScale = useTransform(scrollY, [0, 1000], [1, 1.25]);
  const contentY = useTransform(scrollY, [0, 800], [0, -150]);
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const blurValue = useTransform(scrollY, [0, 800], [0, 4]);

  useEffect(() => {
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 800);

    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 2800);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    if (!showContent) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_CONTENT.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showContent]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % HERO_CONTENT.length);
  const prevSlide = () =>
    setCurrentIndex((prev) => (prev - 1 + HERO_CONTENT.length) % HERO_CONTENT.length);

  const content = HERO_CONTENT[currentIndex];

  const baseHeight = "75vh";
  const baseWidth = "calc(75vh * 3 / 4)";
  const expandedHeight = "100vh";
  const expandedWidth = "calc(100vh * 3 / 4)";

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      {/* Background & Growth Layer */}
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Left Side Card */}
        <motion.div
          initial={{ y: "100vh", x: "-120%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            x: isExpanded ? "-220%" : "-120%",
            width: isExpanded ? expandedWidth : baseWidth,
            height: isExpanded ? expandedHeight : baseHeight,
            opacity: isExpanded ? 0 : 1,
          }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
            x: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            opacity: { duration: 1.2, ease: "easeInOut", delay: 1.8 },
          }}
          className="absolute z-10 overflow-hidden"
        >
          <Image src={HERO_CONTENT[1].img} alt="Side 1" fill className="object-cover" />
        </motion.div>

        {/* Center Card / Parallax Background */}
        <motion.div
          initial={{ y: "100vh", x: "0%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            width: isExpanded ? "100vw" : baseWidth,
            height: isExpanded ? "100vh" : baseHeight,
          }}
          style={{ scale: isExpanded ? bgScale : 1 }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
          }}
          className="relative z-10 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={content.img}
                alt={content.title1}
                fill
                className="object-cover"
                priority
              />
              <motion.div
                style={{ backdropFilter: `blur(${blurValue}px)` }}
                className="absolute inset-0 bg-black/40"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right Side Card */}
        <motion.div
          initial={{ y: "100vh", x: "120%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            x: isExpanded ? "220%" : "120%",
            width: isExpanded ? expandedWidth : baseWidth,
            height: isExpanded ? expandedHeight : baseHeight,
            opacity: isExpanded ? 0 : 1,
          }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
            x: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            opacity: { duration: 1.2, ease: "easeInOut", delay: 1.8 },
          }}
          className="absolute z-10 overflow-hidden"
        >
          <Image src={HERO_CONTENT[2].img} alt="Side 2" fill className="object-cover" />
        </motion.div>
      </div>

      {/* Hero Content Overlay with Scroll Parallax */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ y: contentY, opacity: contentOpacity }}
            className="pointer-events-none absolute z-30 container flex h-full flex-col justify-center px-6 md:px-16 lg:px-24"
          >
            <div className="pointer-events-auto max-w-5xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                >
                  <h1 className="font-heading mb-10 flex flex-col -space-y-4 leading-[0.8] text-white md:-space-y-8">
                    <span className="block text-[15vw] tracking-tighter uppercase md:text-[10rem] lg:text-[12rem]">
                      {content.title1}
                    </span>
                    <span className="text-brand-blue block text-[15vw] tracking-tighter uppercase italic md:text-[10rem] lg:text-[12rem]">
                      {content.title2}
                    </span>
                  </h1>

                  <div className="mt-6 flex flex-col items-start gap-12">
                    <p className="max-w-md text-base leading-relaxed font-medium text-zinc-300 md:text-lg">
                      {content.description}
                    </p>

                    <Button
                      variant="primary"
                      href="#projects"
                      className="group bg-brand-blue h-16 rounded-none px-10 transition-all duration-500"
                    >
                      <span className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                        Explore Works{" "}
                        <FaArrowRight className="transition-transform group-hover:translate-x-2" />
                      </span>
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="pointer-events-auto absolute right-12 bottom-12 z-50 flex gap-4 md:right-24 md:bottom-24">
              <button
                onClick={prevSlide}
                className="group flex h-14 w-14 items-center justify-center border border-white/20 bg-white/5 backdrop-blur-sm transition-all hover:bg-white hover:text-black"
              >
                <FaChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="group flex h-14 w-14 items-center justify-center border border-white/20 bg-white/5 backdrop-blur-sm transition-all hover:bg-white hover:text-black"
              >
                <FaChevronRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
