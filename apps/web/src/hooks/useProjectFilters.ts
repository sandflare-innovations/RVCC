import { useMemo, useState } from "react";

import { PROJECTS as DEFAULT_PROJECTS, DetailedProject } from "../data/projects/detailed";

export const useProjectFilters = (initialProjects?: DetailedProject[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const sourceProjects = initialProjects && initialProjects.length > 0 ? initialProjects : DEFAULT_PROJECTS;

  const categories = useMemo(() => {
    const cats = new Set(sourceProjects.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [sourceProjects]);

  const filteredProjects = useMemo(() => {
    const allProjects = sourceProjects || [];
    let result = [...allProjects];

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

    return result;
  }, [searchQuery, selectedCategory]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    projects: filteredProjects,
  };
};
