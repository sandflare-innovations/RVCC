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
  ArrowUpRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Modal } from "@/components/ui";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { clearProcurementCache } from "@/lib/procurement/procurement-cache";
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
    <section className="rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.06)] hover:border-zinc-300 transition-all">
      <div className="border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 flex items-center gap-2.5">
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
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100/80 py-3.5 last:border-0 items-baseline">
      <dt className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</dt>
      <dd className="text-sm break-words text-zinc-900 font-medium">{value || "—"}</dd>
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

  // Strategic Review Modal & Decision State
  const [modalAction, setModalAction] = useState<RequestStatus | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [internalAdminNotes, setInternalAdminNotes] = useState("");
  const [isUpdating, startUpdating] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadData = async () => {
    if (params?.id) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/procurement/${encodeURIComponent(String(params.id))}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const found = await res.json();
          setRequest(found);
          if (found) {
            setInternalAdminNotes(found.adminNotes || "");
          }
        } else {
          setRequest(null);
        }
      } catch (err) {
        console.error("Failed to load requisition", err);
        setRequest(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [params?.id]);

  const executeStatusChange = (newStatus: RequestStatus, noteText?: string) => {
    if (!request) return;
    setFeedbackMsg(null);

    startUpdating(async () => {
      try {
        const res = await fetch(`/api/procurement/${encodeURIComponent(request.id)}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            note: noteText || `Status transitioned to ${newStatus.replace(/_/g, " ")}.`,
            adminNotes: internalAdminNotes,
          }),
        });

        const data = await res.json();

        if (res.ok && data) {
          setRequest(data);
          clearProcurementCache();
          setModalAction(null);
          setDecisionNote("");
          setFeedbackMsg({
            type: "success",
            text: `Decision successfully recorded: Requisition is now ${newStatus.replace(/_/g, " ").toUpperCase()}.`,
          });
          setTimeout(() => setFeedbackMsg(null), 5000);
        } else {
          setFeedbackMsg({
            type: "error",
            text: data.error || "Failed to update requisition status.",
          });
        }
      } catch {
        setFeedbackMsg({
          type: "error",
          text: "Network error. Please try again.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full px-8 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-zinc-200 rounded-lg" />
        <div className="h-44 bg-white rounded-3xl border border-zinc-100 shadow-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white rounded-3xl border border-zinc-100 shadow-sm" />
            <div className="h-64 bg-white rounded-3xl border border-zinc-100 shadow-sm" />
          </div>
          <div className="h-96 bg-white rounded-3xl border border-zinc-100 shadow-sm" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-white p-12 rounded-3xl border border-zinc-200 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900">Requisition Not Found</h2>
        <p className="text-sm text-zinc-500 mt-2">
          The requested requisition ID or reference number does not exist in the database.
        </p>
        <Link
          href="/procurement"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue/90 transition shadow-sm"
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
      <div className="w-full px-6 sm:px-8 py-8 space-y-8 pb-24">
        <BackButton label="Back to Procurements" />

        {/* Premium Profile Banner with refined soft shadow & border */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)] flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden group hover:border-brand-blue/30 transition-all">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-5 sm:gap-6 relative z-10">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-brand-blue/10 via-brand-blue/5 to-transparent flex items-center justify-center border border-brand-blue/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <span className="text-2xl sm:text-3xl font-bold text-brand-blue tracking-wider font-mono">
                {getInitials(request.title)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-0.5 rounded-lg border border-brand-blue/15">
                  {request.referenceNumber}
                </span>
                <span
                  className={`inline-flex justify-center items-center rounded-full border px-3 py-0.5 text-xs font-semibold whitespace-nowrap min-w-[110px] ${statusBadge.bgClass}`}
                >
                  {statusBadge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${priorityBadge.bgClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${priorityBadge.dotClass}`} />
                  {priorityBadge.label} Priority
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-950">
                {request.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-medium">
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

          <div className="relative z-10 flex flex-col md:items-end justify-between self-stretch pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Est. Value</span>
              <p className="text-2xl sm:text-3xl font-black text-zinc-950 tabular-nums">
                {formatCurrency(request.totalEstimatedAmount, request.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback notification */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-zinc-400 hover:text-zinc-700 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Requisition Details & Specifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            <Section title="Requisition Specifications & Meta" icon={FileSignature}>
              <Row label="Description" value={request.description} />
              <Row label="Department" value={request.department} />
              <Row label="Cost Center" value={request.costCenter || "Default Infrastructure Capex"} />
              <Row
                label="Requester Contact"
                value={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-950">{request.requesterName}</span>
                    {request.requesterEmail && (
                      <span className="text-xs text-zinc-500">({request.requesterEmail})</span>
                    )}
                  </div>
                }
              />
              <Row label="Created Timestamp" value={formatDateTime(request.createdAt)} />
              <Row label="Required On Site" value={formatDate(request.requiredByDate)} />
            </Section>

            {/* Line Items Table */}
            <Section title={`Line Items & Materials Breakdown (${request.items?.length || 0})`} icon={Layers}>
              <div className="overflow-x-auto -mx-6 -my-6">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-3.5 px-6">Material / Specification</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Qty</th>
                      <th className="py-3.5 px-4">Unit Est.</th>
                      <th className="py-3.5 px-6 text-right">Total Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {request.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-4 px-6 max-w-xs">
                          <p className="font-bold text-zinc-950 text-xs">{item.name}</p>
                          {item.preferredVendor && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Preferred Vendor: <span className="font-semibold text-brand-blue">{item.preferredVendor}</span>
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 mt-0.5 italic">{item.notes}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 border border-zinc-200/60">
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
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/70 hover:border-zinc-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-brand-blue shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{att.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {att.size ? `${(att.size / 1024 / 1024).toFixed(2)} MB` : "Document"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Downloading attachment: ${att.name}`)}
                        className="p-2 text-zinc-500 hover:text-brand-blue rounded-xl hover:bg-white transition cursor-pointer shadow-2xs"
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
              <Section title="Requisition Audit History & Timeline" icon={History}>
                <div className="space-y-3.5">
                  {request.auditTrail.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3.5 text-xs border-l-2 border-brand-blue/60 pl-4 py-1"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-zinc-950">{log.action}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">{formatDateTime(log.timestamp)}</span>
                        </div>
                        <p className="text-zinc-500 mt-0.5 font-medium">
                          By <span className="text-zinc-800 font-semibold">{log.actorName}</span> ({log.actorRole})
                        </p>
                        {log.note && (
                          <p className="text-zinc-700 mt-1.5 italic bg-zinc-50 border border-zinc-100 p-2.5 rounded-2xl">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column: Strategic Review & Workflow Actions Panel */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)] sticky top-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-brand-blue" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Review Actions</h3>
                    <p className="text-[11px] text-zinc-500">Live PostgreSQL status change</p>
                  </div>
                </div>
                <span
                  className={`inline-flex justify-center items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge.bgClass}`}
                >
                  {statusBadge.label}
                </span>
              </div>

              {/* Status Decision Buttons Grid */}
              <div className="mt-5 space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Decision
                </label>

                {/* Approve Button */}
                <button
                  type="button"
                  onClick={() => setModalAction("approved")}
                  disabled={isUpdating || request.status === "approved"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
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
                  onClick={() => setModalAction("under_review")}
                  disabled={isUpdating || request.status === "under_review"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Mark Under Review</span>
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
                  onClick={() => setModalAction("revision_requested")}
                  disabled={isUpdating || request.status === "revision_requested"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-900 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
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
                  onClick={() => setModalAction("rejected")}
                  disabled={isUpdating || request.status === "rejected"}
                  className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-rose-900 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
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

              {/* Internal Admin Note Save */}
              <div className="mt-6 pt-5 border-t border-zinc-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Internal Administrative Notes
                </label>
                <textarea
                  rows={3}
                  value={internalAdminNotes}
                  onChange={(e) => setInternalAdminNotes(e.target.value)}
                  placeholder="Budget codes, internal procurement review notes, or RFQ routing remarks..."
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10"
                />
                <button
                  type="button"
                  onClick={() => executeStatusChange(request.status, "Updated internal administration notes.")}
                  disabled={isUpdating}
                  className="mt-3 w-full rounded-full bg-brand-blue py-3 text-xs font-bold text-white hover:bg-brand-blue/90 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Decision Modal with Notes requirement */}
      <Modal
        open={modalAction !== null}
        onClose={() => setModalAction(null)}
        title={`Confirm Decision: ${modalAction?.replace(/_/g, " ").toUpperCase()}`}
        maxWidth="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            You are about to change requisition <span className="font-mono font-bold text-brand-blue">{request.referenceNumber}</span> status to{" "}
            <span className="font-bold text-zinc-950 uppercase">{modalAction?.replace(/_/g, " ")}</span>. This will be recorded permanently in the database audit log.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Decision / Audit Reason {modalAction === "rejected" || modalAction === "revision_requested" ? "(Required)" : "(Optional)"}
            </label>
            <textarea
              rows={3}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder={
                modalAction === "approved"
                  ? "e.g., Approved under Q3 Infrastructure Budget. PO will be issued."
                  : modalAction === "rejected"
                  ? "e.g., Exceeds department budget allocation or redundant specs."
                  : "e.g., Please provide updated supplier quotation and mix design."
              }
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setModalAction(null)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => modalAction && executeStatusChange(modalAction, decisionNote)}
              disabled={isUpdating || ((modalAction === "rejected" || modalAction === "revision_requested") && !decisionNote.trim())}
              className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white hover:bg-brand-blue/90 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm & Record Decision</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
