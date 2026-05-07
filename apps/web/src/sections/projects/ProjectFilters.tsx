"use client";

import { cn } from "@lib/utils";
import { Icons } from "@repo/ui";

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

export const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
}: ProjectFiltersProps) => {
  return (
    <div className="bg-background/80 backdrop-blur-md border-b border-foreground/5 py-12 mb-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide w-full lg:w-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap border border-brand-blue",
                  selectedCategory === category
                    ? "bg-brand-blue text-white"
                    : "text-brand-blue hover:bg-brand-blue/60 hover:bg-brand-blue hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            {/* Search */}
            <div className="relative w-full sm:w-80 group">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue group-focus-within:text-brand-blue transition-colors" />
              <input
                type="text"
                placeholder="SEARCH PROJECTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-b-2 border-brand-blue px-12 py-3 text-[10px] font-bold tracking-widest uppercase placeholder:text-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
