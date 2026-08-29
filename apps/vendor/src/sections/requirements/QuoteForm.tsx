"use client";

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
}: {
  requirement: QuoteFormRequirement;
  action: string;
}) {
  const submitted = requirement.quoteStatus === "SUBMITTED";
  const [price, setPrice] = useState(requirement.newPrice ?? "");
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
        body: JSON.stringify({ newPrice: price, remarks, submit }),
      });
      if (!res.ok) {
        setError(await readApiError(res, submit ? "Submit failed." : "Save failed."));
        return;
      }
      setSaved(true);
      if (submit) window.location.reload();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
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
  );
}
