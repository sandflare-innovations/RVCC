"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Building,
  Calendar,
  User,
  Clock,
  MessageSquare,
  FileText,
  AlertTriangle,
  History,
  Tag,
  DollarSign,
  ArrowDownToLine,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { PurchaseRequest } from "@/types/procurement";
import { ProcurementStore } from "@/lib/storage";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/formatters";
import { getClientProcurementProfile, ProcurementProfile } from "@/lib/profile-client";

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<ProcurementProfile | null>(null);
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getClientProcurementProfile());
    if (params?.id) {
      const found = ProcurementStore.getRequestById(String(params.id));
      setRequest(found);
      setIsLoading(false);
    }
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <Navbar user={user} />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-zinc-200 rounded-xl" />
            <div className="h-64 w-full bg-white rounded-3xl border border-zinc-100" />
          </div>
        </main>
      </div>
    );
  }


  if (!request) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <Navbar user={user} />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="rounded-3xl border border-zinc-200 bg-white p-12 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">Requisition Not Found</h2>
            <p className="mt-2 text-sm text-zinc-500">
              The purchase requisition you requested does not exist or has been removed.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0073bc] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#005f9e] transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Requisitions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusBadge = getStatusBadgeInfo(request.status);
  const priorityBadge = getPriorityBadgeInfo(request.priority);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16">
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0073bc]">
                  {request.referenceNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                  {statusBadge.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                >
                  {priorityBadge.label} Priority
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl mt-1">
                {request.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-2 text-right shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Total Est. Cost
              </span>
              <span className="text-base font-bold text-zinc-950 font-mono">
                {formatCurrency(request.totalEstimatedAmount, request.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-2 space-y-6">
            {/* Overview Meta */}
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc] mb-4">
                Requisition Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100">
                  <div className="rounded-xl bg-[#0073bc]/10 p-2 text-[#0073bc]">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block text-[11px]">Department / Trade</span>
                    <span className="font-semibold text-zinc-900">{request.department}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100">
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block text-[11px]">Required On-Site</span>
                    <span className="font-semibold text-zinc-900">{formatDate(request.requiredByDate)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100">
                  <div className="rounded-xl bg-zinc-200/60 p-2 text-zinc-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium block text-[11px]">Submitted Date</span>
                    <span className="font-semibold text-zinc-900">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div className="mt-5">
                <span className="text-zinc-400 font-semibold block text-[11px] uppercase tracking-wider mb-1.5">
                  Business Justification & Project Context
                </span>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 text-xs text-zinc-700 leading-relaxed">
                  {request.description}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc]">
                    Itemized Bill of Quantities
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {request.items.length} line item(s) requested for purchase
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 px-3 py-1 text-xs font-mono font-bold text-zinc-900 border border-zinc-200/80">
                  Subtotal: {formatCurrency(request.totalEstimatedAmount, request.currency)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3 text-center">Qty</th>
                      <th className="px-3 py-3 text-right">Est. Unit</th>
                      <th className="px-4 py-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {request.items.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/70">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          {item.preferredVendor && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Preferred Vendor: <strong className="text-zinc-700">{item.preferredVendor}</strong>
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 italic mt-0.5">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-zinc-600 font-medium">{item.category}</td>
                        <td className="px-3 py-3.5 text-center text-zinc-800 font-mono font-medium">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-3.5 text-right text-zinc-700 font-mono">
                          {formatCurrency(item.estimatedUnitPrice, request.currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-zinc-950 font-mono">
                          {formatCurrency(item.totalPrice, request.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Attachments & Audit Timeline */}
          <div className="space-y-6">
            {/* Feedback / Admin Notes if any */}
            {request.rejectionReason && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  Admin Panel Feedback:
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">{request.rejectionReason}</p>
              </div>
            )}

            {request.adminNotes && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-[#0073bc] text-xs mb-1.5">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  Procurement Notes:
                </div>
                <p className="text-xs text-blue-950 leading-relaxed">{request.adminNotes}</p>
              </div>
            )}

            {/* Attached Quotes */}
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc] mb-3">
                Supporting Quotes ({request.attachments.length})
              </h2>

              {request.attachments.length > 0 ? (
                <div className="space-y-2.5">
                  {request.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="rounded-xl bg-[#0073bc]/10 p-2 text-[#0073bc] shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-zinc-900 block truncate">{att.name}</span>
                          <span className="text-[11px] text-zinc-400">
                            {(att.size / 1024 / 1024).toFixed(2)} MB • {formatDate(att.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-600 shrink-0">
                        {att.type.split("/")[1]?.toUpperCase() || "PDF"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">No attachments uploaded for this request.</p>
              )}
            </div>

            {/* Timeline / Activity Log */}
            <div className="rounded-3xl border border-zinc-100/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0073bc] mb-4 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Status Timeline
              </h2>

              <div className="space-y-4 pl-2 border-l-2 border-zinc-100">
                {request.auditTrail.map((log) => (
                  <div key={log.id} className="relative pl-5 text-xs">
                    <div className="absolute -left-[7px] top-1 h-2.5 w-2.5 rounded-full bg-[#0073bc] ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">{log.action}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      by <span className="font-semibold text-zinc-800">{log.actorName}</span> ({log.actorRole})
                    </p>
                    {log.note && (
                      <p className="mt-1.5 rounded-xl bg-zinc-50 p-2.5 text-zinc-700 text-[11px] border border-zinc-100 leading-relaxed">
                        {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
