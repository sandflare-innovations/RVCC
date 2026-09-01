"use client";

import {
  ArrowDownCircle,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";

import { readApiError } from "@/lib/read-error";

export type QuoteAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
};

export type QuoteFormRequirement = {
  id: string;
  referenceNumber: string | null;
  project: string;
  scopeOfWork: string;
  currency: string;
  closesAt: string;
  newPrice: string | null;
  remarks: string | null;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
  attachments?: QuoteAttachmentItem[];
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function QuoteForm({
  requirement,
  action,
  onSubmitted,
}: {
  requirement: QuoteFormRequirement;
  action: string;
  onSubmitted?: () => void;
}) {
  const [isSubmitted, setIsSubmitted] = useState(requirement.quoteStatus === "SUBMITTED");
  const [isRevising, setIsRevising] = useState(false);
  const [price, setPrice] = useState(requirement.newPrice ?? "");
  const [currency, setCurrency] = useState(requirement.currency ?? "SAR");
  const [remarks, setRemarks] = useState(requirement.remarks ?? "");
  const [attachments, setAttachments] = useState<QuoteAttachmentItem[]>(
    requirement.attachments ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormLocked = isSubmitted && !isRevising;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    if (file.size > 15 * 1024 * 1024) {
      setError("File must be 15 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/requirements/${requirement.id}/quote/attachment`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload document."));
        return;
      }

      const data = await res.json();
      if (data.attachment) {
        setAttachments((prev) => [...prev, data.attachment]);
      }
    } catch {
      setError("Network error uploading file — please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    setError(null);
    try {
      const res = await fetch(
        `/api/requirements/${requirement.id}/quote/attachment/${attachmentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        setError(await readApiError(res, "Failed to delete attachment."));
        return;
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      setError("Network error deleting attachment.");
    } finally {
      setDeletingId(null);
    }
  };

  const save = async (submit: boolean) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(action, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPrice: price, currency, remarks, submit }),
      });
      if (!res.ok) {
        setError(await readApiError(res, submit ? "Submit failed." : "Save failed."));
        return;
      }
      setSaved(true);
      if (submit) {
        setIsSubmitted(true);
        setIsRevising(false);
        if (onSubmitted) onSubmitted();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}
      {saved && !isSubmitted ? (
        <p
          role="status"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium text-zinc-700"
        >
          Draft saved.
        </p>
      ) : null}

      <label className="block space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
            {isRevising ? "Your Revised Bid Price" : "Your Price"}
          </span>
          {isSubmitted && !isRevising && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Submitted
            </span>
          )}
        </div>
        <div className="focus-within:border-brand-blue focus-within:ring-brand-blue flex w-full overflow-hidden rounded-xl border border-zinc-300 bg-white transition-all focus-within:ring-1">
          <select
            className={`border-r border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-bold text-zinc-600 focus:outline-none ${isFormLocked ? "opacity-70" : ""}`}
            value={currency}
            onChange={(e) => {
              if (error) setError(null);
              setCurrency(e.target.value);
            }}
            disabled={isFormLocked || busy}
          >
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
            <option value="AED">AED</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            className={`w-full px-3.5 py-2.5 text-base font-semibold transition-all focus:outline-none ${
              isFormLocked ? "bg-zinc-50 text-zinc-600" : "bg-white text-zinc-950"
            }`}
            value={price}
            onChange={(e) => {
              if (error) setError(null);
              setPrice(e.target.value);
            }}
            disabled={isFormLocked || busy}
            placeholder="0.00"
          />
        </div>
        {currency !== "SAR" && (
          <p className="text-[11px] font-medium text-zinc-500">
            * Bids are normalized to SAR at today's exchange rate for fair evaluation.
          </p>
        )}
      </label>

      {/* Quote Document Attachments Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-zinc-500" /> Supporting Documents / Quotation PDF (Optional)
          </span>
          <span className="text-[11px] text-zinc-400">PDF, PNG, JPG up to 15MB</span>
        </div>

        {/* Uploaded Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 text-sm transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-blue border border-blue-100">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-semibold text-zinc-900 hover:text-brand-blue transition-colors"
                      title={att.fileName}
                    >
                      {att.fileName}
                    </a>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {formatBytes(att.fileSize)}
                    </span>
                  </div>
                </div>

                {!isFormLocked && (
                  <button
                    type="button"
                    disabled={deletingId === att.id || busy}
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Remove file"
                  >
                    {deletingId === att.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {!isFormLocked && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="quote-file-upload"
              disabled={uploading || busy}
            />
            <label
              htmlFor="quote-file-upload"
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-3 text-xs font-bold text-zinc-700 transition-all hover:border-brand-blue hover:bg-blue-50/30 hover:text-brand-blue ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                  <span>Uploading Document…</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Attach Quotation / Specification Document</span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
          Remarks (optional)
        </span>
        <textarea
          className={`min-h-[90px] w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
            isFormLocked
              ? "border-zinc-200 bg-zinc-50 text-zinc-600"
              : "focus:border-brand-blue focus:ring-brand-blue border-zinc-300 bg-white text-zinc-950 focus:ring-1"
          }`}
          value={remarks}
          onChange={(e) => {
            if (error) setError(null);
            setRemarks(e.target.value);
          }}
          disabled={isFormLocked || busy}
          placeholder="Add any details, delivery schedules, or warranty terms..."
        />
      </label>

      {isSubmitted && !isRevising ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-zinc-500">
            Bid recorded. You can submit a lower revision or update files anytime before the deadline.
          </p>
          <button
            type="button"
            onClick={() => setIsRevising(true)}
            className="border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors"
          >
            <Edit3 className="h-4 w-4" /> Revise Price / Update Documents
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!isSubmitted && (
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => void save(false)}
              className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 hover:border-zinc-400 disabled:opacity-55"
            >
              {busy ? "Saving…" : "Save Draft"}
            </button>
          )}

          {isRevising && (
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => {
                setPrice(requirement.newPrice ?? "");
                setIsRevising(false);
              }}
              className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            disabled={busy || uploading || !price.trim()}
            onClick={() => void save(true)}
            className="bg-brand-blue inline-flex min-h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-55"
          >
            {isRevising ? (
              <>
                <ArrowDownCircle className="h-4 w-4" />
                {busy ? "Submitting Revision…" : "Submit Revised Bid"}
              </>
            ) : busy ? (
              "Submitting…"
            ) : (
              "Submit Quote"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
