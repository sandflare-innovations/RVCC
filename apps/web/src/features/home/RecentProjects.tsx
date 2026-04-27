"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { motion, useScroll, useTransform } from "framer-motion";

import { Icons } from "@repo/ui";

import { Button } from "@/components/ui/Button";

const PROJECTS = [
  {
    title: "Luxury Skyline",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "A breathtaking architectural masterpiece redefining the city's horizon with unparalleled elegance and sustainable design.",
    image: "/images/home-hero.png",
  },
  {
    title: "Bohemian Rhapsody",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "Artistic living spaces that blend avant-garde aesthetics with functional modernity for a unique urban experience.",
    image: "/images/hero-bg.png",
  },
  {
    title: "Vintage Glamour",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "Timeless luxury meets contemporary comfort in this meticulously restored heritage estate.",
    image: "/images/home-hero.png",
  },
  {
    title: "Modern Sanctuary",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "An oasis of calm featuring minimalist lines, natural light, and state-of-the-art smart home integration.",
    image: "/images/hero-bg.png",
  },
  {
    title: "Urban Oasis",
    location: "London, UK",
    year: "2024",
    category: "COMMERCIAL",
    type: "OFFICE",
    description:
      "Dynamic workspace designed to foster creativity and collaboration in the heart of the business district.",
    image: "/images/home-hero.png",
  },
  {
    title: "Nordic Minimal",
    location: "Oslo, Norway",
    year: "2024",
    category: "RESIDENTIAL",
    type: "APARTMENT",
    description:
      "Sleek Scandinavian design focused on simplicity, functionality, and connection with nature.",
    image: "/images/hero-bg.png",
  },
];

class Node {
  title: string;
  location: string;
  year: string;
  category: string;
  type: string;
  description: string;
  image: string;
  id: number;
  next: Node | null = null;
  prev: Node | null = null;

  constructor(data: (typeof PROJECTS)[0], id: number) {
    this.title = data.title;
    this.location = data.location;
    this.year = data.year;
    this.category = data.category;
    this.type = data.type;
    this.description = data.description;
    this.image = data.image;
    this.id = id;
  }
}

class CircularDoublyLinkedList {
  head: Node | null = null;

  constructor(projects: typeof PROJECTS) {
    if (projects.length === 0) return;

    const nodes = projects.map((p, i) => new Node(p, i));
    const len = nodes.length;

    for (let i = 0; i < len; i++) {
      nodes[i].next = nodes[(i + 1) % len];
      nodes[i].prev = nodes[(i - 1 + len) % len];
    }
    this.head = nodes[0];
  }

  getNodeAt(index: number): Node | null {
    if (!this.head) return null;
    let curr = this.head;
    const len = PROJECTS.length;
    const steps = ((index % len) + len) % len;

    if (steps <= len / 2) {
      for (let i = 0; i < steps; i++) curr = curr.next!;
    } else {
      for (let i = 0; i < len - steps; i++) curr = curr.prev!;
    }
    return curr;
  }
}

export const RecentProjects = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yTransformEven = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);
  const yTransformOdd = useTransform(scrollYProgress, [0, 0.5, 1], [-100, 0, 100]);

  // 1. Initialize formal Circular Doubly Linked List
  const list = useMemo(() => new CircularDoublyLinkedList(PROJECTS), []);

  // 2. Responsive items per view
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

  // 3. State for navigation
  const [startIndex, setStartIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const nextSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev - 1);
  };

  // Render a "window" of items based on the current startIndex
  // We render 10 items to ensure we always have content during the slide
  const visibleItems = useMemo(() => {
    const items = [];
    // Render enough items to handle the transition and off-screen buffers
    const buffer = 3;
    for (let i = -buffer; i < itemsPerView + buffer; i++) {
      const virtualIndex = startIndex + i;
      const node = list.getNodeAt(virtualIndex);
      if (node) {
        items.push({
          node: node,
          index: virtualIndex,
        });
      }
    }
    return items;
  }, [startIndex, list, itemsPerView]);

  return (
    <section
      ref={sectionRef}
      className="bg-background relative w-full px-8 py-20 md:px-16 lg:px-24"
      id="projects"
    >
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-32 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <h2 className="text-brand-blue text-[4rem] leading-[0.9] font-medium tracking-tighter uppercase md:text-[6rem]">
              Our Projects
            </h2>
          </div>
          <div className="flex flex-1 justify-end pb-2">
            <Button
              href="#contact"
              variant="outline"
              className="border-brand-blue text-brand-blue h-14 w-[220px]"
            >
              EXPLORE ALL
            </Button>
          </div>
        </div>

        {/* Projects Slider Container */}
        <div className="relative">
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

          <div className="px-2">
            <div className="relative h-[650px] w-full">
              {visibleItems.map(({ node, index }) => {
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
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
                        <Image
                          src={node.image}
                          alt={node.title}
                          fill
                          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />

                        {/* Category Tags */}
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                            {node.category}
                          </span>
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                            {node.type}
                          </span>
                        </div>

                        {/* Hover Overlay - Now White with Heading */}
                        <div className="bg-brand-blue absolute inset-0 z-30 flex translate-y-full flex-col justify-end p-8 shadow-2xl transition-transform duration-700 ease-[0.19,1,0.22,1] group-hover:translate-y-[25%]">
                          <div className="flex h-full flex-col justify-center gap-4">
                            <h3 className="text-background text-5xl font-black uppercase">
                              {node.title}
                            </h3>
                            <p className="text-background text-xs leading-relaxed font-medium">
                              {node.description}
                            </p>
                            <Button
                              variant="outline"
                              className="border-background text-background hover:bg-background hover:text-brand-blue mt-2 h-12 w-full text-[10px] font-bold"
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
