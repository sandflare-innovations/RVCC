import React from "react";

import Link from "next/link";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: number | string;
  href?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function KpiCard({ label, value, href, icon, trend, trendValue }: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase">{label}</p>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">{value}</p>
        {trend && trendValue && (
          <span
            className={`flex items-center text-xs font-medium ${
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                  ? "text-red-600"
                  : "text-zinc-500"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
            {trend === "down" && <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            {trend === "neutral" && <Minus className="mr-0.5 h-3.5 w-3.5" />}
            {trendValue}
          </span>
        )}
      </div>
    </>
  );

  const shell =
    "group flex flex-col justify-between rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm transition-all relative overflow-hidden";

  if (!href) return <div className={shell}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
    <div className="relative z-10">{body}</div>
  </div>;

  return (
    <Link
      href={href}
      className={`${shell} hover:border-brand-blue/50 focus-visible:ring-brand-blue hover:shadow-md focus-visible:ring-2 focus-visible:outline-none`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:bg-blue-100/50"></div>
      <div className="relative z-10">{body}</div>
    </Link>
  );
}
