"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const cardClass =
  "rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]";

const tooltipClass =
  "rounded-2xl border border-zinc-100 bg-white/95 px-3.5 py-2.5 text-sm shadow-xl shadow-zinc-900/10 backdrop-blur-sm";

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: { name: string; value: number; color: string }[];
  title?: string;
  height?: number;
}

export function DonutChart({ data, title, height = 320, className, ...props }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn(cardClass, className)} {...props}>
      {title && (
        <p className="mb-2 text-[15px] font-semibold tracking-tight text-zinc-900">{title}</p>
      )}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={82}
              outerRadius={114}
              paddingAngle={3}
              cornerRadius={10}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              isAnimationActive={false}
              animationDuration={0}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as { name: string; value: number; color: string };
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div className={tooltipClass}>
                    <p className="flex items-center gap-2 font-medium text-zinc-900">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <span className="font-semibold tabular-nums text-zinc-900">{item.value}</span>
                      {" · "}
                      {pct}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium tracking-[0.14em] text-zinc-400 uppercase">Total</span>
          <span className="text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">{total}</span>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-medium text-zinc-500">{item.name}</span>
            <span className="text-xs font-semibold tabular-nums text-zinc-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[];
  title?: string;
  height?: number;
  xAxisKey: string;
  bars: { dataKey: string; color: string; name?: string }[];
}

export function BarChart({ data, title, height = 280, xAxisKey, bars, className, ...props }: BarChartProps) {
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <div className={cn(cardClass, className)} {...props}>
      {title && (
        <p className="mb-2 text-[15px] font-semibold tracking-tight text-zinc-900">{title}</p>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}>
            <defs>
              {bars.map((bar, index) => (
                <linearGradient key={index} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={bar.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={bar.color} stopOpacity={0.72} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              isAnimationActive={false}
              animationDuration={0}
              cursor={{ fill: "rgba(0,115,188,0.06)", radius: 12 }}
              wrapperStyle={{ outline: "none", zIndex: 20 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={tooltipClass}>
                    <p className="mb-1.5 font-medium text-zinc-900">{label}</p>
                    {payload.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-zinc-500">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                        <span className="font-semibold tabular-nums text-zinc-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={`url(#${gradientId}-${index})`}
                radius={[12, 12, 12, 12]}
                barSize={28}
                maxBarSize={36}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
