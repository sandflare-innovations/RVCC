import React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: number | string;
  href?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  href,
  icon,
  trend,
  trendValue,
  className,
}: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-400 uppercase truncate">
          {label}
        </p>
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#0073bc]/10 text-[#0073bc] transition-colors duration-300 group-hover:bg-[#0073bc] group-hover:text-white">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
          {value}
        </p>
        {trend && trendValue && (
          <span
            className={`flex items-center text-[11px] font-semibold ${
              trend === "up"
                ? "text-[#0073bc]"
                : trend === "down"
                ? "text-zinc-500"
                : "text-zinc-400"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {trend === "neutral" && <Minus className="mr-0.5 h-3 w-3" />}
            {trendValue}
          </span>
        )}
      </div>
    </>
  );

  const shell = cn(
    "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-100/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.08)] transition-all duration-300",
    className
  );

  if (!href) {
    return (
      <div className={shell}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0073bc]/25 to-transparent" />
        <div className="relative z-10">{body}</div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${shell} hover:-translate-y-0.5 hover:border-[#0073bc]/30 hover:shadow-[0_12px_28px_-14px_rgba(0,115,188,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0073bc]/40`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0073bc]/40 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-[#0073bc] transition-all duration-300 group-hover:w-full" />
      <div className="relative z-10">{body}</div>
    </Link>
  );
}
