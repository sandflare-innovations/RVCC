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

export function RequisitionsGrid({ requests, onSelectRequest }: RequisitionsGridProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="mb-2 h-10 w-10 text-zinc-300" />
        <p className="text-base font-bold text-zinc-800">No requisitions found</p>
        <p className="mt-0.5 text-xs text-zinc-400">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((req) => {
          const statusBadge = getStatusBadgeInfo(req.status);
          const priorityBadge = getPriorityBadgeInfo(req.priority);

          return (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req.id)}
              className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.06)] transition-all hover:border-[#0073bc]/60 hover:shadow-[0_14px_36px_-8px_rgba(0,115,188,0.22)]"
            >
              <div className="space-y-3.5">
                {/* Card Top Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-[#0073bc]/10 px-3 py-1 font-mono text-xs font-bold text-[#0073bc]">
                      {req.referenceNumber}
                    </span>
                    {Boolean(req.attachments && req.attachments.length > 0) && (
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                        <Paperclip className="h-3.5 w-3.5" />
                        {req.attachments?.length || 0}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                    {statusBadge.label}
                  </span>
                </div>

                {/* Title & Trade */}
                <div>
                  <h3 className="line-clamp-2 text-base leading-snug font-bold text-zinc-950 transition-colors group-hover:text-[#0073bc] sm:text-lg">
                    {req.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">{req.department}</p>
                </div>

                {/* Priority & Required Date */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5 text-xs text-zinc-600">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                  >
                    {priorityBadge.label} Priority
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    Required:{" "}
                    <strong className="text-zinc-900">{formatDate(req.requiredByDate)}</strong>
                  </span>
                </div>
              </div>

              {/* Card Bottom: Total Price + Action */}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <div>
                  <span className="block text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Total Est. BOQ ({req.items?.length ?? req.itemCount ?? 0}{" "}
                    {(req.items?.length ?? req.itemCount ?? 0) === 1 ? "item" : "items"})
                  </span>
                  <span className="font-mono text-lg font-extrabold text-[#0073bc] sm:text-xl">
                    {formatCurrency(req.totalEstimatedAmount, req.currency)}
                  </span>
                </div>

                <Link
                  href={`/requirements/${req.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 shadow-2xs transition-all group-hover:bg-[#0073bc] group-hover:text-white"
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
