"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: "today" | string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// MiniSelect removed as per user request to simplify header

export function DatePicker({ value, onChange, placeholder = "Select date...", className, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsedDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());

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

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const selectDate = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const displayValue = value
    ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  let minDateObj: Date | null = null;
  if (minDate) {
    if (minDate === "today") {
      minDateObj = new Date();
      minDateObj.setHours(0, 0, 0, 0);
    } else {
      const [y, m, d] = minDate.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        minDateObj = new Date(y, m - 1, d);
      }
    }
  }

  let prevDisabled = false;
  if (minDateObj) {
    if (currentYear < minDateObj.getFullYear()) {
      prevDisabled = true;
    } else if (currentYear === minDateObj.getFullYear() && currentMonth <= minDateObj.getMonth()) {
      prevDisabled = true;
    }
  }

  return (
    <div className={cn("relative w-full peer", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-[52px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm transition-colors hover:bg-zinc-50 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue",
          displayValue ? "text-zinc-900" : "text-transparent"
        )}
      >
        <span className="truncate">{displayValue || " "}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full min-w-[280px] p-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => !prevDisabled && handlePrevMonth()}
                disabled={prevDisabled}
                className={cn(
                  "p-1 rounded transition-colors",
                  prevDisabled ? "text-zinc-300 cursor-not-allowed" : "hover:bg-zinc-100 text-zinc-600"
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center text-sm font-semibold text-zinc-900">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-600 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const formattedMonth = String(currentMonth + 1).padStart(2, "0");
                const formattedDay = String(day).padStart(2, "0");
                const thisDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                const isSelected = value === thisDateStr;
                
                let disabled = false;
                if (minDateObj) {
                  const thisDateObj = new Date(currentYear, currentMonth, day);
                  if (thisDateObj < minDateObj) {
                    disabled = true;
                  }
                }

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && selectDate(day)}
                    disabled={disabled}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-brand-blue text-white font-semibold"
                        : disabled
                          ? "text-zinc-300 cursor-not-allowed"
                          : "text-zinc-700 hover:bg-zinc-100"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
