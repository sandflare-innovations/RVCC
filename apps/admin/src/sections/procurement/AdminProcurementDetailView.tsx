"use client";

import {
  AlertCircle,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileSignature,
  FileText,
  History,
  Layers,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";

import { Modal } from "@/components/ui";
import { BackButton } from "@/components/ui/back-button";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getPriorityBadgeInfo,
  getStatusBadgeInfo,
} from "@/lib/procurement/formatters";
import { clearProcurementCache } from "@/lib/procurement/procurement-cache";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";

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
    <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_6px_16px_-4px_rgba(15,23,42,0.06)] transition-all hover:border-zinc-300">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
        {Icon && <Icon className="text-brand-blue h-4 w-4" />}
        <h2 className="text-brand-blue text-xs font-bold tracking-[0.12em] uppercase">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] items-baseline gap-3 border-b border-zinc-100/80 py-3.5 last:border-0">
      <dt className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</dt>
      <dd className="text-sm font-medium break-words text-zinc-900">{value || "—"}</dd>
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
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      <div className="w-full animate-pulse space-y-6 px-8 py-8">
        <div className="h-6 w-36 rounded-lg bg-zinc-200" />
        <div className="h-44 rounded-3xl border border-zinc-100 bg-white shadow-sm" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-64 rounded-3xl border border-zinc-100 bg-white shadow-sm" />
            <div className="h-64 rounded-3xl border border-zinc-100 bg-white shadow-sm" />
          </div>
          <div className="h-96 rounded-3xl border border-zinc-100 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto my-16 max-w-xl rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold text-zinc-900">Requisition Not Found</h2>
        <p className="mt-2 text-sm text-zinc-500">
          The requested requisition ID or reference number does not exist in the database.
        </p>
        <Link
          href="/procurement"
          className="bg-brand-blue hover:bg-brand-blue/90 mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition"
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
    <div className="h-full [scrollbar-width:none] overflow-y-auto bg-white [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="w-full space-y-8 px-6 py-8 pb-24 sm:px-8">
        <BackButton label="Back to Procurements" />

        {/* Premium Profile Banner with refined soft shadow & border */}
        <div className="group hover:border-brand-blue/30 relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)] transition-all sm:p-8 md:flex-row md:items-start">
          <div className="bg-brand-blue/5 pointer-events-none absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-start gap-5 sm:gap-6">
            <div className="from-brand-blue/10 via-brand-blue/5 border-brand-blue/20 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br to-transparent shadow-inner transition-transform duration-500 group-hover:scale-105 sm:h-24 sm:w-24">
              <span className="text-brand-blue font-mono text-2xl font-bold tracking-wider sm:text-3xl">
                {getInitials(request.title)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-brand-blue bg-brand-blue/10 border-brand-blue/15 rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold">
                  {request.referenceNumber}
                </span>
                <span
                  className={`inline-flex min-w-[110px] items-center justify-center rounded-full border px-3 py-0.5 text-xs font-semibold whitespace-nowrap ${statusBadge.bgClass}`}
                >
                  {statusBadge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${priorityBadge.bgClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${priorityBadge.dotClass}`} />
                  {priorityBadge.label} Priority
                </span>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl lg:text-3xl">
                {request.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-zinc-400" />
                  {request.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  {request.requesterName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  Required by {formatDate(request.requiredByDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between self-stretch border-t border-zinc-100 pt-3 md:items-end md:border-t-0 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Total Est. Value
              </span>
              <p className="text-2xl font-black text-zinc-950 tabular-nums sm:text-3xl">
                {formatCurrency(request.totalEstimatedAmount, request.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback notification */}
        {feedbackMsg && (
          <div
            className={`animate-in fade-in slide-in-from-top-2 flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-xs transition-all ${
              feedbackMsg.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Left Column: Requisition Details & Specifications */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview Section */}
            <Section title="Requisition Specifications & Meta" icon={FileSignature}>
              <Row label="Description" value={request.description} />
              <Row label="Department" value={request.department} />
              <Row
                label="Cost Center"
                value={request.costCenter || "Default Infrastructure Capex"}
              />
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
            <Section
              title={`Line Items & Materials Breakdown (${request.items?.length || 0})`}
              icon={Layers}
            >
              <div className="-mx-6 -my-6 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                      <th className="px-6 py-3.5">Material / Specification</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Qty</th>
                      <th className="px-4 py-3.5">Unit Est.</th>
                      <th className="px-6 py-3.5 text-right">Total Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {request.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="transition-colors hover:bg-zinc-50/60">
                        <td className="max-w-xs px-6 py-4">
                          <p className="text-xs font-bold text-zinc-950">{item.name}</p>
                          {item.preferredVendor && (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              Preferred Vendor:{" "}
                              <span className="text-brand-blue font-semibold">
                                {item.preferredVendor}
                              </span>
                            </p>
                          )}
                          {item.notes && (
                            <p className="mt-0.5 text-[11px] text-zinc-400 italic">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="rounded-md border border-zinc-200/60 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold whitespace-nowrap text-zinc-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-4 font-medium whitespace-nowrap text-zinc-600">
                          {formatCurrency(item.estimatedUnitPrice, request.currency)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold whitespace-nowrap text-zinc-950">
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
              <Section
                title={`Supporting Attachments (${request.attachments.length})`}
                icon={FileText}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {request.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 transition-all hover:border-zinc-300 hover:bg-zinc-100/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="text-brand-blue h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-900">{att.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {att.size ? `${(att.size / 1024 / 1024).toFixed(2)} MB` : "Document"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Downloading attachment: ${att.name}`)}
                        className="hover:text-brand-blue cursor-pointer rounded-xl p-2 text-zinc-500 shadow-2xs transition hover:bg-white"
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
                      className="border-brand-blue/60 flex items-start gap-3.5 border-l-2 py-1 pl-4 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-zinc-950">{log.action}</p>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="mt-0.5 font-medium text-zinc-500">
                          By <span className="font-semibold text-zinc-800">{log.actorName}</span> (
                          {log.actorRole})
                        </p>
                        {log.note && (
                          <p className="mt-1.5 rounded-2xl border border-zinc-100 bg-zinc-50 p-2.5 text-zinc-700 italic">
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
            <div className="sticky top-6 rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="text-brand-blue h-5 w-5" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">Review Actions</h3>
                    <p className="text-[11px] text-zinc-500">Live PostgreSQL status change</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge.bgClass}`}
                >
                  {statusBadge.label}
                </span>
              </div>

              {/* Status Decision Buttons Grid */}
              <div className="mt-5 space-y-2.5">
                <label className="block text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  Select Decision
                </label>

                {/* Approve Button */}
                <button
                  type="button"
                  onClick={() => setModalAction("approved")}
                  disabled={isUpdating || request.status === "approved"}
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs font-bold text-emerald-900 shadow-2xs transition hover:bg-emerald-100/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Approve Requisition</span>
                  </div>
                  {request.status === "approved" && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Current
                    </span>
                  )}
                </button>

                {/* Under Review Button */}
                <button
                  type="button"
                  onClick={() => setModalAction("under_review")}
                  disabled={isUpdating || request.status === "under_review"}
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs font-bold text-amber-900 shadow-2xs transition hover:bg-amber-100/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Mark Under Review</span>
                  </div>
                  {request.status === "under_review" && (
                    <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Current
                    </span>
                  )}
                </button>

                {/* Request Revisions Button */}
                <button
                  type="button"
                  onClick={() => setModalAction("revision_requested")}
                  disabled={isUpdating || request.status === "revision_requested"}
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 text-xs font-bold text-purple-900 shadow-2xs transition hover:bg-purple-100/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <span>Request Revisions</span>
                  </div>
                  {request.status === "revision_requested" && (
                    <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Current
                    </span>
                  )}
                </button>

                {/* Reject Button */}
                <button
                  type="button"
                  onClick={() => setModalAction("rejected")}
                  disabled={isUpdating || request.status === "rejected"}
                  className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs font-bold text-rose-900 shadow-2xs transition hover:bg-rose-100/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Reject Requisition</span>
                  </div>
                  {request.status === "rejected" && (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Current
                    </span>
                  )}
                </button>
              </div>

              {/* Internal Admin Note Save */}
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <label className="mb-2 block text-xs font-bold tracking-wider text-zinc-700 uppercase">
                  Internal Administrative Notes
                </label>
                <textarea
                  rows={3}
                  value={internalAdminNotes}
                  onChange={(e) => setInternalAdminNotes(e.target.value)}
                  placeholder="Budget codes, internal procurement review notes, or RFQ routing remarks..."
                  className="focus:border-brand-blue focus:ring-brand-blue/10 w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 transition outline-none focus:bg-white focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    executeStatusChange(request.status, "Updated internal administration notes.")
                  }
                  disabled={isUpdating}
                  className="bg-brand-blue hover:bg-brand-blue/90 mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full py-3 text-xs font-bold text-white shadow-2xs transition disabled:opacity-50"
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
        <div className="space-y-4 p-6">
          <p className="text-xs leading-relaxed text-zinc-600">
            You are about to change requisition{" "}
            <span className="text-brand-blue font-mono font-bold">{request.referenceNumber}</span>{" "}
            status to{" "}
            <span className="font-bold text-zinc-950 uppercase">
              {modalAction?.replace(/_/g, " ")}
            </span>
            . This will be recorded permanently in the database audit log.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-700 uppercase">
              Decision / Audit Reason{" "}
              {modalAction === "rejected" || modalAction === "revision_requested"
                ? "(Required)"
                : "(Optional)"}
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
              className="focus:border-brand-blue focus:ring-brand-blue/10 w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 transition outline-none focus:bg-white focus:ring-2"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => setModalAction(null)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => modalAction && executeStatusChange(modalAction, decisionNote)}
              disabled={
                isUpdating ||
                ((modalAction === "rejected" || modalAction === "revision_requested") &&
                  !decisionNote.trim())
              }
              className="bg-brand-blue hover:bg-brand-blue/90 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
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
