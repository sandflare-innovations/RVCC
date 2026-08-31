"use client";

import { cn } from "@lib/utils";

import { Icons } from "@/lib/icons";

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
    <div className="bg-background/80 border-foreground/5 mb-10 border-b py-12 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <div className="flex flex-col-reverse items-center justify-between gap-8 lg:flex-row">
          {/* Categories */}
          <div className="scrollbar-hide flex w-full items-center gap-2 overflow-x-auto pb-4 lg:w-auto lg:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "border-brand-blue border px-6 py-2 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all duration-300",
                  selectedCategory === category
                    ? "bg-brand-blue text-white"
                    : "text-brand-blue hover:bg-brand-blue/60 hover:bg-brand-blue hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
            {/* Search */}
            <div className="group relative w-full sm:w-80">
              <Icons.Search className="text-brand-blue group-focus-within:text-brand-blue absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH PROJECTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-brand-blue placeholder:text-brand-blue focus:ring-brand-blue w-full border-b-2 px-12 py-3 text-[10px] font-bold tracking-widest uppercase transition-all outline-none focus:ring-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
