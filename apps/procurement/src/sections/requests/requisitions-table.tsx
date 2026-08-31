"use client";

import { Inbox,Paperclip } from "lucide-react";
import React from "react";

import {
  formatCurrency,
  formatDate,
  getPriorityBadgeInfo,
  getStatusBadgeInfo,
} from "@/lib/formatters";
import { PurchaseRequest } from "@/types/procurement";

interface RequisitionsTableProps {
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
}

export function RequisitionsTable({ requests, onSelectRequest }: RequisitionsTableProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Fixed Top Header Row */}
      <div className="shrink-0 rounded-2xl bg-[#0073bc] px-2 py-3 text-white shadow-xs">
        <div className="grid grid-cols-12 items-center gap-3 px-4 text-xs font-bold tracking-wider uppercase">
          <div className="col-span-4 min-w-0">Requisition</div>
          <div className="col-span-2 min-w-0">Department / Trade</div>
          <div className="col-span-2 min-w-0 text-center">Priority</div>
          <div className="col-span-2 min-w-0 text-center">Status</div>
          <div className="col-span-2 min-w-0 text-right">Est. Amount & Date</div>
        </div>
      </div>

      {/* Scrollable Body (Completely separate from fixed header) */}
      <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pt-2">
        {requests.length > 0 ? (
          requests.map((req) => {
            const statusBadge = getStatusBadgeInfo(req.status);
            const priorityBadge = getPriorityBadgeInfo(req.priority);

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req.id)}
                className="group grid cursor-pointer grid-cols-12 items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] hover:ring-[#0073bc]/40"
              >
                {/* Column 1: Reference & Title */}
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#0073bc]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0073bc]">
                      {req.referenceNumber}
                    </span>
                    {Boolean(req.attachments && req.attachments.length > 0) && (
                      <span
                        title={`${req.attachments?.length || 0} attachments`}
                        className="flex items-center gap-0.5 text-xs text-zinc-400"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="font-semibold">{req.attachments?.length || 0}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-zinc-950 transition-colors group-hover:text-[#0073bc]">
                    {req.title}
                  </p>
                </div>

                {/* Column 2: Department */}
                <div className="col-span-2 min-w-0 truncate text-sm font-medium text-zinc-700">
                  {req.department}
                </div>

                {/* Column 3: Priority */}
                <div className="col-span-2 min-w-0 text-center">
                  <span
                    className={`inline-flex w-[110px] items-center justify-center rounded-full border py-1 text-xs font-semibold ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                  >
                    {priorityBadge.label}
                  </span>
                </div>

                {/* Column 4: Status */}
                <div className="col-span-2 min-w-0 text-center">
                  <span
                    className={`inline-flex w-[120px] items-center justify-center gap-1.5 rounded-full border py-1 text-xs font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusBadge.dotClass}`} />
                    <span className="truncate">{statusBadge.label}</span>
                  </span>
                </div>

                {/* Column 5: Amount & Date */}
                <div className="col-span-2 min-w-0 text-right">
                  <div className="truncate font-mono text-base font-extrabold text-zinc-950">
                    {formatCurrency(req.totalEstimatedAmount, req.currency)}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-zinc-500">
                    Due {formatDate(req.requiredByDate)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Inbox className="mb-2 h-10 w-10 text-zinc-300" />
            <p className="text-base font-bold text-zinc-800">No requisitions found</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
