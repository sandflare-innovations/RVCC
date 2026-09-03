"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { GALLARY_PROJECTS as STATIC_GALLERY, GallaryProject } from "@/data/gallary";
import { services } from "@/data/services";
import { Icons } from "@/lib/icons";

export const GallaryCollections = ({
  initialCollections,
}: {
  initialCollections?: GallaryProject[];
}) => {
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service");

  const gallerySource =
    initialCollections && initialCollections.length > 0 ? initialCollections : STATIC_GALLERY;

  const [viewMode, setViewMode] = useState<"projects" | "services">(
    initialService ? "services" : "projects"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Prepare Service-based collections
  const serviceCollections = services
    .map((service) => {
      const relatedProjects = gallerySource.filter((p) => p.serviceSlugs.includes(service.slug));
      const allImages = relatedProjects.flatMap((p) => p.images);

      return {
        id: `service-${service.id}`,
        slug: service.slug,
        title: service.title,
        thumbnail: allImages[0] || service.image,
        images: allImages,
        href: `/gallary/${service.slug}`,
        type: "service",
      };
    })
    .filter((s) => s.images.length > 0);

  // Prepare Project-based collections
  const projectCollections = gallerySource.map((p) => ({
    id: `project-${p.id}`,
    slug: p.slug,
    title: p.title,
    thumbnail: p.thumbnail,
    images: p.images,
    href: `/gallary/${p.slug}`,
    type: "project",
  }));

  // Determine active list
  const activeList = viewMode === "projects" ? projectCollections : serviceCollections;

  // Final filtered list based on search
  const filteredList = activeList.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        {/* Enhanced Control Bar */}
        <div className="mb-20">
          <div className="flex flex-col items-center justify-between gap-8 border-b border-zinc-100 lg:flex-row">
            {/* Left: Custom View Toggle Dropdown */}
            <div className="border-brand-blue relative flex w-full items-center justify-center rounded-sm border lg:w-auto lg:justify-start">
              <span className="bg-brand-blue shrink-0 rounded-r-sm p-3 text-[10px] font-bold tracking-[0.4em] text-white uppercase">
                List by
              </span>

              <div className="relative min-w-[180px]">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-brand-blue flex w-full items-center justify-between px-10 py-4 text-[10px] font-bold tracking-[0.25em] uppercase outline-none"
                >
                  <span>{viewMode}</span>
                  <Icons.ChevronRight
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${isDropdownOpen ? "-rotate-90" : "rotate-90"}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="border-brand-blue/20 absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-sm border bg-white shadow-2xl"
                    >
                      {[
                        { id: "projects", label: "Projects" },
                        { id: "services", label: "Services" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setViewMode(option.id as "projects" | "services");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-10 py-4 text-left text-[10px] font-bold tracking-[0.25em] uppercase transition-colors ${
                            viewMode === option.id
                              ? "bg-brand-blue text-white"
                              : "hover:text-brand-blue text-zinc-500 hover:bg-zinc-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Search Input */}
            <div className="group border-brand-blue relative w-full rounded-sm border lg:w-[400px]">
              <div className="bg-brand-blue/30 group-focus-within:bg-brand-blue absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 transition-all duration-300 group-focus-within:h-8" />
              <input
                type="text"
                placeholder={`Search ${viewMode}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-brand-blue placeholder:text-brand-blue w-full bg-transparent py-4 pr-12 pl-10 text-[10px] font-bold tracking-[0.25em] uppercase transition-all outline-none"
              />
              <Icons.Search className="text-brand-blue absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 transition-colors" />
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 gap-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredList.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link href={item.href} className="group block cursor-pointer">
                  <div className="hover:border-brand-blue/20 border border-transparent bg-white p-6 shadow-sm transition-all duration-500 group-hover:shadow-2xl">
                    {/* Multi-Image Stack Design */}
                    <div className="mb-8 space-y-3">
                      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>

                      {/* Secondary Thumbnails */}
                      <div className="grid grid-cols-3 gap-3">
                        {item.images.slice(1, 4).map((img, i) => (
                          <div
                            key={i}
                            className="relative aspect-square overflow-hidden bg-zinc-100"
                          >
                            <Image
                              src={img}
                              alt={`${item.title} preview ${i}`}
                              fill
                              className="object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                              sizes="10vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-4">
                        <h3 className="group-hover:text-brand-blue font-heading truncate text-2xl tracking-tighter text-black uppercase transition-colors duration-300 md:text-3xl">
                          {item.title}
                        </h3>
                      </div>
                      <div className="group-hover:bg-brand-blue shrink-0 bg-zinc-100 p-3 transition-colors group-hover:text-white">
                        <Icons.ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredList.length === 0 && (
            <div className="col-span-full py-32 text-center">
              <p className="text-xl font-light text-zinc-400 italic">
                No matching collections found in {viewMode}.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
