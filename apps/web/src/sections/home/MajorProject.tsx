"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

import { Button } from "@/components/ui/Button";

export interface MajorProjectPropItem {
  id: string | number;
  title: string;
  location?: string;
  image: string;
  description: string;
  slug?: string;
}

export const MajorProjectSkeleton = () => {
  return (
    <section className="pt-20 pb-20 bg-white overflow-hidden">
      <div className="container mx-auto">
        <div className="header-margin gap-element-gap flex flex-col items-center text-center">
          <div className="h-4 w-36 rounded-full bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse" />
          <div className="h-20 w-80 bg-gradient-to-r from-brand-blue/20 via-brand-blue/10 to-brand-blue/15 animate-pulse md:h-28" />
          <div className="h-4 w-96 max-w-full bg-gradient-to-r from-zinc-200 via-brand-blue/10 to-zinc-200 animate-pulse" />
          <div className="h-12 w-48 border border-brand-blue/30 bg-brand-blue/5 animate-pulse mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] w-full bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5 border border-brand-blue/20 shadow-md overflow-hidden relative animate-pulse"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-brand-blue/5 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
                <div className="h-3 w-24 bg-brand-blue/40" />
                <div className="h-8 w-3/4 bg-gradient-to-r from-brand-blue/30 via-brand-blue/15 to-brand-blue/25" />
                <div className="h-4 w-full bg-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MajorProjectContent = ({ projectList }: { projectList: MajorProjectPropItem[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);


  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // RAW scrollYProgress for 1:1 movement

  // Phase 0: Arrival (Starts from closer to the top to reduce initial gap)
  const cardsY = useTransform(scrollYProgress, [0, 0.1], ["30vh", "0vh"]);

  // Phase 1: Expansion (Grows to FULL 100vh)
  const p1Width = useTransform(scrollYProgress, [0.15, 0.35], ["33.33vw", "100vw"]);
  const p1Height = useTransform(scrollYProgress, [0.15, 0.35], ["80vh", "100vh"]);
  const leftX = useTransform(scrollYProgress, [0.15, 0.35], ["0vw", "-50vw"]);
  const rightX = useTransform(scrollYProgress, [0.15, 0.35], ["0vw", "50vw"]);

  // Phase 2 & 3: Stacking (Full 100vh cards)
  const p2Y = useTransform(scrollYProgress, [0.45, 0.65], ["100vh", "0vh"]);
  const p3Y = useTransform(scrollYProgress, [0.75, 0.95], ["100vh", "0vh"]);

  // Spring for text reveals
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 30 });
  const p1ContentOpacity = useTransform(smoothProgress, [0.35, 0.45], [0, 1]);
  const p1ContentY = useTransform(smoothProgress, [0.35, 0.45], [30, 0]);
  const p2ContentOpacity = useTransform(smoothProgress, [0.6, 0.7], [0, 1]);
  const p3ContentOpacity = useTransform(smoothProgress, [0.9, 1], [0, 1]);

  return (
    <div className="bg-background hidden md:block">
      {/* 1. Header Section - Tightened up to reduce gap */}
      <section className="pt-20">
        <div className="container mx-auto">
          <div className="header-margin gap-element-gap flex flex-col items-center text-center">
            <div className="flex-1">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase md:text-[8rem]"
              >
                Major <br /> Projects
              </motion.h2>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="max-w-xl text-sm leading-relaxed text-zinc-500 md:pb-4">
                Showcasing our most ambitious architectural achievements that define the skyline and
                set new standards in construction excellence across the region.
              </p>
              <Button
                borderColor="border-brand-blue"
                textColor="text-brand-blue"
                bgColor="bg-transparent"
                hoverFillColor="bg-brand-blue"
                hoverTextColor="group-hover:text-background"
                className="w-full md:w-auto"
                href="#works"
              >
                VIEW ALL
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Unified Animation Frame - Takes 100vh for full-screen imagery */}
      <section id="works" ref={containerRef} className="relative -mt-40 h-[600vh]">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <motion.div
            style={{ y: cardsY }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Grid Side Card (Project 02) */}
            <motion.div
              style={{ x: leftX }}
              className="absolute left-0 z-20 h-[80vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={projectList[1]?.image || "/images/placeholder.jpg"}
                  alt={projectList[1]?.title || "Project 02"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-8 left-8 text-white">
                  <span className="text-brand-blue mb-2 block text-xs font-bold tracking-widest uppercase">
                    Project 02
                  </span>
                  <h3 className="text-2xl font-light">{projectList[1]?.title || "Project 02"}</h3>
                </div>
              </div>
            </motion.div>

            {/* PROJECT 01 - Expands to 100vh */}
            <motion.div
              style={{ width: p1Width, height: p1Height, zIndex: 10 }}
              className="relative flex items-center justify-center overflow-hidden bg-black"
            >
              <Image
                src={projectList[0]?.image || "/images/placeholder.jpg"}
                alt={projectList[0]?.title || "Project 01"}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 80vw"
              />
              <motion.div
                style={{ opacity: p1ContentOpacity }}
                className="absolute inset-0 z-30 bg-black/10"
              />

              <div className="relative z-40 container mx-auto md:px-8">
                <motion.div
                  style={{ opacity: p1ContentOpacity, y: p1ContentY }}
                  className="max-w-4xl text-left"
                >
                  <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                    Project 01
                  </span>
                  <h3 className="font-primary mb-content-gap text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                    {(projectList[0]?.title || "Project 01").split(" ").map((word: string, i: number) => (
                      <span key={i} className="block">
                        {word}
                      </span>
                    ))}
                  </h3>
                  <p className="mb-content-gap max-w-md text-lg font-light text-zinc-300 md:text-xl">
                    {projectList[0]?.description || ""}
                  </p>
                  <div className="gap-content-gap flex flex-col sm:flex-row">
                    <Button
                      borderColor="border-white"
                      textColor="text-brand-blue"
                      bgColor="bg-white"
                      hoverFillColor="bg-brand-blue"
                      hoverTextColor="group-hover:text-background"
                      className="h-16 rounded-none px-10"
                      href={projectList[0]?.slug ? `/projects/${projectList[0].slug}` : "/projects"}
                    >
                      Explore Work
                    </Button>
                    <Button
                      borderColor="border-white"
                      textColor="text-white"
                      bgColor="bg-transparent"
                      hoverFillColor="bg-white"
                      hoverTextColor="group-hover:text-brand-blue"
                      className="h-16 rounded-none px-10"
                      href="/projects"
                    >
                      View Portfolio
                    </Button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                style={{ opacity: useTransform(scrollYProgress, [0.25, 0.35], [1, 0]) }}
                className="absolute bottom-8 left-8 z-20 text-white"
              >
                <h3 className="text-2xl font-light">{projectList[0]?.title || "Project 01"}</h3>
              </motion.div>
            </motion.div>

            {/* Grid Side Card (Project 03) */}
            <motion.div
              style={{ x: rightX }}
              className="absolute right-0 z-20 h-[80vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={projectList[2]?.image || "/images/placeholder.jpg"}
                  alt={projectList[2]?.title || "Project 03"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-8 left-8 text-white">
                  <span className="text-brand-blue mb-2 block text-xs font-bold tracking-widest uppercase">
                    Project 03
                  </span>
                  <h3 className="text-2xl font-light">{projectList[2]?.title || "Project 03"}</h3>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* PROJECT 02 - Full Screen Slide-over (Sticky Stacking) */}
          <motion.div
            style={{ y: p2Y, zIndex: 30 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
          >
            <Image
              src={projectList[1]?.image || "/images/placeholder.jpg"}
              alt={projectList[1]?.title || "Project 02"}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <motion.div
              style={{ opacity: p2ContentOpacity }}
              className="absolute inset-0 z-10 bg-black/10"
            />

            <div className="relative z-20 container mx-auto md:px-8">
              <motion.div
                style={{ opacity: p2ContentOpacity, y: p1ContentY }}
                className="max-w-4xl text-left"
              >
                <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                  Project 02
                </span>
                <h3 className="font-primary mb-content-gap text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                  {(projectList[1]?.title || "Project 02").split(" ").map((word: string, i: number) => (
                    <span key={i} className="block">
                      {word}
                    </span>
                  ))}
                </h3>
                <p className="mb-content-gap max-w-md text-lg font-light text-zinc-300 md:text-xl">
                  {projectList[1]?.description || ""}
                </p>
                <div className="gap-content-gap flex flex-col sm:flex-row">
                  <Button
                    borderColor="border-white"
                    textColor="text-brand-blue"
                    bgColor="bg-white"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-16 rounded-none px-10"
                    href={projectList[1]?.slug ? `/projects/${projectList[1].slug}` : "/projects"}
                  >
                    Explore Work
                  </Button>
                  <Button
                    borderColor="border-white"
                    textColor="text-white"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-white"
                    hoverTextColor="group-hover:text-brand-blue"
                    className="h-16 rounded-none px-10"
                    href="/projects"
                  >
                    View Portfolio
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* PROJECT 03 - Full Screen Slide-over (Sticky Stacking) */}
          <motion.div
            style={{ y: p3Y, zIndex: 40 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
          >
            <Image
              src={projectList[2]?.image || "/images/placeholder.jpg"}
              alt={projectList[2]?.title || "Project 03"}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <motion.div
              style={{ opacity: p3ContentOpacity }}
              className="absolute inset-0 z-10 bg-black/10"
            />

            <div className="relative z-20 container mx-auto md:px-8">
              <motion.div
                style={{ opacity: p3ContentOpacity, y: p1ContentY }}
                className="max-w-4xl text-left"
              >
                <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                  Project 03
                </span>
                <h3 className="font-primary mb-content-gap text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                  {(projectList[2]?.title || "Project 03").split(" ").map((word: string, i: number) => (
                    <span key={i} className="block">
                      {word}
                    </span>
                  ))}
                </h3>
                <p className="mb-content-gap max-w-md text-lg font-light text-zinc-300 md:text-xl">
                  {projectList[2]?.description || ""}
                </p>
                <div className="gap-content-gap flex flex-col sm:flex-row">
                  <Button
                    borderColor="border-white"
                    textColor="text-brand-blue"
                    bgColor="bg-white"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-16 rounded-none px-10"
                    href={projectList[2]?.slug ? `/projects/${projectList[2].slug}` : "/projects"}
                  >
                    Explore Work
                  </Button>
                  <Button
                    borderColor="border-white"
                    textColor="text-white"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-white"
                    hoverTextColor="group-hover:text-brand-blue"
                    className="h-16 rounded-none px-10"
                    href="/projects"
                  >
                    View Portfolio
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export const MajorProject = ({
  initialProjects,
}: {
  initialProjects?: MajorProjectPropItem[];
}) => {
  if (!initialProjects || initialProjects.length < 3) {
    return <MajorProjectSkeleton />;
  }

  const projectList: MajorProjectPropItem[] = initialProjects.slice(0, 3);

  return <MajorProjectContent projectList={projectList} />;
};

