"use client";

import { Check,ChevronDown } from "lucide-react";
import React, { useEffect,useRef, useState } from "react";

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
          "flex w-full cursor-pointer items-center justify-between gap-2 border border-zinc-200 bg-white whitespace-nowrap text-zinc-700 transition-all hover:border-[#0073bc]/40 hover:bg-zinc-50/50 focus:border-[#0073bc] focus:outline-none",
          compact
            ? "rounded-xl px-2.5 py-1.5 text-xs font-normal shadow-2xs"
            : "rounded-2xl px-3.5 py-2 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
          isOpen && "border-[#0073bc] bg-white ring-2 ring-[#0073bc]/10"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200",
            isOpen && "rotate-180 transform text-[#0073bc]"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "animate-in fade-in-0 zoom-in-95 absolute left-0 z-50 mt-1 w-full min-w-[150px] rounded-2xl border border-zinc-100/90 bg-white p-1 shadow-[0_10px_25px_-8px_rgba(15,23,42,0.15)] ring-1 ring-black/5 duration-100"
          )}
        >
          <div className="no-scrollbar max-h-40 space-y-0.5 overflow-y-auto py-0.5">
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
                    "flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-[#0073bc]/10 font-semibold text-[#0073bc]"
                      : "font-normal text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {option.icon && <span>{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 shrink-0 text-[#0073bc]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
