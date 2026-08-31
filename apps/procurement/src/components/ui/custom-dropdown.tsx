"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon,
  className,
  compact = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 border border-zinc-200 bg-white text-zinc-700 transition-all hover:border-[#0073bc]/40 hover:bg-zinc-50/50 focus:border-[#0073bc] focus:outline-none cursor-pointer whitespace-nowrap",
          compact
            ? "rounded-xl px-2.5 py-1.5 text-xs font-normal shadow-2xs"
            : "rounded-2xl px-3.5 py-2 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
          isOpen && "border-[#0073bc] ring-2 ring-[#0073bc]/10 bg-white"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200",
            isOpen && "transform rotate-180 text-[#0073bc]"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 z-50 mt-1 min-w-[150px] w-full rounded-2xl border border-zinc-100/90 bg-white p-1 shadow-[0_10px_25px_-8px_rgba(15,23,42,0.15)] ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100"
          )}
        >
          <div className="max-h-40 overflow-y-auto no-scrollbar py-0.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#0073bc]/10 text-[#0073bc] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 font-normal"
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {option.icon && <span>{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-[#0073bc] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
