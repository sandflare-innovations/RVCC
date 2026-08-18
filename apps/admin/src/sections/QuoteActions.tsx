"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Modal, SubmitLoader } from "@/components/ui";

export function QuoteActions({
  requirementId,
  quoteId,
  vendorLabel,
  price,
  currency,
}: {
  requirementId: string;
  quoteId: string;
  vendorLabel: string;
  price: string;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<"SHORTLISTED" | "REJECTED" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus() {
    if (!actionType) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/requirements/${requirementId}/quotes/${quoteId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionType }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not update status.");
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

  function handleActionClick(type: "SHORTLISTED" | "REJECTED") {
    setActionType(type);
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handleActionClick("SHORTLISTED")}
          className="focus-visible:ring-brand-blue flex items-center justify-center gap-1.5 rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm transition-colors hover:border-green-300 hover:bg-green-50 focus-visible:ring-2 focus-visible:outline-none"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Shortlist
        </button>
        <button
          type="button"
          onClick={() => handleActionClick("REJECTED")}
          className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-red-500"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title={actionType === "SHORTLISTED" ? "Shortlist Quote" : "Reject Quote"} maxWidth="sm">
        <div className="p-6">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            {actionType === "SHORTLISTED" ? (
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            )}
            
            <p className="text-sm text-zinc-900">
              Are you sure you want to {actionType === "SHORTLISTED" ? "shortlist" : "reject"} the quote from{" "}
              <span className="font-semibold">{vendorLabel}</span> at{" "}
              <span className="font-semibold tabular-nums">
                {price} {currency}
              </span>
              ?
            </p>
          </div>

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
              onClick={updateStatus}
              className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${actionType === "SHORTLISTED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {busy ? <SubmitLoader text="Processing" /> : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
