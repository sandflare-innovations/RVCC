"use client";

import Image from "next/image";

import { NEWS_DATA } from "@data/home/news";
import { motion } from "framer-motion";
import { FiArrowRight, FiMail } from "react-icons/fi";

import { Button } from "@/components/ui/Button";

export const NewsAndEvents = () => {
  return (
    <section className="section-padding bg-zinc-50" id="news">
      <div className="container mx-auto px-4 md:px-8">
        {/* Consistent Section Header */}
        <div className="header-margin flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase md:text-[8rem]"
            >
              News &<br /> Events
            </motion.h2>
          </div>
          <div className="header-margin gap-content-gap flex flex-col items-start md:items-end md:pb-4">
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500 md:text-right">
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
        </div>

        {/* Newsletter Style Grid */}
        <div className="gap-content-gap grid grid-cols-1 md:grid-cols-3">
          {NEWS_DATA.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group hover:border-brand-blue/20 relative flex flex-col border border-black/5 bg-white p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,115,188,0.05)]"
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
              <div className="mb-content-gap relative aspect-video overflow-hidden grayscale transition-all duration-700 group-hover:grayscale-0">
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
      </div>
    </section>
  );
};
