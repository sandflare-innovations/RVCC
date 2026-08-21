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
        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-1">{label}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-blue/10 text-brand-blue">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-8 flex items-baseline gap-3">
        <p className="font-enquire text-4xl font-bold tracking-tight text-zinc-900 tabular-nums">{value}</p>
        {trend && trendValue && (
          <span
            className={`flex items-center text-xs font-semibold ${
              trend === "up"
                ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"
                : trend === "down"
                  ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-full"
                  : "text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full"
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
    "group flex flex-col justify-between rounded-[1rem] border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={`${shell} hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-lg hover:shadow-brand-blue/5 focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:outline-none`}
    >
      {body}
    </Link>
  );
}
