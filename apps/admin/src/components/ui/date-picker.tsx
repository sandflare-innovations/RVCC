"use client";

import { AnimatePresence,motion } from "framer-motion";
import { Calendar as CalendarIcon,ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect,useRef, useState } from "react";

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// MiniSelect removed as per user request to simplify header

function parseDate(val: string): Date | null {
  if (!val) return null;
  const clean = val.split("T")[0];
  const parts = clean.split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  className,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  let minDateObj: Date | null = null;
  if (minDate) {
    if (minDate === "today") {
      minDateObj = new Date();
      minDateObj.setHours(0, 0, 0, 0);
    } else {
      const d = parseDate(minDate);
      if (d) {
        d.setHours(0, 0, 0, 0);
        minDateObj = d;
      }
    }
  }

  const parsedVal = parseDate(value);
  const initialDate =
    parsedVal && (!minDateObj || parsedVal >= minDateObj)
      ? parsedVal
      : minDateObj || new Date();

  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

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

  useEffect(() => {
    if (value) {
      const p = parseDate(value);
      if (p && (!minDateObj || p >= minDateObj)) {
        setCurrentMonth(p.getMonth());
        setCurrentYear(p.getFullYear());
      }
    }
  }, [value]);

  let prevDisabled = false;
  if (minDateObj) {
    if (currentYear < minDateObj.getFullYear()) {
      prevDisabled = true;
    } else if (currentYear === minDateObj.getFullYear() && currentMonth <= minDateObj.getMonth()) {
      prevDisabled = true;
    }
  }

  const handlePrevMonth = () => {
    if (prevDisabled) return;
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

  const displayValue = parsedVal
    ? parsedVal.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className={cn("peer relative w-full", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "focus:border-brand-blue focus:ring-brand-blue/20 flex h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm transition-colors hover:bg-white focus:bg-white focus:ring-[3px] focus:outline-none",
          className
        )}
      >
        <span className={cn("truncate", displayValue ? "font-medium text-zinc-900" : "text-zinc-400")}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full min-w-[290px] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={prevDisabled}
                className={cn(
                  "rounded-lg p-1.5 transition-colors",
                  prevDisabled
                    ? "invisible opacity-0 pointer-events-none"
                    : "text-zinc-600 hover:bg-zinc-100 active:scale-95"
                )}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center text-sm font-bold text-zinc-900">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-semibold text-zinc-400">
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
                const isSelected = value ? (value === thisDateStr || value.startsWith(thisDateStr)) : false;

                let disabled = false;
                if (minDateObj) {
                  const thisDateObj = new Date(currentYear, currentMonth, day);
                  thisDateObj.setHours(0, 0, 0, 0);
                  if (thisDateObj < minDateObj) {
                    disabled = true;
                  }
                }

                const isToday = (() => {
                  const now = new Date();
                  return (
                    now.getFullYear() === currentYear &&
                    now.getMonth() === currentMonth &&
                    now.getDate() === day
                  );
                })();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && selectDate(day)}
                    disabled={disabled}
                    className={cn(
                      "relative flex h-8 items-center justify-center rounded-lg text-sm transition-all",
                      isSelected
                        ? "bg-brand-blue font-semibold text-white shadow-xs"
                        : disabled
                          ? "cursor-not-allowed text-zinc-300 opacity-30 select-none pointer-events-none line-through"
                          : isToday
                            ? "font-bold text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20"
                            : "text-zinc-700 hover:bg-zinc-100"
                    )}
                  >
                    {day}
                    {isToday && !isSelected && !disabled && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-blue" />
                    )}
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
