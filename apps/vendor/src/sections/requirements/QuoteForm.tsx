"use client";

import { ArrowDownCircle,CheckCircle2, Edit3 } from "lucide-react";
import { useState } from "react";

import { readApiError } from "@/lib/read-error";

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
};

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

  const isFormLocked = isSubmitted && !isRevising;

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
            Bid recorded. You can submit a lower revision anytime before the deadline.
          </p>
          <button
            type="button"
            onClick={() => setIsRevising(true)}
            className="border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors"
          >
            <Edit3 className="h-4 w-4" /> Revise Price / Lower Bid
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!isSubmitted && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(false)}
              className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 hover:border-zinc-400 disabled:opacity-55"
            >
              {busy ? "Saving…" : "Save Draft"}
            </button>
          )}

          {isRevising && (
            <button
              type="button"
              disabled={busy}
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
            disabled={busy || !price.trim()}
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
