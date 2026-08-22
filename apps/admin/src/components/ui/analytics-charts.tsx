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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: { name: string; value: number; color: string }[];
  title?: string;
  height?: number;
}

export function DonutChart({ data, title, height = 260, className, ...props }: DonutChartProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm", className)} {...props}>
      {title && <p className="text-md text-zinc-950 font-semibold mb-4">{title}</p>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-md">
                    <p className="font-medium text-zinc-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
                      {data.name}
                    </p>
                    <p className="text-zinc-600 mt-1 tabular-nums">{data.value}</p>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
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

export function BarChart({ data, title, height = 260, xAxisKey, bars, className, ...props }: BarChartProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm", className)} {...props}>
      {title && <p className="text-md text-zinc-950 font-semibold mb-4">{title}</p>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "#f4f4f5" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-md">
                    <p className="font-medium text-zinc-900 mb-2">{label}</p>
                    {payload.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-zinc-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}:</span>
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
                fill={bar.color}
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
