"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomDatePickerProps {
  value: string; // ISO format "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
  minDate?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CustomDatePicker({
  value,
  onChange,
  className,
  minDate,
  placeholder = "Select date",
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or default to current date
  const parsedDate = value ? new Date(value) : new Date();
  const validParsed = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

  const [viewYear, setViewYear] = useState(validParsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(validParsed.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split("-").map(Number);
    return y === viewYear && m === viewMonth + 1 && d === day;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isPast = (day: number) => {
    if (!minDate) return false;
    const current = new Date(viewYear, viewMonth, day);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return current < min;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-[#0073bc]/40 hover:bg-zinc-50/50 focus:border-[#0073bc] focus:outline-none cursor-pointer",
          isOpen && "border-[#0073bc] ring-2 ring-[#0073bc]/10 bg-white"
        )}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="h-4 w-4 text-[#0073bc] shrink-0" />
          <span className={value ? "text-zinc-900 font-semibold" : "text-zinc-400"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-64 rounded-2xl border border-zinc-100/90 bg-white p-3 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18),0_2px_6px_rgba(15,23,42,0.04)] ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-zinc-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[10px] font-bold text-zinc-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);
              const disabled = isPast(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-xl text-xs transition-all cursor-pointer",
                    disabled && "text-zinc-300 cursor-not-allowed hover:bg-transparent",
                    !disabled && !selected && "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 font-medium",
                    today && !selected && "font-bold text-[#0073bc] bg-[#0073bc]/5",
                    selected && "bg-[#0073bc] text-white font-bold shadow-xs hover:bg-[#005f9e]"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                onChange(today);
                setIsOpen(false);
              }}
              className="font-semibold text-[#0073bc] hover:underline cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
                onChange(twoWeeks);
                setIsOpen(false);
              }}
              className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              +2 Weeks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
