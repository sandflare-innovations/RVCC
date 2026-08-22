"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export interface AnimatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholders: string[];
  ariaLabel?: string;
}

export function AnimatedSearchInput({ value, onChange, placeholders: rawPlaceholders, ariaLabel = "Search" }: AnimatedSearchInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders = rawPlaceholders.length <= 2 
    ? [...rawPlaceholders, ...rawPlaceholders] 
    : rawPlaceholders;

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue z-10" />
      
      <div className="pointer-events-none absolute left-11 top-0 bottom-0 right-4 flex items-center overflow-hidden z-10">
        <span className={`text-brand-blue/70 text-sm transition-opacity duration-300 ${value ? "opacity-0" : "opacity-100"}`}>
          Search by&nbsp;
        </span>
        <div className="relative h-full flex-1">
          {placeholders.map((text, idx) => {
            const isActive = idx === placeholderIndex;
            const isPrev = idx === (placeholderIndex - 1 + placeholders.length) % placeholders.length;
            return (
              <span
                key={`${text}-${idx}`}
                className={`absolute left-0 top-1/2 -mt-[10px] text-brand-blue/70 text-sm transition-all duration-500 ease-in-out ${
                  value
                    ? "opacity-0"
                    : isActive
                    ? "opacity-100 translate-y-0"
                    : isPrev
                    ? "opacity-0 -translate-y-4"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {text}
              </span>
            );
          })}
        </div>
      </div>

      <input
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        maxLength={120}
        className="focus-visible:ring-brand-blue/25 w-full rounded-full border border-brand-blue bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus-visible:ring-[3px] transition-shadow text-brand-blue"
      />
    </div>
  );
}
