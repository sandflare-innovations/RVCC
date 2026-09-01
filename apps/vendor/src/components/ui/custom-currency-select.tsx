"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

export function CustomCurrencySelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = CURRENCY_OPTIONS.find((c) => c.code === value) ?? {
    code: value,
    name: value,
    symbol: "",
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex h-full items-center justify-between gap-2 rounded-l-2xl border-r border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm font-bold text-zinc-800 transition-colors select-none ${
          disabled
            ? "cursor-not-allowed opacity-70"
            : "hover:bg-zinc-100/80 active:bg-zinc-200/60"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-bold text-zinc-950">{selected.code}</span>
        {selected.symbol && (
          <span className="text-xs text-zinc-400 font-semibold">{selected.symbol}</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180 text-brand-blue" : ""
          }`}
        />
      </button>

      {/* Floating Custom Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-[170px] origin-top-left rounded-2xl bg-white p-1.5 shadow-[0_10px_32px_rgba(15,23,42,0.14)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Select Currency
          </div>
          <div className="space-y-0.5" role="listbox">
            {CURRENCY_OPTIONS.map((item) => {
              const isSelected = item.code === value;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(item.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors text-left ${
                    isSelected
                      ? "bg-brand-blue/10 text-brand-blue"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950">{item.code}</span>
                    <span className="text-[11px] font-normal text-zinc-500">({item.name})</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-brand-blue shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
