"use client";

import { Users } from "lucide-react";
import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface PerformanceChartProps {
  data: {
    name: string;
    value: number;
  }[];
  title: string;
  description?: string;
  color?: string;
}

export function PerformanceChart({
  data,
  title,
  description,
  color = "#0073bc", // brand-blue
}: PerformanceChartProps) {
  // Format data for chart if empty
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { name: "Jan", value: 0 },
        { name: "Feb", value: 0 },
        { name: "Mar", value: 0 },
        { name: "Apr", value: 0 },
        { name: "May", value: 0 },
        { name: "Jun", value: 0 },
      ];
    }
    return data;
  }, [data]);

  const isEmpty = !data || data.length === 0;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight text-zinc-950">{title}</h3>
        {description && <p className="text-sm text-zinc-500">{description}</p>}
      </div>

      <div className="relative h-[250px] w-full">
        {isEmpty && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
            <Users className="mb-2 h-6 w-6 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-600">No data available</p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient
                id={`color-${title.replace(/\\s+/g, "-")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                      <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase">{label}</p>
                      <p className="text-sm font-bold text-zinc-950">
                        {payload[0].value} <span className="font-normal text-zinc-500">Total</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color-${title.replace(/\\s+/g, "-")})`}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
