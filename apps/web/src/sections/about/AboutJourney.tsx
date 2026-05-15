"use client";

import React, { useRef } from "react";

import { motion, useInView, useScroll, useSpring } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

interface Milestone {
  year: string;
  title: string;
  description: string;
  image: string;
  align: "left" | "right";
}

const MILESTONES: Milestone[] = [
  {
    year: "2006",
    title: "SAGIA Secured Foundation",
    description:
      "RVCC secured 100% foreign investment status under the Ministry of Investment (SAGIA), establishing a robust foundation for long-term growth in the Kingdom.",
    image: "/images/journey/sagia.png",
    align: "left",
  },
  {
    year: "2016",
    title: "Class A Contractor Status",
    description:
      "Achieved the prestigious Class A Contractor Badge, a testament to our technical excellence and capability in executing monumental infrastructure projects.",
    image: "/images/journey/2016.png",
    align: "right",
  },
  {
    year: "2023",
    title: "ISO Excellence & Identity",
    description:
      "Attained ISO 9001:2018 and ISO 14001:2015 certifications while undergoing a complete corporate identity uplift and UAF/IAF accreditation.",
    image: "/images/journey/iso.png",
    align: "left",
  },
  {
    year: "2030",
    title: "Vision 2030 Engineering",
    description:
      "Engineering the future in full alignment with Saudi Vision 2030, focusing on sustainable urban development and trusted client partnerships.",
    image: "/images/journey/vision-2030.png",
    align: "right",
  },
];

export const AboutJourney = () => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start center", "end center"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-transparent py-24 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="mb-24 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase"
          >
            Evolution & Growth
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-6xl tracking-tighter text-zinc-900 uppercase"
          >
            Our <span className="text-brand-blue serif">Journey</span>: Transformation
          </motion.h2>
        </div>

        <div className="relative mx-auto max-w-6xl" ref={trackRef}>
          {/* Top Arrow */}
          <div className="absolute -top-12 left-1/2 hidden -translate-x-1/2 text-zinc-300 lg:block">
            <FaChevronUp size={14} />
          </div>

          {/* Vertical Track Background */}
          <div className="absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-zinc-100 lg:block" />

          {/* Animated Progress Track */}
          <motion.div
            style={{ scaleY, originY: 0 }}
            className="bg-brand-blue/80 absolute top-0 left-1/2 z-0 hidden h-full w-[2px] -translate-x-1/2 shadow-[0_0_15px_rgba(0,115,188,0.3)] lg:block"
          />

          {/* Bottom Arrow */}
          <div className="text-brand-blue absolute -bottom-12 left-1/2 hidden -translate-x-1/2 lg:block">
            <FaChevronDown size={14} />
          </div>

          <div className="relative z-10 space-y-32 lg:space-y-48">
            {MILESTONES.map((item, i) => (
              <MilestoneRow key={i} item={item} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const MilestoneRow = ({ item, i }: { item: Milestone; i: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50% 0px -50% 0px",
  });

  // Convert boolean to color
  const activeColor = isInView ? "#0073BC" : "#18181b";

  return (
    <div ref={ref} className="relative">
      {/* Year Centered on Line */}
      <div className="absolute -top-12 left-1/2 hidden -translate-x-1/2 lg:block">
        <motion.span
          animate={{ color: activeColor }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading z-10 bg-white px-4 text-6xl tracking-tighter"
        >
          {item.year}
        </motion.span>
      </div>

      {/* Content Row: Alternating Image and Text */}
      <div className="flex flex-col items-center gap-12 pt-20 lg:grid lg:grid-cols-2 lg:gap-24">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          {i % 2 === 0 ? (
            <div className="aspect-[6/3] overflow-hidden bg-zinc-100 transition-all duration-700">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full transform object-cover transition-transform duration-1000 hover:scale-110"
              />
            </div>
          ) : (
            <div className="lg:pr-12 lg:text-right">
              <h3 className="font-heading mb-6 text-2xl leading-tight text-zinc-900 uppercase">
                {item.title}
              </h3>
              <p className="text-lg leading-relaxed font-light text-zinc-500">{item.description}</p>
            </div>
          )}
        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          {i % 2 === 0 ? (
            <div className="lg:pl-12">
              <h3 className="font-heading mb-6 text-2xl leading-tight text-zinc-900 uppercase">
                {item.title}
              </h3>
              <p className="text-lg leading-relaxed font-light text-zinc-500">{item.description}</p>
            </div>
          ) : (
            <div className="aspect-[6/3] overflow-hidden bg-zinc-100 transition-all duration-700">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full transform object-cover transition-transform duration-1000 hover:scale-110"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
