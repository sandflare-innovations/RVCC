"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle, Eye, Trash2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export type RegistrationSummary = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  company: { legalName: string; country: string } | null;
  contactCount: number;
  addressCount: number;
  bankAccountCount: number;
  vendorAccountCount: number;
};

export function RegistrationRowActions({
  registration,
  canDelete,
}: {
  registration: RegistrationSummary;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const r = registration;
  const label = r.company?.legalName?.trim() || r.email;
  // Typed confirmation stands in for the colour cue a red button would give.
  const confirmTarget = r.referenceNumber || r.email;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${r.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not delete this registration."));
        return;
      }
      setShowDelete(false);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/registrations/${r.id}`}
          aria-label={`View details for ${label}`}
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Link>
        {canDelete && (
          <button
            type="button"
            onClick={() => {
              setConfirmText("");
              setError(null);
              setShowDelete(true);
            }}
            aria-label={`Delete ${label}`}
            className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete registration"
        description="This cannot be undone."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={busy}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy || confirmText.trim() !== confirmTarget}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-zinc-700">
            Deleting <strong className="text-zinc-950">{label}</strong> also removes its company
            profile, {r.contactCount} contact{r.contactCount === 1 ? "" : "s"}, {r.addressCount}{" "}
            address{r.addressCount === 1 ? "" : "es"}, {r.bankAccountCount} bank account
            {r.bankAccountCount === 1 ? "" : "s"}, questionnaire answers, attachments
            {r.vendorAccountCount > 0 && (
              <>
                {" "}
                and <strong className="text-zinc-950">{r.vendorAccountCount} portal login</strong>
                {r.vendorAccountCount === 1 ? "" : "s"}
              </>
            )}
            .
          </p>

          <div>
            <label
              htmlFor="confirm-delete"
              className="block text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase"
            >
              Type <span className="font-mono normal-case">{confirmTarget}</span> to confirm
            </label>
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 mt-1.5 w-full rounded-md border border-zinc-300 px-3.5 py-2.5 text-base outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
