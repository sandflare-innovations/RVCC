"use client";

import React from "react";
import { Paperclip, Inbox } from "lucide-react";
import { PurchaseRequest } from "@/types/procurement";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/formatters";

interface RequisitionsTableProps {
  requests: PurchaseRequest[];
  onSelectRequest: (id: string) => void;
}

export function RequisitionsTable({
  requests,
  onSelectRequest,
}: RequisitionsTableProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Fixed Top Header Row */}
      <div className="shrink-0 bg-[#0073bc] text-white rounded-2xl px-2 py-3 shadow-xs">
        <div className="grid grid-cols-12 gap-3 items-center text-xs font-bold uppercase tracking-wider px-4">
          <div className="col-span-4 min-w-0">Requisition</div>
          <div className="col-span-2 min-w-0">Department / Trade</div>
          <div className="col-span-2 text-center min-w-0">Priority</div>
          <div className="col-span-2 text-center min-w-0">Status</div>
          <div className="col-span-2 text-right min-w-0">Est. Amount & Date</div>
        </div>
      </div>

      {/* Scrollable Body (Completely separate from fixed header) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-2 space-y-2">
        {requests.length > 0 ? (
          requests.map((req) => {
            const statusBadge = getStatusBadgeInfo(req.status);
            const priorityBadge = getPriorityBadgeInfo(req.priority);

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req.id)}
                className="grid grid-cols-12 gap-3 items-center bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl p-4 transition-all hover:ring-[#0073bc]/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] group cursor-pointer"
              >
                {/* Column 1: Reference & Title */}
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0073bc] bg-[#0073bc]/10 px-2.5 py-0.5 rounded-lg">
                      {req.referenceNumber}
                    </span>
                    {Boolean(req.attachments && req.attachments.length > 0) && (
                      <span
                        title={`${req.attachments?.length || 0} attachments`}
                        className="flex items-center text-zinc-400 gap-0.5 text-xs"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="font-semibold">{req.attachments?.length || 0}</span>
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-zinc-950 group-hover:text-[#0073bc] transition-colors mt-1 truncate text-sm">
                    {req.title}
                  </p>
                </div>

                {/* Column 2: Department */}
                <div className="col-span-2 min-w-0 text-zinc-700 text-sm font-medium truncate">
                  {req.department}
                </div>

                {/* Column 3: Priority */}
                <div className="col-span-2 text-center min-w-0">
                  <span
                    className={`inline-flex w-[110px] items-center justify-center rounded-full py-1 text-xs font-semibold border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                  >
                    {priorityBadge.label}
                  </span>
                </div>

                {/* Column 4: Status */}
                <div className="col-span-2 text-center min-w-0">
                  <span
                    className={`inline-flex w-[120px] items-center justify-center gap-1.5 rounded-full py-1 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusBadge.dotClass}`}
                    />
                    <span className="truncate">{statusBadge.label}</span>
                  </span>
                </div>

                {/* Column 5: Amount & Date */}
                <div className="col-span-2 text-right min-w-0">
                  <div className="font-extrabold text-zinc-950 font-mono text-base truncate">
                    {formatCurrency(req.totalEstimatedAmount, req.currency)}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">
                    Due {formatDate(req.requiredByDate)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Inbox className="h-10 w-10 text-zinc-300 mb-2" />
            <p className="text-base font-bold text-zinc-800">No requisitions found</p>
            <p className="text-xs text-zinc-400 mt-0.5">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
