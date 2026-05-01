"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { CLIENT_IMAGES, ABOUT_STATS as STATS, ABOUT_WORDS as WORDS } from "@data/home/about";
import {
  MotionValue,
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { FaArrowRight, FaFileLines, FaPause, FaPlay } from "react-icons/fa6";

import { Button } from "@/components/ui/Button";

import { cn } from "@lib/utils";

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
        ease: [0.16, 1, 0.3, 1],
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
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.15, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className="mr-3 mb-3 inline-block cursor-default font-normal transition-colors duration-100"
    >
      {children}
    </motion.span>
  );
};

const InlineImage = ({ src }: { src: string }) => {
  return (
    <span className="relative top-2 mx-3 mb-3 hidden h-12 w-24 md:inline-block md:h-10 md:w-32">
      <motion.span
        className="absolute inset-0 z-10 block cursor-pointer overflow-hidden rounded-sm"
        initial={{ opacity: 1, scale: 1 }}
        whileHover={{
          scale: 2.2,
          zIndex: 50,
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
        }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ scale: 1.2 }}
          whileHover={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
        >
          <Image
            src={src}
            alt="Detail"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 300px, 600px"
          />
        </motion.div>
      </motion.span>
    </span>
  );
};

export const AboutUs = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"],
  });

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (!hasStarted) {
          videoRef.current.currentTime = 0;
          setHasStarted(true);
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section
      className="bg-background pt-section-py-mobile md:py-section-py relative z-10 mx-auto pb-0"
      id="about"
    >
      <div className="container">
        <div className="header-margin flex flex-col items-start text-left md:items-center md:text-center">
          <h2 className="text-brand-blue font-primary mb-content-gap text-6xl leading-[0.8] font-normal tracking-tighter uppercase sm:text-7xl md:text-[8rem] md:leading-[0.7]">
            about
          </h2>
          <div className="flex max-w-2xl flex-col items-start md:items-center">
            <h3 className="text-brand-blue font-heading mb-content-gap text-3xl uppercase sm:text-4xl md:text-6xl">
              RIYADH VILLAS CONTRACTING CO.
            </h3>
            <div className="bg-brand-blue/30 mb-content-gap h-px w-20" />
            <p className="text-brand-blue font-primary text-[10px] font-bold tracking-[0.2em] opacity-80 md:text-[11px] md:tracking-[0.3em]">
              Civil Construction and Infrastructure development.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-center">
          <div ref={containerRef} className="mb-element-gap relative max-w-5xl flex-[1.5]">
            <h3 className="font-primary flex flex-wrap justify-start text-left text-lg leading-[1.1] font-medium tracking-tight md:justify-center md:text-center md:text-3xl md:leading-relaxed">
              {WORDS.map((word, i) => {
                const start = i / WORDS.length;
                const end = start + 1 / WORDS.length;

                if (word.startsWith("[img")) {
                  const imgIndex = word === "[img1]" ? 0 : word === "[img2]" ? 1 : 2;
                  const images = [
                    "/images/projects/2.png",
                    "/images/projects/1.png",
                    "/images/projects/3.png",
                  ];
                  return <InlineImage key={i} src={images[imgIndex]} />;
                }

                return (
                  <Word key={i} progress={scrollYProgress} range={[start, end]}>
                    {word}
                  </Word>
                );
              })}
            </h3>
          </div>

          <div className="gap-content-gap grid w-full grid-cols-1 items-stretch lg:grid-cols-12">
            <div className="group relative aspect-video w-full overflow-hidden rounded-none bg-gray-100 md:aspect-[21/9] lg:col-span-9">
              <video
                ref={videoRef}
                src="/videos/about.mp4#t=25"
                className="h-full w-full object-cover"
                loop
                playsInline
                preload="metadata"
                onClick={togglePlay}
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-500",
                  isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="pointer-events-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-transparent text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  {isPlaying ? (
                    <FaPause className="text-3xl" />
                  ) : (
                    <FaPlay className="ml-1 text-3xl" />
                  )}
                </button>
              </div>
            </div>

            <div className="gap-content-gap flex flex-col lg:col-span-3">
              <div className="bg-brand-blue/5 border-brand-blue/20 hover:bg-brand-blue/10 flex flex-1 flex-col justify-between rounded-none border p-6 transition-all">
                <div>
                  <h4 className="font-primary text-brand-blue mb-3 text-xl font-bold tracking-tighter uppercase">
                    Our story
                  </h4>
                  <p className="text-brand-blue/70 text-[10px] leading-relaxed font-medium">
                    Explore our legacy of architectural excellence and our commitment to shaping the
                    future.
                  </p>
                </div>
                <Button
                  variant="brand-outline"
                  href="/about"
                  className="mt-content-gap h-12 w-full min-w-0"
                >
                  <span className="flex items-center gap-2">
                    Read More <FaArrowRight size={12} />
                  </span>
                </Button>
              </div>

              <div className="flex flex-1 flex-col justify-between rounded-none border border-zinc-200 bg-zinc-50 p-6 transition-all hover:bg-zinc-100">
                <div>
                  <h4 className="font-primary mb-3 text-xl font-bold tracking-tighter text-zinc-800 uppercase">
                    Profile
                  </h4>
                  <p className="text-[10px] leading-relaxed font-medium text-zinc-500">
                    Download our comprehensive company profile to learn about our range of services.
                  </p>
                </div>
                <Button
                  variant="outline"
                  href="/pdf/RVCC COPMANY PROFILE SIGNATURE PROJECT.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  borderColor="border-black"
                  textColor="text-black"
                  hoverFillColor="bg-black"
                  hoverTextColor="group-hover:text-white"
                  className="mt-content-gap h-12 w-full min-w-0"
                >
                  <span className="flex items-center gap-2">
                    Open Profile <FaFileLines size={12} />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-element-gap pt-element-gap md:mt-section-py md:pt-section-py border-t border-zinc-100">
          <div className="gap-element-gap grid grid-cols-2 md:grid-cols-4">
            {STATS.slice(1).map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className="font-primary text-brand-blue text-6xl font-medium tracking-tighter lg:text-8xl">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="h-px w-full bg-zinc-100" />
                <div className="font-primary text-[10px] font-bold tracking-[0.4em] text-zinc-400 uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <ClientMarquee />
    </section>
  );
};

const ClientMarquee = () => {
  const logos = [...CLIENT_IMAGES, ...CLIENT_IMAGES];
  return (
    <div className="md:pt-element-gap w-full overflow-hidden pt-8">
      <motion.div
        className="flex w-max items-center gap-16 px-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {logos.map((src, i) => (
          <div
            key={i}
            className="relative h-42 w-42 flex-shrink-0 transition-all duration-300 hover:scale-110"
          >
            <Image
              src={src}
              alt="Client logo"
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
