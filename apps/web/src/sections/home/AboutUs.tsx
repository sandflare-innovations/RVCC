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
  const opacity = useTransform(progress, range, [1, 1]);
  const color = useTransform(progress, range, ["#000000", "#0073bc"]);

  return (
    <motion.span
      style={{ opacity, color }}
      className="mr-3 mb-3 inline-block cursor-default font-normal transition-colors duration-100"
    >
      {children}
    </motion.span>
  );
};

const InlineImage = ({ src }: { src: string }) => {
  return (
    <span className="relative top-2 mx-3 mb-3 inline-block h-12 w-24 md:h-10 md:w-32">
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
    <section className="bg-background relative z-10 mx-auto max-w-7xl py-20" id="about">
      <div className="container">
        <div className="my-10 flex flex-col items-center text-center">
          <h2 className="text-brand-blue font-primary mb-10 text-[8rem] leading-[0.8] font-normal tracking-tighter uppercase">
            about
          </h2>
          <div className="flex max-w-2xl flex-col items-center">
            <h3 className="text-brand-blue font-heading mb-6 text-6xl uppercase">
              RIYADH VILLAS CONTRACTING CO.
            </h3>
            <div className="bg-brand-blue/30 mb-6 h-px w-20" />
            <p className="text-brand-blue font-primary text-[11px] font-bold tracking-[0.3em] uppercase opacity-80">
              Civil Construction and Infrastructure development.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div ref={containerRef} className="relative mb-20 max-w-5xl flex-[1.5]">
            <h3 className="font-primary flex flex-wrap justify-center text-center text-xl leading-relaxed font-medium tracking-tight md:text-3xl">
              {WORDS.map((word, i) => {
                const start = i / WORDS.length;
                const end = start + 1 / WORDS.length;

                if (word.startsWith("[img")) {
                  const imgIndex = word === "[img1]" ? 0 : word === "[img2]" ? 1 : 2;
                  const images = [
                    "/images/projects/major-left.png",
                    "/images/projects/major-center.png",
                    "/images/projects/major-right.png",
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

          <div className="grid w-full grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-none bg-gray-100 lg:col-span-9">
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

            <div className="flex flex-col gap-6 lg:col-span-3">
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
                <Button variant="brand-outline" href="/about" className="mt-6 h-12 w-full min-w-0">
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
                  className="mt-6 h-12 w-full min-w-0"
                >
                  <span className="flex items-center gap-2">
                    Open Profile <FaFileLines size={12} />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-zinc-100 pt-32">
          <div className="grid grid-cols-2 gap-x-12 gap-y-20 md:grid-cols-4">
            {STATS.slice(1).map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="flex flex-col gap-4"
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
    <div className="w-full overflow-hidden pt-20">
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
