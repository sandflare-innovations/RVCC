"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

export function DeleteRequirementConfirmModal({
  open,
  onClose,
  id,
  projectName,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  id: string | null;
  projectName: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id) return null;

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requirements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not delete the requirement. Please try again.");
        setBusy(false);
        return;
      }
      setBusy(false);
      onClose();
      onDeleted();
    } catch {
      setError("Network error. Check connection and try again.");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} maxWidth="md">
      <div className="flex flex-col items-center text-center">
        {/* Glowing Warning Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-xs">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-zinc-950">
          Delete Requirement?
        </h3>

        <div className="my-3 inline-flex max-w-full items-center justify-center rounded-xl bg-zinc-100 px-3.5 py-1.5 text-sm font-semibold text-zinc-800">
          <span className="truncate">"{projectName}"</span>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
          Are you sure you want to permanently delete this requirement? This action cannot be undone.
        </p>

        {/* Warning points */}
        <div className="mt-4 w-full rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-left text-xs text-rose-900 space-y-2">
          <div className="flex items-start gap-2">
            <Trash2 className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>All vendor quotes and submitted pricing records will be erased.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>Supplier invitations for this tender will be removed immediately.</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-100/60 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex w-full items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md focus:ring-[3px] focus:ring-rose-200 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
