"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icons } from "@/lib/icons";

export interface ProjectListItem {
  id?: string | number;
  title: string;
  location?: string;
  year?: string;
  category?: string;
  type?: string;
  description?: string;
  image: string;
  slug?: string;
}

export const RecentProjectsSkeleton = () => {
  return (
    <section className="section-padding overflow-hidden bg-white">
      <div className="container mx-auto">
        <div className="header-margin gap-element-gap flex flex-col items-center justify-between md:flex-row md:items-end">
          <div className="flex-1">
            <div className="h-4 w-32 rounded-full bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse mb-3" />
            <div className="h-20 w-80 bg-gradient-to-r from-brand-blue/20 via-brand-blue/10 to-brand-blue/15 animate-pulse md:h-28" />
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="h-4 w-72 bg-gradient-to-r from-zinc-200 via-brand-blue/10 to-zinc-200 animate-pulse" />
            <div className="h-12 w-40 border border-brand-blue/30 bg-brand-blue/5 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col border border-brand-blue/15 bg-white shadow-sm overflow-hidden">
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5 animate-pulse" />
              <div className="p-6 flex flex-col gap-3">
                <div className="h-3 w-28 bg-brand-blue/30" />
                <div className="h-6 w-3/4 bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse" />
                <div className="h-4 w-full bg-zinc-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const RecentProjectsContent = ({ projectList }: { projectList: ProjectListItem[] }) => {

  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yTransformEven = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);
  const yTransformOdd = useTransform(scrollYProgress, [0, 0.5, 1], [-100, 0, 100]);

  // 1. Responsive items per view
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. State for navigation
  const [startIndex, setStartIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const nextSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev - 1);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== mobileIndex && newIndex >= 0 && newIndex < projectList.length) {
        setMobileIndex(newIndex);
      }
    }
  };

  // Render a "window" of items based on the current startIndex
  // We use simple modulo logic to create the infinite effect from a normal array
  const visibleItems = useMemo(() => {
    const items = [];
    const buffer = 3;
    const len = projectList.length;

    for (let i = -buffer; i < itemsPerView + buffer; i++) {
      const virtualIndex = startIndex + i;
      // Positive modulo formula for infinite array wrapping
      const actualIndex = ((virtualIndex % len) + len) % len;
      const project = projectList[actualIndex];

      if (project) {
        items.push({
          project,
          index: virtualIndex,
        });
      }
    }
    return items;
  }, [startIndex, itemsPerView, projectList]);


  return (
    <section
      ref={sectionRef}
      className="bg-background section-padding relative w-full overflow-hidden"
      id="projects"
    >
      <div className="container">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          className="header-margin md:gap-element-gap flex flex-col items-center gap-6 text-center sm:pb-20 lg:flex-row lg:items-end lg:text-left"
        >
          <div className="flex-1">
            <h2 className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase md:text-[8rem]">
              Our <br className="hidden lg:block" /> Projects
            </h2>
          </div>
          <div className="flex flex-col items-center gap-6 lg:items-end lg:justify-end">
            <p className="max-w-xl text-sm leading-relaxed text-zinc-500 md:text-lg lg:pb-4">
              Explore our diverse portfolio of recently completed works, ranging from commercial
              hubs to residential landmarks across Saudi Arabia.
            </p>
            <div className="hidden lg:block">
              <Button
                href="/projects"
                borderColor="border-brand-blue"
                textColor="text-brand-blue"
                bgColor="bg-transparent"
                hoverFillColor="bg-brand-blue"
                hoverTextColor="group-hover:text-background"
                className="w-full md:w-auto"
              >
                EXPLORE ALL
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Projects Carousel */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto"
          >
            {projectList.map((project, idx) => (
              <div
                key={idx}
                className="relative flex w-full min-w-full flex-shrink-0 snap-center snap-always flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden shadow-sm bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5">
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-brand-blue/15 to-transparent animate-pulse" />
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>

                {/* Content Container - Significant Overlap */}
                <div className="relative z-20 mx-3 -mt-20 border border-zinc-100 bg-white p-8 text-left shadow-2xl">
                  <div className="mb-6 space-y-3">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                      COMPLETED — {project.category}
                    </span>
                    <h3 className="text-brand-blue text-3xl leading-[0.9] font-medium tracking-tighter uppercase">
                      {project.title}
                    </h3>
                  </div>

                  <p className="mb-8 line-clamp-4 text-[12px] leading-relaxed text-zinc-500">
                    {project.description}
                  </p>

                  <Button
                    borderColor="border-zinc-300"
                    textColor="text-zinc-800"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-white"
                    className="h-12 px-8 text-[10px] font-bold tracking-widest"
                    href={project.slug ? `/projects/${project.slug}` : "/projects"}
                  >
                    LEARN MORE
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Slider Indicator */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="relative h-1 w-48 overflow-hidden bg-zinc-100">
              <motion.div
                className="bg-brand-blue absolute inset-y-0"
                style={{ width: `${100 / (projectList.length || 1)}%` }}
                animate={{ x: `${mobileIndex * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Button
              href="/projects"
              borderColor="border-brand-blue"
              textColor="text-brand-blue"
              bgColor="bg-transparent"
              hoverFillColor="bg-brand-blue"
              hoverTextColor="group-hover:text-background"
              className="w-full"
            >
              EXPLORE ALL PROJECTS
            </Button>
          </motion.div>
        </div>

        {/* Desktop Projects Slider Container */}
        <div className="relative hidden md:block">
          {/* Side Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="border-brand-blue text-brand-blue hover:bg-brand-blue absolute top-[50%] -left-6 z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center border backdrop-blur-xs transition-all hover:text-white md:-left-12"
          >
            <Icons.ChevronRight className="h-8 w-8 rotate-180" />
          </button>

          <button
            onClick={nextSlide}
            className="border-brand-blue text-brand-blue hover:bg-brand-blue absolute top-[50%] -right-6 z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center border backdrop-blur-xs transition-all hover:text-white md:-right-12"
          >
            <Icons.ChevronRight className="h-8 w-8" />
          </button>

          <div className="mx-auto w-full">
            <div className="relative h-[650px] w-full">
              {visibleItems.map(({ project, index }) => {
                const isEven = index % 2 === 0;
                const yOffset = isEven ? yTransformEven : yTransformOdd;

                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      x: `${(index - startIndex) * 100}%`,
                    }}
                    transition={{
                      duration: isTransitioning ? 0.8 : 0,
                      ease: [0.19, 1, 0.22, 1],
                    }}
                    style={{
                      y: yOffset,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${100 / itemsPerView}%`,
                    }}
                    className="group flex flex-shrink-0 flex-col"
                  >
                    <div className="px-1">
                      {/* Image Container with Hover Overlay */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5">
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-brand-blue/15 to-transparent animate-pulse" />
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />

                        {/* Category Tags */}
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                            {project.category}
                          </span>
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                            {project.type}
                          </span>
                        </div>

                        {/* Hover Overlay - Now White with Heading */}
                        <div className="bg-brand-blue absolute inset-0 z-30 flex translate-y-full flex-col justify-end p-8 shadow-2xl transition-transform duration-700 ease-[0.19,1,0.22,1] group-hover:translate-y-[25%]">
                          <div className="gap-content-gap flex h-full flex-col justify-center">
                            <h3 className="text-background text-5xl font-black uppercase">
                              {project.title}
                            </h3>
                            <p className="text-background text-xs leading-relaxed font-medium">
                              {project.description}
                            </p>
                            <Button
                              borderColor="border-background"
                              textColor="text-background"
                              bgColor="bg-transparent"
                              hoverFillColor="bg-background"
                              hoverTextColor="group-hover:text-brand-blue"
                              className="mt-2 h-12 w-full text-[10px] font-bold"
                              href={project.slug ? `/projects/${project.slug}` : "/projects"}
                            >
                              VIEW IN DETAIL
                            </Button>
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const RecentProjects = ({
  initialProjects,
}: {
  initialProjects?: ProjectListItem[];
}) => {
  if (!initialProjects || initialProjects.length === 0) {
    return <RecentProjectsSkeleton />;
  }

  const projectList: ProjectListItem[] = initialProjects.map((p) => ({
    id: p.id,
    title: p.title,
    location: p.location || "Riyadh, Saudi Arabia",
    year: p.year || "2025",
    category: p.category || "COMMERCIAL",
    type: p.type || "LANDMARK",
    description: p.description || "",
    image: p.image || "/images/projects/4.webp",
    slug: p.slug,
  }));

  return <RecentProjectsContent projectList={projectList} />;
};

