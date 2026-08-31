"use client";

import { useState, useRef, useEffect } from "react";
import { LuCheck as Check, LuChevronDown as ChevronDown, LuSearch as Search } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@lib/utils";

interface Option {
  value: string;
  label: string;
  flag?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className,
  showSearch = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative w-full peer", className)} ref={ref} data-empty={!value}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[52px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-50 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption && (
            <>
              {selectedOption.flag && <span className={cn(selectedOption.flag, "text-xl")} />}
              <span>{selectedOption.label}</span>
            </>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
          >
            {showSearch && (
              <div className="flex items-center border-b border-zinc-100 px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-400"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
            <ul className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <li className="py-6 text-center text-sm text-zinc-500">No results found.</li>
              ) : (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-zinc-100",
                      value === opt.value ? "bg-zinc-50 font-medium text-brand-blue" : "text-zinc-900"
                    )}
                  >
                    {value === opt.value && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <span className="flex items-center gap-2 truncate">
                      {opt.flag && <span className={cn(opt.flag, "text-xl")} />}
                      {opt.label}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
