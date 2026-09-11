"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LuArrowUpRight as ArrowUpRight,
  LuCalendar as Calendar,
  LuLayers as Layers,
  LuSearch as Search,
} from "react-icons/lu";

import type { WebNewsItem } from "@/lib/content/news";

interface NewsListClientProps {
  initialNews: WebNewsItem[];
}

export function NewsListClient({ initialNews }: NewsListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialNews.forEach((item) => {
      if (item.category) cats.add(item.category.toUpperCase());
    });
    return ["ALL", ...Array.from(cats)];
  }, [initialNews]);

  // Filter items
  const filteredNews = useMemo(() => {
    return initialNews.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        item.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialNews, selectedCategory, searchQuery]);

  return (
    <div className="w-full">
      {/* Filter & Search Bar */}
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 rounded-full ${
                  isActive
                    ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search news & updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-400 transition-colors focus:border-brand-blue focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <Layers size={24} />
          </div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-zinc-900">
            No articles found
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Try adjusting your category filter or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50"
            >
              <Link href={`/news/${item.slug}`} className="flex h-full flex-col">
                {/* Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  {/* Category Pill Over Image */}
                  <span className="absolute top-4 left-4 rounded-md bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-wider text-brand-blue uppercase shadow-sm">
                    {item.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Meta */}
                  <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-zinc-400" />
                      {item.date}
                    </span>
                    {item.edition && (
                      <span className="font-mono text-[11px] uppercase text-zinc-400">
                        {item.edition}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-heading mb-3 line-clamp-2 text-lg font-bold tracking-tight text-zinc-900 group-hover:text-brand-blue transition-colors">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-600">
                    {item.excerpt}
                  </p>

                  {/* Read More Link */}
                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-100 text-xs font-bold tracking-wider text-zinc-900 uppercase group-hover:text-brand-blue">
                    Read Story
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
