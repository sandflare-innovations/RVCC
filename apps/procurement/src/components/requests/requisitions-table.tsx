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
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full text-left text-sm border-separate border-spacing-y-2.5 min-w-[880px]">
        <thead className="sticky top-0 z-30 bg-[#0073bc] text-white">
          <tr className="whitespace-nowrap text-xs font-bold uppercase tracking-wider">
            <th className="sticky left-0 z-40 bg-[#0073bc] px-6 py-3.5 rounded-l-2xl shadow-[2px_0_5px_rgba(0,0,0,0.08)]">
              Requisition
            </th>
            <th className="bg-[#0073bc] px-5 py-3.5">Department / Trade</th>
            <th className="bg-[#0073bc] px-5 py-3.5 text-center">Priority</th>
            <th className="bg-[#0073bc] px-5 py-3.5 text-center">Status</th>
            <th className="bg-[#0073bc] px-5 py-3.5 text-right">
              Estimated Amount
            </th>
            <th className="bg-[#0073bc] px-6 py-3.5 text-right rounded-r-2xl">
              Required By
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((req) => {
              const statusBadge = getStatusBadgeInfo(req.status);
              const priorityBadge = getPriorityBadgeInfo(req.priority);

              return (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req.id)}
                  className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-[#0073bc]/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] group cursor-pointer whitespace-nowrap"
                >
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-zinc-50/90 transition-colors px-6 py-4 font-medium text-zinc-900 rounded-l-2xl shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[300px]">
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
                    <p className="font-bold text-zinc-950 group-hover:text-[#0073bc] transition-colors mt-1 max-w-[340px] truncate text-sm">
                      {req.title}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-zinc-700 text-sm font-medium">
                    {req.department}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex w-[120px] items-center justify-center rounded-full py-1 text-xs font-semibold border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                    >
                      {priorityBadge.label}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex w-[130px] items-center justify-center gap-1.5 rounded-full py-1 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusBadge.dotClass}`}
                      />
                      <span className="truncate">{statusBadge.label}</span>
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="font-extrabold text-zinc-950 font-mono text-base">
                      {formatCurrency(req.totalEstimatedAmount, req.currency)}
                    </div>
                    <div className="text-xs text-zinc-400 font-medium">
                      {(req.items?.length ?? req.itemCount ?? 0)}{" "}
                      {(req.items?.length ?? req.itemCount ?? 0) === 1 ? "BOQ item" : "BOQ items"}
                    </div>

                  </td>

                  <td className="px-6 py-4 text-right text-zinc-600 text-xs rounded-r-2xl">
                    <div className="font-bold text-zinc-900 text-sm">
                      {formatDate(req.requiredByDate)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Sub. {formatDate(req.createdAt)}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                <div className="flex flex-col items-center justify-center">
                  <Inbox className="h-10 w-10 text-zinc-300 mb-2" />
                  <p className="text-base font-bold text-zinc-800">No requisitions found</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Try adjusting your filters or search query.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
