"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ShieldCheck, Target, TrendingDown, DollarSign } from "lucide-react";
import type { AdminLiveBidsPayload } from "@rvcc/types";

interface LiveBiddingGraphProps {
  data: AdminLiveBidsPayload;
  compact?: boolean;
  showMetrics?: boolean;
}

interface HoveredPoint {
  item: any;
  x: number;
  y: number;
}

// Custom crisp dot marker with hover hit area
function CrispDot(props: any) {
  const { cx, cy, payload, onHover } = props;
  if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) return null;

  const isL1 = payload.rank === 1;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => {
        if (onHover) onHover({ item: payload, x: cx, y: cy });
      }}
      onMouseLeave={() => {
        if (onHover) onHover(null);
      }}
    >
      {/* Expanded invisible hit area for effortless hovering */}
      <circle cx={cx} cy={cy} r={20} fill="transparent" />

      {isL1 ? (
        <>
          {/* L1 Winner Double Ring */}
          <circle cx={cx} cy={cy} r={9} fill="#10b981" fillOpacity={0.25} stroke="#10b981" strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={5.5} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
        </>
      ) : (
        <>
          {/* Standard Bid Node */}
          <circle cx={cx} cy={cy} r={5.5} fill="#0ea5e9" stroke="#ffffff" strokeWidth={2} />
        </>
      )}
    </g>
  );
}

export function LiveBiddingGraph({ data, compact = false, showMetrics = false }: LiveBiddingGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const targetPrice = data.sellingPrice ? Number(data.sellingPrice) : null;
  const lowestPrice = data.lowestPrice ? Number(data.lowestPrice) : null;

  const chartData = useMemo(() => {
    return data.quotes.map((q, index) => {
      const price = q.amountSar ? Number(q.amountSar) : Number(q.newPrice);
      
      // Calculate savings vs target budget
      const savingsVsTarget = targetPrice ? targetPrice - price : null;
      const savingsPercent = targetPrice && targetPrice > 0 
        ? (((targetPrice - price) / targetPrice) * 100).toFixed(1) 
        : null;

      return {
        index,
        rank: q.rank,
        price,
        budget: targetPrice,
        who: q.who,
        vendorEmail: q.vendorEmail,
        currency: q.currency,
        displayPrice: `${Number(q.newPrice).toLocaleString()} ${q.currency}${
          q.currency !== "SAR" && q.amountSar ? ` (≈ ${Number(q.amountSar).toLocaleString()} SAR)` : ""
        }`,
        isLeading: q.isLeading,
        variance: q.varianceFromL1Percent,
        savingsVsTarget,
        savingsPercent,
        submittedAt: q.submittedAt
          ? new Date(q.submittedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
      };
    });
  }, [data.quotes, targetPrice]);

  const maxSavings =
    targetPrice && lowestPrice && targetPrice > lowestPrice
      ? targetPrice - lowestPrice
      : null;

  const maxSavingsPercent =
    targetPrice && lowestPrice && targetPrice > 0
      ? (((targetPrice - lowestPrice) / targetPrice) * 100).toFixed(1)
      : null;

  if (chartData.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center">
        <Target className="h-8 w-8 text-zinc-300 mb-2" />
        <p className="text-sm font-semibold text-zinc-700">No Bids Submitted Yet</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          {targetPrice
            ? `Target budget is set to ${targetPrice.toLocaleString()} ${data.currency}. Bids will plot relative to this budget ceiling.`
            : "Target budget has not been configured for this requirement."}
        </p>
      </div>
    );
  }

  // Calculate clean domain bounds
  const allPrices = chartData.map((d) => d.price);
  if (targetPrice) allPrices.push(targetPrice);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || maxP * 0.1 || 1000;
  const yMin = Math.max(0, Math.floor(minP - range * 0.15));
  const yMax = Math.ceil(maxP + range * 0.15);

  return (
    <div className="flex flex-col w-full h-full min-h-0 relative">
      {/* Reverse Auction Metrics Ribbon - Only if explicitly requested */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {/* Target Budget Card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              <Target className="h-3 w-3 text-zinc-500" />
              <span>Target Budget</span>
            </div>
            <p className="text-sm font-bold text-zinc-900 tabular-nums">
              {targetPrice ? `${targetPrice.toLocaleString()} ${data.currency}` : "Not Set"}
            </p>
          </div>

          {/* Lowest Bid (L1) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Best Bid (L1)</span>
            </div>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">
              {lowestPrice ? `${lowestPrice.toLocaleString()} ${data.currency}` : "—"}
            </p>
          </div>

          {/* Realized Savings */}
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-0.5">
              <TrendingDown className="h-3 w-3 text-sky-600" />
              <span>Potential Savings</span>
            </div>
            <p className="text-sm font-bold text-sky-700 tabular-nums">
              {maxSavings != null && maxSavings > 0
                ? `${maxSavings.toLocaleString()} ${data.currency} (${maxSavingsPercent}%)`
                : maxSavings != null && maxSavings <= 0
                ? "At / Above Budget"
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Main Chart Area - Takes 100% full height */}
      <div className="flex-1 w-full h-full min-h-[340px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 25, bottom: 20, left: 0 }}
          >
            <defs>
              <linearGradient id="savingsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="rank"
              stroke="#cbd5e1"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v) => `Rank #${v}`}
              padding={{ left: 40, right: 40 }}
            />

            <YAxis
              dataKey="price"
              stroke="#cbd5e1"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : v >= 1000
                  ? `${(v / 1000).toFixed(0)}k`
                  : `${v}`
              }
              domain={[yMin, yMax]}
            />

            {targetPrice && (
              <ReferenceLine
                y={targetPrice}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  position: "insideTopRight",
                  value: `Budget: ${targetPrice.toLocaleString()} ${data.currency}`,
                  fill: "#6b7280",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}

            <Area
              type="linear"
              dataKey="price"
              fill="url(#savingsAreaGrad)"
              stroke="none"
              isAnimationActive={false}
            />

            <Line
              type="linear"
              dataKey="price"
              stroke="#0284c7"
              strokeWidth={3}
              dot={<CrispDot onHover={setHoveredPoint} />}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Small Detail Pop-up Box - ONLY when hovering directly on a dot */}
        {hoveredPoint && (
          <div
            className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 min-w-[210px] rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-xs p-3 shadow-xl transition-opacity duration-150"
            style={{
              left: Math.max(110, Math.min(hoveredPoint.x, 340)),
              top: Math.max(10, hoveredPoint.y - 12),
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  hoveredPoint.item.rank === 1 ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                Rank #{hoveredPoint.item.rank} {hoveredPoint.item.rank === 1 ? "(Lowest Bid)" : ""}
              </span>
            </div>

            <p className="text-xs font-bold text-zinc-900 truncate">{hoveredPoint.item.who}</p>
            <p className="text-[10px] text-zinc-400 truncate mb-1.5">{hoveredPoint.item.vendorEmail}</p>

            <div className="rounded-lg bg-zinc-50 p-2 border border-zinc-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Price:</span>
                <span className="font-extrabold text-zinc-900 tabular-nums">{hoveredPoint.item.displayPrice}</span>
              </div>

              {targetPrice && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/60">
                  <span className="text-zinc-500 font-medium">Vs. Target:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      hoveredPoint.item.savingsVsTarget != null && hoveredPoint.item.savingsVsTarget > 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {hoveredPoint.item.savingsVsTarget != null && hoveredPoint.item.savingsVsTarget > 0
                      ? `-${hoveredPoint.item.savingsPercent}% Saved`
                      : `+${Math.abs(Number(hoveredPoint.item.savingsPercent))}% Over`}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[9px] text-zinc-400 text-right mt-1.5">
              Submitted at {hoveredPoint.item.submittedAt}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>L1 Winning Bid</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Competitor Quotes</span>
            </span>
            {targetPrice && (
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-gray-400" />
                <span>Budget</span>
              </span>
            )}
          </div>
          <span>Reverse Auction Curve</span>
        </div>
      )}
    </div>
  );
}
