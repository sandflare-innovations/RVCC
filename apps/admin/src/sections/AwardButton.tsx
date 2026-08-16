"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

/**
 * Awarding is a commercial commitment, so it is never one misclick away: the
 * confirmation names the supplier and the price, and says plainly when awarding
 * would close a requirement that is still open.
 */
export function AwardButton({
  requirementId,
  quoteId,
  vendorLabel,
  price,
  currency,
  project,
  closesAt,
}: {
  requirementId: string;
  quoteId: string;
  vendorLabel: string;
  price: string;
  currency: string;
  project: string;
  closesAt: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stillOpen = new Date(closesAt).getTime() > Date.now();

  async function award() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/requirements/${requirementId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not award this requirement.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
      >
        Award
      </button>
    );
  }

  return (
    <div className="space-y-2 text-left">
      <p className="text-xs text-zinc-700">
        Award <span className="font-semibold">{project}</span> to {vendorLabel} at {price}{" "}
        {currency}?
      </p>
      {stillOpen ? (
        <p className="text-xs text-amber-700">
          This requirement is still open until{" "}
          {new Date(closesAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Awarding now closes it early.
        </p>
      ) : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={award}
          className="bg-brand-blue hover:bg-brand-blue/90 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
        >
          {busy ? "Awarding…" : "Confirm award"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
