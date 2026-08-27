"use client";

import React from "react";
import Link from "next/link";
import { Paperclip, Inbox, Calendar, ArrowUpRight } from "lucide-react";
import { PurchaseRequest } from "@/types/procurement";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/formatters";

interface RequisitionsGridProps {
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
}

export function RequisitionsGrid({
  requests,
  onSelectRequest,
}: RequisitionsGridProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-10 w-10 text-zinc-300 mb-2" />
        <p className="text-base font-bold text-zinc-800">No requisitions found</p>
        <p className="text-xs text-zinc-400 mt-0.5">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 no-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {requests.map((req) => {
          const statusBadge = getStatusBadgeInfo(req.status);
          const priorityBadge = getPriorityBadgeInfo(req.priority);

          return (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req.id)}
              className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.06)] hover:border-[#0073bc]/60 hover:shadow-[0_14px_36px_-8px_rgba(0,115,188,0.22)] transition-all cursor-pointer"
            >
              <div className="space-y-3.5">
                {/* Card Top Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0073bc] bg-[#0073bc]/10 px-3 py-1 rounded-xl">
                      {req.referenceNumber}
                    </span>
                    {req.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                        <Paperclip className="h-3.5 w-3.5" />
                        {req.attachments.length}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                    {statusBadge.label}
                  </span>
                </div>

                {/* Title & Trade */}
                <div>
                  <h3 className="font-bold text-zinc-950 text-base sm:text-lg leading-snug group-hover:text-[#0073bc] transition-colors line-clamp-2">
                    {req.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">
                    {req.department}
                  </p>
                </div>

                {/* Priority & Required Date */}
                <div className="flex items-center justify-between text-xs pt-3.5 border-t border-zinc-100 text-zinc-600">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                  >
                    {priorityBadge.label} Priority
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    Required: <strong className="text-zinc-900">{formatDate(req.requiredByDate)}</strong>
                  </span>
                </div>
              </div>

              {/* Card Bottom: Total Price + Action */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Total Est. BOQ ({req.items.length} {req.items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-mono text-lg sm:text-xl font-extrabold text-[#0073bc]">
                    {formatCurrency(req.totalEstimatedAmount, req.currency)}
                  </span>
                </div>
                <Link
                  href={`/requirements/${req.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 group-hover:bg-[#0073bc] px-4 py-2 text-xs font-bold text-zinc-700 group-hover:text-white transition-all shadow-2xs"
                >
                  View <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
