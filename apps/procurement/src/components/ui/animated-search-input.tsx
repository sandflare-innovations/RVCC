"use client";

import { Search } from "lucide-react";
import React, { useEffect,useState } from "react";

export interface AnimatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholders: string[];
  ariaLabel?: string;
}

export function AnimatedSearchInput({
  value,
  onChange,
  placeholders: rawPlaceholders,
  ariaLabel = "Search",
}: AnimatedSearchInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders =
    rawPlaceholders.length <= 2 ? [...rawPlaceholders, ...rawPlaceholders] : rawPlaceholders;

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 text-[#0073bc]" />

      <div className="pointer-events-none absolute top-0 right-4 bottom-0 left-11 z-10 flex items-center overflow-hidden">
        <span
          className={`text-sm text-[#0073bc]/70 transition-opacity duration-300 ${
            value ? "opacity-0" : "opacity-100"
          }`}
        >
          Search by&nbsp;
        </span>
        <div className="relative h-full flex-1">
          {placeholders.map((text, idx) => {
            const isActive = idx === placeholderIndex;
            const isPrev =
              idx === (placeholderIndex - 1 + placeholders.length) % placeholders.length;
            return (
              <span
                key={`${text}-${idx}`}
                className={`absolute top-1/2 left-0 -mt-[10px] text-sm text-[#0073bc]/70 transition-all duration-500 ease-in-out ${
                  value
                    ? "opacity-0"
                    : isActive
                      ? "translate-y-0 opacity-100"
                      : isPrev
                        ? "-translate-y-4 opacity-0"
                        : "translate-y-4 opacity-0"
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
        className="w-full rounded-full border border-[#0073bc] bg-white py-2.5 pr-4 pl-11 text-sm text-[#0073bc] transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-[#0073bc]/25"
      />
    </div>
  );
}
