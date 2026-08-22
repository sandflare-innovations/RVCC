"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const SEARCH_TERMS = ["RFQ ID", "Project Name", "Reference Number", "Category"];

export function VendorHeroSearch() {
  const [value, setValue] = useState("");
  const [termIndex, setTermIndex] = useState(0);

  const terms =
    SEARCH_TERMS.length <= 2 ? [...SEARCH_TERMS, ...SEARCH_TERMS] : SEARCH_TERMS;

  useEffect(() => {
    const interval = setInterval(() => {
      setTermIndex((prev) => (prev + 1) % terms.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [terms.length]);

  return (
    <div className="relative h-14 w-full">
      <Search className="absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-y-0 right-5 left-12 z-10 flex items-center overflow-hidden">
        <span
          className={`shrink-0 text-lg text-zinc-400 transition-opacity duration-300 ${
            value ? "opacity-0" : "opacity-100"
          }`}
        >
          Search by&nbsp;
        </span>
        <div className="relative h-full min-w-0 flex-1">
          {terms.map((term, idx) => {
            const isActive = idx === termIndex;
            const isPrevious =
              idx === (termIndex - 1 + terms.length) % terms.length;

            return (
              <span
                key={`${term}-${idx}`}
                className={`absolute left-0 top-1/2 -mt-[14px] text-lg text-zinc-400 transition-all duration-500 ease-in-out ${
                  value
                    ? "opacity-0"
                    : isActive
                      ? "translate-y-0 opacity-100"
                      : isPrevious
                        ? "-translate-y-4 opacity-0"
                        : "translate-y-4 opacity-0"
                }`}
              >
                {term}
              </span>
            );
          })}
        </div>
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search vendor portal"
        className="h-14 w-full rounded-full border-none bg-white pr-5 pl-12 text-lg text-zinc-900 shadow-lg outline-none transition-all focus:ring-2 focus:ring-white"
      />
    </div>
  );
}
