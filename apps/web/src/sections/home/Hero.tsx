"use client";

import { cn } from "@lib/utils";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa6";

import { LogoMarquee } from "@/components/common/LogoMarquee";
import { Button } from "@/components/ui/Button";
import { enquireVerifyUrl } from "@/lib/public-urls";
import type { HeroSlideItem } from "@/types/hero";

interface HeroProps {
  slides?: HeroSlideItem[];
}

export const Hero = ({ slides }: HeroProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const enquireHref = enquireVerifyUrl();
  const [showContent, setShowContent] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const PROGRESS_DURATION = 5000;

  const activeSlides = slides && slides.length > 0 ? slides : [
    {
      id: "fallback-1",
      badge: "Architecture & Design",
      title1: "Building",
      title2: "Legacy",
      description:
        "Redefining the architectural landscape through precision engineering and visionary design. We build structures that define generations.",
      imageUrl: "/images/projects/13.webp",
      primaryBtnText: "Explore Works",
      primaryBtnLink: "#projects",
      secondaryBtnText: "E-Vendor Registration",
      secondaryBtnLink: "/enquire/verify",
      sortOrder: 0,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "fallback-2",
      badge: "Architecture & Design",
      title1: "Shaping",
      title2: "Reality",
      description:
        "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
      imageUrl: "/images/projects/4.webp",
      primaryBtnText: "Explore Works",
      primaryBtnLink: "#projects",
      secondaryBtnText: "E-Vendor Registration",
      secondaryBtnLink: "/enquire/verify",
      sortOrder: 1,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "fallback-3",
      badge: "Architecture & Design",
      title1: "Beyond",
      title2: "Limits",
      description:
        "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
      imageUrl: "/images/projects/2.webp",
      primaryBtnText: "Explore Works",
      primaryBtnLink: "#projects",
      secondaryBtnText: "E-Vendor Registration",
      secondaryBtnLink: "/enquire/verify",
      sortOrder: 2,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Parallax / Scroll Animations
  const bgScale = useTransform(scrollY, [0, 1000], [1, 1.25]);
  const contentY = useTransform(scrollY, [0, 800], [0, -500]);
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const blurValue = useTransform(scrollY, [0, 800], [0, 4]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
        setShowContent(true);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer1 = setTimeout(() => {
        setIsExpanded(true);
      }, 800);

      const timer2 = setTimeout(() => {
        setShowContent(true);
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []);

  useEffect(() => {
    if (!showContent) return;

    let startTime = performance.now();
    let animationFrame: number;

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min((elapsed / PROGRESS_DURATION) * 100, 100);

      if (newProgress >= 100) {
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        startTime = performance.now();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }

      animationFrame = requestAnimationFrame(updateProgress);
    };

    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [showContent, currentIndex, activeSlides.length]);

  const handleSlideChange = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const safeIndex = currentIndex < activeSlides.length ? currentIndex : 0;
  const content = activeSlides[safeIndex];

  const sideSlide1 = activeSlides[1 % activeSlides.length];
  const sideSlide2 = activeSlides[2 % activeSlides.length];

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
          className="absolute z-10 hidden overflow-hidden md:block"
        >
          <Image
            src={sideSlide1.imageUrl}
            alt={sideSlide1.title1}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 56vh"
          />
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
          className="relative z-10 h-full w-full overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={content.id || currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={content.imageUrl}
                alt={content.title1}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <motion.div
                style={{ backdropFilter: `blur(${blurValue}px)` }}
                className="absolute inset-0 bg-black/30"
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
          className="absolute z-10 hidden overflow-hidden md:block"
        >
          <Image
            src={sideSlide2.imageUrl}
            alt={sideSlide2.title1}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 56vh"
          />
        </motion.div>
      </div>

      {/* Hero Content Overlay with Scroll Parallax */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ y: contentY, opacity: contentOpacity }}
            className="py-section-py-mobile md:py-section-py pointer-events-none absolute inset-0 z-30 flex flex-col justify-center"
          >
            <div className="flex w-full flex-col justify-center gap-12 px-6 md:container md:mx-auto">
              <div className="pointer-events-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={content.id || currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between"
                  >
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="bg-brand-blue h-px w-8" />
                        <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">
                          {content.badge || "Architecture & Design"}
                        </span>
                      </div>

                      <h1 className="font-heading flex flex-col -space-y-4 leading-[0.8] text-white md:-space-y-8">
                        <span className="block text-[20vw] tracking-tighter uppercase md:text-[8rem] lg:text-[10rem]">
                          {content.title1}
                        </span>
                        <span className="text-brand-blue block text-[20vw] tracking-tighter uppercase md:text-[8rem] lg:text-[10rem]">
                          {content.title2}
                        </span>
                      </h1>
                    </div>

                    <div className="flex flex-1 flex-col items-start gap-8 lg:max-w-xl lg:items-end lg:text-right">
                      <p className="max-w-md text-base leading-relaxed font-medium text-zinc-300 md:text-xl">
                        {content.description}
                      </p>

                      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:justify-end">
                        <Button
                          href={content.primaryBtnLink || "#projects"}
                          borderColor="border-white"
                          textColor="text-white"
                          hoverFillColor="bg-white"
                          hoverTextColor="group-hover:text-brand-blue"
                          className="group h-16 rounded-none px-10"
                        >
                          <span className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                            {content.primaryBtnText || "Explore Works"}{" "}
                            <FaArrowRight className="transition-transform group-hover:translate-x-2" />
                          </span>
                        </Button>
                        <Button
                          href={content.secondaryBtnLink || enquireHref}
                          borderColor="border-white"
                          textColor="text-white"
                          hoverFillColor="bg-white"
                          hoverTextColor="group-hover:text-brand-blue"
                          className="group h-16 rounded-none px-10"
                        >
                          <span className="flex items-center gap-3 text-xs font-bold tracking-widest whitespace-nowrap uppercase">
                            {content.secondaryBtnText || "E-Vendor Registration"}{" "}
                            <FaArrowRight className="transition-transform group-hover:translate-x-2" />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Line Based Navigation with Timer */}
                <div className="pointer-events-auto mt-16 w-full max-w-sm">
                  <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${activeSlides.length}, minmax(0, 1fr))` }}>
                    {activeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSlideChange(idx)}
                        className="group relative flex flex-col gap-3 py-2 text-left transition-all"
                        aria-label={`Go to slide ${idx + 1}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-[10px] font-bold tracking-widest transition-colors",
                              currentIndex === idx
                                ? "text-white"
                                : "text-white/20 group-hover:text-white/40"
                            )}
                          >
                            0{idx + 1}
                          </span>
                        </div>

                        <div className="relative h-px w-full bg-white/10">
                          {currentIndex === idx && (
                            <motion.div
                              className="bg-brand-blue absolute top-0 left-0 h-full"
                              style={{ width: `${progress}%` }}
                              transition={{ type: "tween", ease: "linear" }}
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Logos - Bottom Center */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <LogoMarquee />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
