"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import { FiArrowRight, FiMail } from "react-icons/fi";

import { Button } from "@/components/ui/Button";

const NEWS_DATA = [
  {
    id: "01",
    title: "Community Landmark: The Lakes Park Project",
    date: "April 15, 2024",
    excerpt:
      "A new standard for urban recreation. Our latest community project at Lakes Park reflects our commitment to sustainable public spaces.",
    image: "/images/news/lakes-park.png",
    category: "COMMUNITY DEVELOPMENT",
    edition: "Vol. 24 / Issue 02",
  },
  {
    id: "02",
    title: "Supportive Spirit: RVCC Cricket Auction",
    date: "April 10, 2024",
    excerpt:
      "Empowering local sports through community-driven initiatives. The annual cricket auction continues to foster athletic talent in the region.",
    image: "/images/news/cricket-auction.png",
    category: "SPORTS ENGAGEMENT",
    edition: "Vol. 24 / Issue 01",
  },
  {
    id: "03",
    title: "Athletic Excellence: Riyadh Football Cup",
    date: "March 20, 2024",
    excerpt:
      "Celebrating teamwork and precision. Our sponsorship of the local football championship highlights our dedication to youth empowerment.",
    image: "/images/news/football-match.png",
    category: "SPORTS SPONSORSHIP",
    edition: "Vol. 24 / Issue 03",
  },
];

export const NewsAndEvents = () => {
  return (
    <section className="bg-zinc-50 py-32 md:py-48" id="news">
      <div className="container mx-auto px-4 md:px-8">
        {/* Consistent Section Header */}
        <div className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-brand-blue font-primary text-[5rem] leading-[0.8] font-normal tracking-tighter uppercase md:text-[8rem]"
            >
              News &<br /> Events
            </motion.h2>
          </div>
          <div className="flex flex-1 flex-col items-start gap-6 md:items-end md:pb-4">
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500 md:text-right">
              Stay connected with the latest milestones and community initiatives from the heart of
              Riyadh's construction landscape.
            </p>
            <Button variant="brand-outline" className="w-full md:w-auto">
              VIEW ALL
            </Button>
          </div>
        </div>

        {/* Newsletter Style Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
              <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex flex-col">
                  <span className="text-brand-blue text-[9px] font-black tracking-widest uppercase">
                    {item.category}
                  </span>
                  <span className="text-[8px] font-medium text-zinc-400">{item.edition}</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-300">#{item.id}</div>
              </div>

              {/* Image */}
              <div className="relative mb-6 aspect-video overflow-hidden grayscale transition-all duration-700 group-hover:grayscale-0">
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
