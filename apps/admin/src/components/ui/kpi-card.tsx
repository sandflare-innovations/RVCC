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
    "group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={`${shell} hover:border-brand-blue focus-visible:ring-brand-blue hover:shadow-md focus-visible:ring-2 focus-visible:outline-none`}
    >
      {body}
    </Link>
  );
}
