"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export type QuoteFormRequirement = {
  id: string;
  referenceNumber: string | null;
  scopeOfWork: string;
  project: string;
  currency: string;
  closesAt: string;
  quoteId: string | null;
  newPrice: string | null;
  remarks: string | null;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
};

const INPUT =
  "w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-950 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/25";

const LABEL = "text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase";

/**
 * Rendered by both apps/vendor and apps/agent. The only difference between them
 * is `action`, the portal's own BFF path — the price and remarks a participant
 * sees are always and only their own, because the API never sends anyone else's.
 *
 * There is no selling price here because the API does not return one.
 */
export function QuoteForm({
  requirement,
  action,
}: {
  requirement: QuoteFormRequirement;
  action: string;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(requirement.newPrice ?? "");
  const [remarks, setRemarks] = useState(requirement.remarks ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const closes = new Date(requirement.closesAt);
  const submitted = requirement.quoteStatus === "SUBMITTED";

  async function save(submit: boolean) {
    setBusy(true);
    setError(null);
    setSaved(null);

    try {
      const res = await fetch(action, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPrice: price || null, remarks, submit }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not save your quote.");
        return;
      }

      setSaved(submit ? "Submitted." : "Draft saved.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(true);
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className={LABEL} htmlFor="newPrice">
          Your price ({requirement.currency})
        </label>
        <input
          id="newPrice"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className={INPUT}
        />
      </div>

      <div className="space-y-2">
        <label className={LABEL} htmlFor="remarks">
          Remarks
        </label>
        <textarea
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          className={INPUT}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm font-medium text-green-700">{saved}</p> : null}

      <div className="flex flex-wrap gap-2">
        {/* Disabled while in flight so a double-click cannot submit twice. */}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : submitted ? "Update submission" : "Submit"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save(false)}
          className="inline-flex h-11 items-center rounded-md border border-zinc-300 px-5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          Save draft
        </button>
      </div>

      {submitted ? (
        <p className="text-sm text-zinc-600">
          Submitted. You can still change this until{" "}
          {closes.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      ) : null}
    </form>
  );
}
