"use client";

import { motion } from "framer-motion";
import { cn } from "@lib/utils";
import { Icons } from "@repo/ui";
import { SortOption } from "@/hooks/useProjectFilters";

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  categories: string[];
}

export const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  categories,
}: ProjectFiltersProps) => {
  return (
    <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-md border-b border-foreground/5 py-8 mb-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide w-full lg:w-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                  selectedCategory === category
                    ? "bg-brand-blue text-white"
                    : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            {/* Search */}
            <div className="relative w-full sm:w-80 group">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 group-focus-within:text-brand-blue transition-colors" />
              <input
                type="text"
                placeholder="SEARCH PROJECTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-foreground/5 border-none px-12 py-3 text-[10px] font-bold tracking-widest uppercase placeholder:text-foreground/20 focus:ring-1 focus:ring-brand-blue outline-none transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative w-full sm:w-48 group">
              <Icons.ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 group-hover:text-brand-blue transition-colors rotate-90" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none bg-foreground/5 border-none px-6 py-3 text-[10px] font-bold tracking-widest uppercase focus:ring-1 focus:ring-brand-blue outline-none cursor-pointer transition-all pr-12"
              >
                <option value="newest">NEWEST FIRST</option>
                <option value="oldest">OLDEST FIRST</option>
                <option value="a-z">NAME (A-Z)</option>
                <option value="z-a">NAME (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
