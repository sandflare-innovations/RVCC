"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | CustomSelectOption)[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className,
  buttonClassName,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to CustomSelectOption objects
  const normalizedOptions: CustomSelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-900 shadow-2xs transition-all",
          "hover:border-zinc-300 hover:bg-white focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10",
          open && "border-[#0073bc] bg-white ring-2 ring-[#0073bc]/10",
          disabled && "cursor-not-allowed opacity-50",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={cn("truncate", !selectedOption && "text-zinc-400 font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0073bc]">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
            open && "rotate-180 text-[#0073bc]"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1.5 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md focus:outline-hidden"
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-blue-50/80 font-bold text-[#0073bc]"
                      : "text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-950"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-600">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="truncate text-[11px] text-zinc-400 font-normal">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#0073bc]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
