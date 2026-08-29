"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, Trophy } from "lucide-react";

import { Modal, SubmitLoader } from "@/components/ui";

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
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-visible:ring-brand-blue rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:outline-none"
      >
        Award
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Award Requirement" maxWidth="sm">
        <div className="p-6">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <div className="bg-brand-blue/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Trophy className="text-brand-blue h-6 w-6" />
            </div>
            <p className="text-sm text-zinc-900">
              Award <span className="font-semibold">{project}</span> to{" "}
              <span className="font-semibold">{vendorLabel}</span> at{" "}
              <span className="font-semibold tabular-nums">
                {price} {currency}
              </span>
              ?
            </p>
          </div>

          {stillOpen && (
            <div className="mb-6 flex gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                This requirement is still open until{" "}
                <span className="font-semibold">
                  {closesAt && !isNaN(new Date(closesAt).getTime())
                    ? new Date(closesAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
                . Awarding now closes it early.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={award}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {busy ? <SubmitLoader text="Awarding" /> : "Confirm Award"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
