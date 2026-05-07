import { useState, useMemo } from "react";
import { PROJECTS, DetailedProject } from "@/data/projects/detailed";

export type SortOption = "newest" | "oldest" | "a-z" | "z-a";

export const useProjectFilters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const categories = useMemo(() => {
    const cats = new Set(PROJECTS.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...PROJECTS];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query)
      );
    }

    // Category Filter
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return parseInt(b.year) - parseInt(a.year);
        case "oldest":
          return parseInt(a.year) - parseInt(b.year);
        case "a-z":
          return a.title.localeCompare(b.title);
        case "z-a":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
    projects: filteredAndSortedProjects,
  };
};
