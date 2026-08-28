"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Building,
  Calendar,
  User,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Download,
  Mail,
  FileSignature,
  FileCheck,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { AdminProcurementStore } from "@/lib/procurement/storage";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/procurement/formatters";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-brand-blue" />}
        <h2 className="text-xs font-bold tracking-[0.12em] text-brand-blue uppercase">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0">
      <dt className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{label}</dt>
      <dd className="text-sm break-words text-zinc-950 font-medium">{value || "—"}</dd>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "PR";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function AdminProcurementDetailView() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change State
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, startUpdating] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadData = () => {
    if (params?.id) {
      const found = AdminProcurementStore.getRequestById(String(params.id));
      setRequest(found);
      if (found) {
        setAdminNote(found.adminNotes || "");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params?.id]);

  const handleUpdateStatus = (newStatus: RequestStatus) => {
    if (!request) return;
    setFeedbackMsg(null);

    startUpdating(() => {
      try {
        const updated = AdminProcurementStore.updateStatus(
          request.id,
          newStatus,
          "Admin",
          `Status changed to ${newStatus.replace(/_/g, " ")}.`,
          adminNote
        );

        if (updated) {
          setRequest(updated);
          setFeedbackMsg({
            type: "success",
            text: `Status successfully updated to "${newStatus.replace(/_/g, " ").toUpperCase()}".`,
          });
          setTimeout(() => setFeedbackMsg(null), 4000);
        }
      } catch {
        setFeedbackMsg({
          type: "error",
          text: "Failed to update requisition status. Please try again.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full px-8 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 rounded-lg" />
        <div className="h-48 bg-white rounded-3xl border border-zinc-100" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-white p-12 rounded-3xl border border-zinc-200 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900">Requisition Not Found</h2>
        <p className="text-sm text-zinc-500 mt-2">
          The requested requisition ID does not exist or has been removed.
        </p>
        <Link
          href="/procurement"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue/90 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Procurements</span>
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusBadgeInfo(request.status);
  const priorityBadge = getPriorityBadgeInfo(request.priority);

  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        <BackButton label="Back to Procurements" />


        {/* Premium Header Profile Banner */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-6 relative z-10">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center border border-brand-blue/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <span className="text-3xl font-bold text-brand-blue tracking-wider font-mono">
                {getInitials(request.title)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-md">
                  {request.referenceNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                  {statusBadge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${priorityBadge.bgClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${priorityBadge.dotClass}`} />
                  {priorityBadge.label} Priority
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                {request.title}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  {request.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  {request.requesterName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Required by {formatDate(request.requiredByDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:items-end justify-between self-stretch pt-2 border-t md:border-t-0 border-zinc-100">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Est. Value</span>
              <p className="text-3xl font-black text-zinc-950 tabular-nums">
                {formatCurrency(request.totalEstimatedAmount, request.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Details & Line Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            <Section title="Requisition Overview" icon={FileSignature}>
              <Row label="Description" value={request.description} />
              <Row label="Department" value={request.department} />
              <Row label="Cost Center" value={request.costCenter || "Project Phase 2 (Infrastructure)"} />
              <Row label="Requester" value={`${request.requesterName} ${request.requesterEmail ? `(${request.requesterEmail})` : ""}`} />
              <Row label="Submitted On" value={formatDateTime(request.createdAt)} />
              <Row label="Required By" value={formatDate(request.requiredByDate)} />
            </Section>

            {/* Line Items & Materials */}
            <Section title={`Line Items & Materials (${request.items?.length || 0})`} icon={Layers}>
              <div className="overflow-x-auto -mx-6 -my-6">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-3 px-6">Material / Specification</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Qty</th>
                      <th className="py-3 px-4">Unit Est.</th>
                      <th className="py-3 px-6 text-right">Total Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {request.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-6 max-w-xs">
                          <p className="font-bold text-zinc-950">{item.name}</p>
                          {item.preferredVendor && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Pref. Vendor: <span className="font-semibold text-brand-blue">{item.preferredVendor}</span>
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 mt-0.5 italic">{item.notes}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-zinc-800 whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-4 px-4 font-medium text-zinc-600 whitespace-nowrap">
                          {formatCurrency(item.estimatedUnitPrice, request.currency)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-zinc-950 whitespace-nowrap">
                          {formatCurrency(item.totalPrice, request.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Attachments Section */}
            {request.attachments && request.attachments.length > 0 && (
              <Section title={`Supporting Attachments (${request.attachments.length})`} icon={FileText}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-brand-blue shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{att.name}</p>
                          <p className="text-[10px] text-zinc-400">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Downloading ${att.name}`)}
                        className="p-1.5 text-zinc-500 hover:text-brand-blue rounded-lg hover:bg-white transition cursor-pointer"
                        title="Download attachment"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Audit History Log */}
            {request.auditTrail && request.auditTrail.length > 0 && (
              <Section title="Requisition Audit Log" icon={History}>
                <div className="space-y-3">
                  {request.auditTrail.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 text-xs border-l-2 border-brand-blue/40 pl-4 py-1"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-zinc-950">{log.action}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">{formatDateTime(log.timestamp)}</span>
                        </div>
                        <p className="text-zinc-500 mt-0.5">By {log.actorName} ({log.actorRole})</p>
                        {log.note && <p className="text-zinc-700 mt-1 italic bg-zinc-50 p-2 rounded-xl">"{log.note}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right 1 Col: Status Decision Panel with Admin Styling */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4">
                <ShieldCheck className="h-5 w-5 text-brand-blue" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">Status & Review Action</h3>
                  <p className="text-[11px] text-zinc-500">Update status & record audit note</p>
                </div>
              </div>

              {feedbackMsg && (
                <div
                  className={`my-4 p-3 rounded-2xl text-xs font-semibold ${
                    feedbackMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <div className="mt-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Select New Status
                </label>

                {/* Approve Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isUpdating || request.status === "approved"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Approve Requisition</span>
                  </div>
                  {request.status === "approved" && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                </button>

                {/* Under Review Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("under_review")}
                  disabled={isUpdating || request.status === "under_review"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Move to Under Review</span>
                  </div>
                  {request.status === "under_review" && (
                    <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                </button>

                {/* Request Revisions Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("revision_requested")}
                  disabled={isUpdating || request.status === "revision_requested"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <span>Request Revisions</span>
                  </div>
                  {request.status === "revision_requested" && (
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                </button>

                {/* Reject Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={isUpdating || request.status === "rejected"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Reject Requisition</span>
                  </div>
                  {request.status === "rejected" && (
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                </button>
              </div>

              {/* Note input */}
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Internal Review Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add feedback, budget approval code, or RFQ instructions..."
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(request.status)}
                  disabled={isUpdating}
                  className="mt-3 w-full rounded-full bg-brand-blue py-3 text-xs font-bold text-white hover:bg-brand-blue/90 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Save Review Notes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
