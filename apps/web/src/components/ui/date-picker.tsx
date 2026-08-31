"use client";

import { cn } from "@lib/utils";
import { AnimatePresence,motion } from "framer-motion";
import { useEffect,useRef, useState } from "react";
import {
  LuCalendar as CalendarIcon,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
} from "react-icons/lu";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

function MiniSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { label: string | number; value: number }[];
  onChange: (val: number) => void;
}) {
  const [open, setOpen] = useState(false);
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

  const selected = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="focus:ring-brand-blue flex items-center gap-1 rounded px-2 py-1 transition-colors outline-none hover:bg-zinc-100 focus:ring-1"
      >
        <span>{selected}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 z-50 mt-1 max-h-48 min-w-[100px] -translate-x-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded-sm px-3 py-1.5 text-left text-sm hover:bg-zinc-100",
                  value === opt.value ? "text-brand-blue bg-zinc-50 font-medium" : "text-zinc-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  className,
}: DatePickerProps) {
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
    ? new Date(value).toLocaleDateString("en-US", {
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
          "focus:border-brand-blue focus:ring-brand-blue flex h-[52px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm transition-colors hover:bg-zinc-50 focus:ring-1 focus:outline-none",
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
            className="absolute z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center text-sm font-semibold text-zinc-900">
                <MiniSelect
                  value={currentMonth}
                  onChange={setCurrentMonth}
                  options={MONTHS.map((m, i) => ({ label: m, value: i }))}
                />
                <MiniSelect
                  value={currentYear}
                  onChange={setCurrentYear}
                  options={Array.from({ length: 100 }).map((_, i) => {
                    const y = new Date().getFullYear() - 50 + i;
                    return { label: y, value: y };
                  })}
                />
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-medium text-zinc-500">
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

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-brand-blue font-semibold text-white"
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
