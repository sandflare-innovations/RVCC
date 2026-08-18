"use client"

import * as React from "react"
import { Star } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"

interface PointsChartDataPoint {
  date: string
  total: number
  change: number
}

interface PointsChartLevel {
  value: number
  color: string
}

interface PointsChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PointsChartDataPoint[]
  height?: number
  title?: string
  headerRight?: React.ReactNode
  yAxisLabel?: string
  levels?: PointsChartLevel[]
}

function formatValue(value: number) {
  return Math.round(value).toLocaleString()
}

function LevelReferenceStarLabel({
  viewBox,
  color,
}: {
  viewBox?: { x?: number; y?: number } | null
  color: string
}) {
  const x = viewBox?.x
  const y = viewBox?.y

  if (typeof x !== "number" || typeof y !== "number") {
    return null
  }

  return (
    <g transform={`translate(${x - 14},${y})`}>
      <Star
        x={-5}
        y={-5}
        width={10}
        height={10}
        fill={color}
        stroke={color}
        strokeWidth={1.75}
      />
    </g>
  )
}

function PointsChart({
  data,
  height = 260,
  title = "Your points",
  headerRight,
  yAxisLabel,
  levels,
  className,
  ...props
}: PointsChartProps) {
  const yDomain = React.useMemo<[number, number]>(() => {
    const values = [
      ...data.map((item) => item.total),
      ...(levels?.map((level) => level.value) ?? []),
    ]

    if (values.length === 0) return [0, 100]

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue

    if (range === 0) {
      const padding = Math.max(maxValue * 0.15, 10)
      return [Math.max(0, minValue - padding), maxValue + padding]
    }

    const padding = Math.max(range * 0.12, 10)
    return [Math.max(0, minValue - padding), maxValue + padding]
  }, [data, levels])

  return (
    <div className={cn("bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm", className)} {...props}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-md text-zinc-950 font-semibold">{title}</p>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="var(--zinc-200)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--zinc-500)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              tick={{ fill: "var(--zinc-500)", fontSize: 12 }}
              tickFormatter={formatValue}
              width={64}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--zinc-500)",
                      fontSize: 12,
                      dx: -18,
                    }
                  : undefined
              }
            />
            {levels?.map((level) => (
              <ReferenceLine
                key={level.value}
                y={level.value}
                stroke={level.color}
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  position: "left",
                  content: (labelProps: { viewBox?: unknown }) => (
                    <LevelReferenceStarLabel
                      viewBox={
                        (labelProps.viewBox as {
                          x?: number
                          y?: number
                        } | null) ?? null
                      }
                      color={level.color}
                    />
                  ),
                }}
              />
            ))}
            <Tooltip
              cursor={{ stroke: "#0073bc", strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as PointsChartDataPoint
                const changePrefix = row.change > 0 ? "+" : ""
                return (
                  <div
                    className="bg-white text-zinc-950 rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-md"
                  >
                    <p className="text-zinc-500 mb-1">{label}</p>
                    <p className="font-medium tabular-nums">
                      Total {formatValue(row.total)}
                    </p>
                    <p className="text-zinc-500 text-xs tabular-nums">
                      {changePrefix}
                      {formatValue(row.change)}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#0073bc"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3, fill: "#0073bc" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export { PointsChart }
export type { PointsChartDataPoint, PointsChartProps }
