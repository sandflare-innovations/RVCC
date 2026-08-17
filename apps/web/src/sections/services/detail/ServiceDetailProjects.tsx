"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineArrowRight } from "react-icons/hi2";

import { GALLARY_PROJECTS } from "@/data/gallary";
import { Service } from "@/data/services";

interface ServiceDetailProjectsProps {
  service: Service;
}

export const ServiceDetailProjects = ({ service }: ServiceDetailProjectsProps) => {
  // Get linked projects
  const relatedProjects = GALLARY_PROJECTS.filter((p) => service.projectIds.includes(p.id));

  // Flatten images from projects
  const allImages = relatedProjects.flatMap((p) => p.images);
  // Take only 3 images for the vertical sidebar
  const displayImages = allImages.slice(0, 3);

  const [activeImage, setActiveImage] = useState<string | null>(displayImages[0] || null);

  if (relatedProjects.length === 0) return null;

  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container">
        <div className="mb-20 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center space-x-3">
            <div className="bg-brand-blue h-1.5 w-1.5" />
            <span className="text-brand-blue text-[10px] font-bold tracking-[0.5em] uppercase">
              PORTFOLIO
            </span>
          </div>
          <h2 className="font-heading max-w-4xl text-4xl leading-[3rem] md:text-5xl lg:text-7xl">
            Realized projects <br />
            in this field
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left: Large Preview Area */}
          <div className="relative lg:col-span-8">
            <div className="relative h-[400px] w-full overflow-hidden bg-black md:h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeImage || displayImages[0]}
                    alt="Active Project Preview"
                    fill
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Small Thumbnails Vertical Stack */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-4">
              {displayImages.map((img, index) => {
                const isLast = index === displayImages.length - 1;

                return (
                  <motion.div
                    key={index}
                    onMouseEnter={() => setActiveImage(img)}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`group relative h-[190px] cursor-pointer overflow-hidden border-2 transition-all duration-300 ${
                      activeImage === img
                        ? "border-brand-blue"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Project thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {isLast ? (
                      <Link
                        href={`/gallary?service=${service?.slug || ""}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center transition-opacity hover:bg-black/70"
                      >
                        <div className="flex items-center justify-center gap-3 border border-white px-8 py-3 text-white">
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                            VIEW MORE
                          </span>
                          <HiOutlineArrowRight className="h-5 w-5" />
                        </div>
                      </Link>
                    ) : (
                      activeImage === img && <div className="bg-brand-blue/10 absolute inset-0" />
                    )}
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
