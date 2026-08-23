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

export function KpiCard({ label, value, href, icon, trend, trendValue, className }: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{label}</p>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <p className="text-3xl font-bold tracking-tight text-zinc-950 tabular-nums">{value}</p>
          {trend && trendValue && (
            <span
              className={`mb-0.5 flex items-center text-xs font-semibold ${
                trend === "up"
                  ? "text-brand-blue"
                  : trend === "down"
                    ? "text-zinc-500"
                    : "text-zinc-400"
              }`}
            >
              {trend === "up" && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
              {trend === "down" && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
              {trend === "neutral" && <Minus className="mr-0.5 h-3.5 w-3.5" />}
              {trendValue}
            </span>
          )}
        </div>
        {href && (
          <ArrowUpRight className="mb-1 h-4 w-4 text-brand-blue opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
    </>
  );

  const shell = cn(
    "group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-all duration-300",
    className,
  );

  if (!href) {
    return (
      <div className={shell}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
        <div className="relative z-10">{body}</div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${shell} hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-[0_16px_40px_-18px_rgba(0,115,188,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-0 bg-brand-blue transition-all duration-300 group-hover:w-full" />
      <div className="relative z-10">{body}</div>
    </Link>
  );
}
