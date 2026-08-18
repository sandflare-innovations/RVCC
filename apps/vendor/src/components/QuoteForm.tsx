"use client";

import { useState } from "react";
import { readApiError } from "@/lib/read-error";
import { FullScreenLoader } from "@/components/ui/loader";

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
  fileName?: string | null;
  fileUrl?: string | null;
};

export function QuoteForm({
  requirement,
  action,
}: {
  requirement: QuoteFormRequirement;
  action: string;
}) {
  const submitted = requirement.quoteStatus === "SUBMITTED";
  const [price, setPrice] = useState(requirement.newPrice ?? "");
  const [remarks, setRemarks] = useState(requirement.remarks ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async (submit: boolean) => {
    setBusy(true);
    if (submit) setIsSubmitting(true);
    setError(null);
    setSaved(false);
    
    try {
      const formData = new FormData();
      formData.append("newPrice", price);
      formData.append("remarks", remarks);
      formData.append("submit", String(submit));
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(action, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        setError(await readApiError(res, submit ? "Submit failed." : "Save failed."));
        setIsSubmitting(false);
        return;
      }
      setSaved(true);
      if (submit) {
        // Let the FullScreenLoader show while reloading
        window.location.reload();
      }
    } catch {
      setError("Network error — please try again.");
      setIsSubmitting(false);
    } finally {
      if (!submit) {
        setBusy(false);
      }
    }
  };

  return (
    <>
      {isSubmitting && <FullScreenLoader />}
      <div className="space-y-5">
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {saved && !submitted ? (
          <p role="status" className="text-sm font-medium text-zinc-700">
            Draft saved.
          </p>
        ) : null}

        <label className="block space-y-2">
          <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
            Your price ({requirement.currency})
          </span>
          <input
            type="text"
            inputMode="decimal"
            className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-950"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={submitted || busy}
            placeholder="0.00"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
            Quotation File (Optional)
          </span>
          {submitted && requirement.fileName ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
              <a 
                href={requirement.fileUrl ?? "#"}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline text-sm font-medium"
              >
                {requirement.fileName}
              </a>
            </div>
          ) : (
            <div>
              <input
                type="file"
                className="w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200 disabled:opacity-50"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={submitted || busy}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              {requirement.fileName && !file && !submitted && (
                <p className="mt-2 text-xs text-zinc-500">
                  Currently uploaded: <a href={requirement.fileUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">{requirement.fileName}</a>
                </p>
              )}
            </div>
          )}
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
            Remarks (optional)
          </span>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-950"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={submitted || busy}
          />
        </label>

        {submitted ? (
          <p className="text-sm text-zinc-600">Your quote has been submitted and cannot be edited.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(false)}
              className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-400 disabled:opacity-55"
            >
              {busy ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={busy || !price.trim()}
              onClick={() => void save(true)}
              className="bg-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-55"
            >
              {busy ? "Submitting…" : "Submit quote"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
