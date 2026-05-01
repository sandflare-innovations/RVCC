"use client";

import Image from "next/image";

import { NEWS_DATA } from "@data/home/news";
import { motion } from "framer-motion";
import { FiArrowRight, FiMail } from "react-icons/fi";

import { Button } from "@/components/ui/Button";

export const NewsAndEvents = () => {
  return (
    <section className="section-padding bg-zinc-50 overflow-hidden" id="news">
      <div className="container mx-auto">
        {/* Consistent Section Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          className="header-margin gap-element-gap flex flex-col items-center justify-between text-center md:flex-row md:items-end md:text-left"
        >
          <div className="flex-1">
            <h2 className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase md:text-[8rem]">
              News &<br /> Events
            </h2>
          </div>
          <div className="hidden flex-col items-end justify-end md:flex">
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500 md:pb-4">
              Stay connected with the latest milestones and community initiatives from the heart of
              Riyadh's construction landscape.
            </p>
            <Button
              borderColor="border-brand-blue"
              textColor="text-brand-blue"
              bgColor="bg-transparent"
              hoverFillColor="bg-brand-blue"
              hoverTextColor="group-hover:text-background"
              className="w-full md:w-auto"
            >
              VIEW ALL
            </Button>
          </div>
        </motion.div>

        {/* Mobile Carousel / Desktop Grid */}
        <div className="scroll-hide gap-4 flex flex-row items-stretch justify-start snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:grid md:grid-cols-3 md:gap-content-gap md:overflow-visible">
          {NEWS_DATA.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: 0 }}
              className="group hover:border-brand-blue/20 relative flex w-[80vw] flex-shrink-0 snap-center flex-col border border-black/5 bg-white p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,115,188,0.05)] md:w-auto md:flex-shrink"
            >
              {/* Newsletter Header Card */}
              <div className="mb-content-gap flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex flex-col">
                  <span className="text-brand-blue text-[9px] font-black tracking-widest uppercase">
                    {item.category}
                  </span>
                  <span className="text-[8px] font-medium text-zinc-400">{item.edition}</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-300">#{item.id}</div>
              </div>

              {/* Image */}
              <div className="mb-content-gap relative aspect-video overflow-hidden transition-all duration-700">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col space-y-4">
                <span className="text-[10px] font-medium text-zinc-400">{item.date}</span>
                <h3 className="group-hover:text-brand-blue text-2xl leading-tight font-normal text-black transition-colors">
                  {item.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">{item.excerpt}</p>
                <div className="mt-auto pt-6">
                  <button className="text-brand-blue flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all hover:gap-4">
                    READ FULL STORY <FiArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Newsletter Corner Decor */}
              <div className="absolute top-0 right-0 h-12 w-12 overflow-hidden">
                <div className="absolute top-0 right-0 h-[1px] w-8 translate-x-3 translate-y-3 rotate-45 bg-zinc-200" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-12 flex justify-center md:hidden">
          <Button
            borderColor="border-brand-blue"
            textColor="text-brand-blue"
            bgColor="bg-transparent"
            hoverFillColor="bg-brand-blue"
            hoverTextColor="group-hover:text-background"
            className="h-14 w-full"
          >
            VIEW ALL
          </Button>
        </div>
      </div>
    </section>
  );
};
