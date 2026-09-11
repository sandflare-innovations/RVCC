"use client";

import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icons } from "@/lib/icons";

export interface HomeServiceItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  slug?: string;
  features?: string[];
  category?: string;
}

interface CuratedService {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  features: string[];
}

const PRIORITY_SLUGS = [
  "building-projects",
  "civil",
  "architectural-service",
  "land-development",
  "infrastructure",
  "hardscaping-works",
  "steel-metal-works",
];

export const ServicesSkeleton = () => {
  return (
    <section className="section-padding relative w-full overflow-hidden bg-white" id="services">
      <div className="container mx-auto">
        {/* Section Header Skeleton */}
        <div className="header-margin flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-brand-blue animate-ping" />
              <div className="h-3 w-32 rounded-full bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse" />
            </div>
            <div className="h-20 w-80 bg-gradient-to-r from-brand-blue/20 via-brand-blue/10 to-brand-blue/15 animate-pulse md:h-32" />
          </div>
          <div className="flex flex-col items-start gap-4 lg:max-w-md lg:items-end">
            <div className="h-4 w-72 bg-gradient-to-r from-zinc-200 via-brand-blue/10 to-zinc-200 animate-pulse" />
            <div className="h-4 w-56 bg-zinc-200/80 animate-pulse" />
            <div className="h-12 w-48 border border-brand-blue/30 bg-brand-blue/5 animate-pulse" />
          </div>
        </div>

        {/* Large Screen: 5 Expandable Skeleton Monolith Columns */}
        <div className="hidden md:flex md:flex-col md:gap-6">
          <div className="relative flex h-[620px] w-full gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={cn(
                  "relative h-full overflow-hidden transition-all duration-700",
                  idx === 1
                    ? "flex-[3.5] bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5 border-2 border-brand-blue/30 shadow-lg lg:flex-[4]"
                    : "flex-[1] bg-gradient-to-b from-white to-brand-blue/[0.04] border border-brand-blue/15"
                )}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/10 via-transparent to-white/70 animate-pulse" />

                {idx === 1 ? (
                  <div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-40 rounded-full bg-brand-blue/20 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-brand-blue animate-ping" />
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="h-10 w-3/4 bg-gradient-to-r from-brand-blue/30 via-brand-blue/15 to-brand-blue/25 animate-pulse" />
                      <div className="h-4 w-full max-w-lg bg-zinc-200 animate-pulse" />
                      <div className="h-4 w-2/3 bg-zinc-200/80 animate-pulse" />
                      <div className="mt-2 flex gap-2">
                        <div className="h-6 w-24 border border-brand-blue/20 bg-brand-blue/5" />
                        <div className="h-6 w-28 border border-brand-blue/20 bg-brand-blue/5" />
                      </div>
                      <div className="mt-4 h-12 w-44 border border-brand-blue/40 bg-brand-blue/15 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <span className="text-2xl font-black text-brand-blue/25">
                      {String(idx).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-2">
                      <div className="h-2 w-16 bg-brand-blue/30" />
                      <div className="h-4 w-24 bg-zinc-200 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Navigator Skeleton */}
          <div className="flex items-center justify-between border-t border-brand-blue/15 pt-4">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-16 border border-brand-blue/15 bg-brand-blue/5 animate-pulse" />
              ))}
            </div>
            <div className="h-4 w-20 bg-brand-blue/20 animate-pulse" />
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="flex flex-col gap-6 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden border border-brand-blue/20 bg-white shadow-sm">
              <div className="h-60 w-full bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5 animate-pulse" />
              <div className="flex flex-col gap-3 p-6">
                <div className="h-6 w-48 bg-gradient-to-r from-brand-blue/25 to-brand-blue/10 animate-pulse" />
                <div className="h-4 w-full bg-zinc-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Services = ({
  initialServices,
}: {
  initialServices?: HomeServiceItem[];
}) => {
  const hasServices = !!(initialServices && initialServices.length > 0);

  if (!hasServices) {
    return <ServicesSkeleton />;
  }

  // Total services count across the company
  const totalCount = initialServices.length;

  // Curate top 5 flagship services for the home page showcase
  const featuredServices: CuratedService[] = useMemo(() => {
    const matched: CuratedService[] = [];
    const usedSlugs = new Set<string>();

    // 1. Try to find priority matches
    for (const prioritySlug of PRIORITY_SLUGS) {
      const found = initialServices.find(
        (s) =>
          s.slug === prioritySlug ||
          String(s.id) === prioritySlug ||
          s.title.toLowerCase().includes(prioritySlug.replace("-", " "))
      );

      if (found && !usedSlugs.has(found.slug || String(found.id))) {
        const slug = found.slug || String(found.id);
        usedSlugs.add(slug);

        matched.push({
          id: String(found.id),
          slug,
          title: found.title,
          category:
            found.category ||
            (prioritySlug.includes("building") || prioritySlug.includes("civil")
              ? "Civil & Commercial"
              : prioritySlug.includes("architectural")
              ? "Design & Engineering"
              : prioritySlug.includes("land") || prioritySlug.includes("infrastructure")
              ? "Earthworks & Utilities"
              : prioritySlug.includes("landscape") || prioritySlug.includes("hardscaping")
              ? "Master Landscaping"
              : "Architectural Metals"),
          description:
            found.subtitle ||
            found.description ||
            "Specialized contracting and engineering capability delivering highest standards.",
          image: found.image || "/images/services/civil.webp",
          features:
            found.features || [
              "Turnkey Solutions",
              "Quality Assurance",
              "Precision Execution",
            ],
        });

        if (matched.length >= 5) break;
      }
    }

    // 2. Supplement if we haven't reached 4-5 items
    if (matched.length < 5) {
      for (const s of initialServices) {
        const slug = s.slug || String(s.id);
        if (!usedSlugs.has(slug)) {
          usedSlugs.add(slug);
          matched.push({
            id: String(s.id),
            slug,
            title: s.title,
            category: s.category || "Specialized Discipline",
            description:
              s.subtitle ||
              s.description ||
              "Specialized engineering and construction solutions.",
            image: s.image || "/images/services/civil.webp",
            features:
              s.features || [
                "Quality Assurance",
                "Advanced Engineering",
              ],
          });
          if (matched.length >= 5) break;
        }
      }
    }

    return matched;
  }, [initialServices]);

  const [activeId, setActiveId] = useState<string>(featuredServices[0]?.id || "");

  const activeIndex = Math.max(
    0,
    featuredServices.findIndex((s) => s.id === activeId)
  );
  const currentActive = featuredServices[activeIndex] || featuredServices[0];
  const effectiveActiveId = currentActive?.id;

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + featuredServices.length) % featuredServices.length;
    setActiveId(featuredServices[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % featuredServices.length;
    setActiveId(featuredServices[nextIndex].id);
  };

  return (
    <section
      className="section-padding relative w-full overflow-hidden bg-zinc-100"
      id="services"
    >
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="header-margin flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <span className="bg-brand-blue h-2 w-2" />
              <span className="text-brand-blue text-xs font-bold tracking-[0.4em] uppercase">
                Core Disciplines
              </span>
              <span className="text-zinc-400 text-xs tracking-widest">•</span>
              <span className="text-zinc-500 text-xs font-medium tracking-widest uppercase">
                Featured Capabilities
              </span>
            </div>
            <h2 className="text-brand-blue font-primary text-[4.5rem] leading-[0.75] font-normal tracking-tighter uppercase md:text-[7rem] lg:text-[8rem]">
              Our <br className="hidden lg:block" /> Services
            </h2>
          </div>

          <div className="flex flex-col items-start gap-6 lg:max-w-md lg:items-end">
            <p className="text-sm leading-relaxed text-zinc-600 md:text-base lg:text-right">
              Delivering excellence across major construction sectors in Saudi Arabia. Explore our
              curated flagship disciplines or browse the complete portfolio.
            </p>
            <div>
              <Button
                variant="brand-outline"
                href="/services"
                className="w-full md:w-auto"
              >
                VIEW ALL SERVICES ({totalCount})
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Large Screen: Interactive Architectural Expandable Showcase */}
        <div className="hidden md:flex md:flex-col md:gap-6">
          <div className="relative flex h-[620px] w-full gap-3 overflow-hidden">
            {featuredServices.map((service, index) => {
              const isActive = service.id === effectiveActiveId;
              const formattedIndex = String(index + 1).padStart(2, "0");

              return (
                <motion.div
                  key={service.id}
                  layout
                  transition={{
                    layout: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  }}
                  onMouseEnter={() => setActiveId(service.id)}
                  onClick={() => setActiveId(service.id)}
                  className={cn(
                    "group relative h-full cursor-pointer overflow-hidden border border-black/10 transition-all duration-700",
                    isActive
                      ? "flex-[3.5] bg-zinc-950 shadow-2xl lg:flex-[4]"
                      : "flex-[1] bg-zinc-900 hover:border-brand-blue/60"
                  )}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 h-full w-full">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className={cn(
                        "object-cover transition-all duration-1000",
                        isActive
                          ? "scale-105 brightness-90 filter-none"
                          : "scale-100 brightness-[0.4] grayscale-[40%] group-hover:brightness-[0.6] group-hover:grayscale-0"
                      )}
                      sizes="(max-width: 1200px) 50vw, 70vw"
                      priority={index === 0}
                    />
                    {/* Dark Dramatic Gradient Scrim */}
                    <div
                      className={cn(
                        "absolute inset-0 transition-opacity duration-700",
                        isActive
                          ? "bg-gradient-to-t from-black/95 via-black/50 to-black/20"
                          : "bg-black/50 group-hover:bg-black/30"
                      )}
                    />
                  </div>

                  {/* ACTIVE CARD CONTENT */}
                  {isActive ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.15 }}
                      className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-12"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-brand-blue text-white px-3 py-1 text-[11px] font-bold tracking-[0.25em] uppercase">
                            {formattedIndex} // CORE CAPABILITY
                          </span>
                          <span className="text-white/70 text-xs font-semibold tracking-wider uppercase">
                            {service.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 animate-ping rounded-full bg-brand-blue" />
                          <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                            ACTIVE
                          </span>
                        </div>
                      </div>

                      {/* Bottom Info Block */}
                      <div className="flex flex-col gap-5">
                        <div>
                          <h3 className="text-brand-white font-primary text-3xl font-bold uppercase tracking-tight md:text-4xl lg:text-5xl">
                            {service.title}
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 lg:text-base">
                            {service.description}
                          </p>
                        </div>

                        {/* Feature Badges */}
                        {service.features && service.features.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {service.features.map((feature, fIdx) => (
                              <span
                                key={fIdx}
                                className="border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA Link */}
                        <div className="pt-3">
                          <Link
                            href={`/services/${service.slug}`}
                            className="group/btn inline-flex items-center gap-4 bg-brand-blue px-7 py-4 text-xs font-bold tracking-[0.25em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-brand-blue"
                          >
                            <span>Explore Service</span>
                            <Icons.ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* INACTIVE CARD CONTENT */
                    <div className="relative z-10 flex h-full flex-col justify-between p-6">
                      {/* Monolithic Number */}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black tracking-tight text-white/40 transition-colors duration-300 group-hover:text-white">
                          {formattedIndex}
                        </span>
                        <Icons.ArrowRight className="h-4 w-4 -rotate-45 text-white/30 transition-all duration-300 group-hover:rotate-0 group-hover:text-brand-blue" />
                      </div>

                      {/* Vertical/Bottom Title */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-blue uppercase">
                          {service.category}
                        </span>
                        <h4 className="text-base font-bold text-white uppercase line-clamp-2 transition-colors duration-300 group-hover:text-brand-blue">
                          {service.title}
                        </h4>
                      </div>
                    </div>
                  )}

                  {/* Active Indicator Accent Line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className="bg-brand-blue absolute bottom-0 left-0 right-0 h-1"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Navigator Strip */}
          <div className="flex items-center justify-between border-t border-black/10 pt-4">
            {/* Step Selector Pills */}
            <div className="flex items-center gap-3">
              {featuredServices.map((service, idx) => {
                const isActive = service.id === effectiveActiveId;
                return (
                  <button
                    key={service.id}
                    onClick={() => setActiveId(service.id)}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all",
                      isActive
                        ? "bg-brand-blue text-white shadow-sm"
                        : "bg-white text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                    <span className="hidden lg:inline uppercase">{service.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(featuredServices.length).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-zinc-700 transition-colors hover:bg-brand-blue hover:text-white"
                  aria-label="Previous service"
                >
                  <Icons.ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-zinc-700 transition-colors hover:bg-brand-blue hover:text-white"
                  aria-label="Next service"
                >
                  <Icons.ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout: Responsive Flagship Cards */}
        <div className="flex flex-col gap-6 md:hidden">
          {featuredServices.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="group overflow-hidden border border-black/10 bg-white shadow-sm"
            >
              <div className="relative h-60 w-full overflow-hidden bg-zinc-900">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-blue px-2.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                    {String(idx + 1).padStart(2, "0")} // {service.category}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-brand-blue font-primary text-2xl font-bold uppercase">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    {service.description}
                  </p>
                </div>
                {service.features && service.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {service.features.map((f, i) => (
                      <span
                        key={i}
                        className="bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center gap-2 pt-2 text-xs font-bold tracking-widest text-brand-blue uppercase hover:underline"
                >
                  <span>Explore Service</span>
                  <Icons.ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}

          <div className="mt-4">
            <Button
              variant="brand-outline"
              href="/services"
              className="w-full"
            >
              VIEW ALL SERVICES ({totalCount})
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

