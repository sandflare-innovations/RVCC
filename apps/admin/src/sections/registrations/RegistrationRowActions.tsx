"use client";

import { AlertCircle, ExternalLink, Eye, MoreVertical,Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

/** Slim list row — full record lives on the detail page. */
export type RegistrationSummary = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  companyName: string | null;
};

export function RegistrationRowActions({
  registration,
  canDelete,
  onDeleted,
  onUpdated,
  onDropdownOpen,
}: {
  registration: RegistrationSummary;
  canDelete: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onDropdownOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        onDropdownOpen?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const r = registration;
  const label = r.companyName?.trim() || r.email;
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
      onDeleted?.();
      if (!onDeleted) router.refresh();
      else onUpdated?.();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`relative flex items-center justify-end ${showDropdown ? "z-[60]" : ""}`}
        ref={dropdownRef}
      >
        <button
          type="button"
          onClick={() => {
            const next = !showDropdown;
            setShowDropdown(next);
            onDropdownOpen?.(next);
          }}
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showDropdown &&
          dropdownRef.current &&
          createPortal(
            <div
              className="fixed z-[9999] w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-xl"
              style={{
                top: dropdownRef.current.getBoundingClientRect().bottom + 4,
                right: window.innerWidth - dropdownRef.current.getBoundingClientRect().right,
              }}
            >
              <Link
                href={`/registrations/${r.id}`}
                onClick={() => setShowDropdown(false)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <Eye className="h-4 w-4" />
                View details
              </Link>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    setConfirmText("");
                    setError(null);
                    setShowDelete(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>,
            document.body
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
            profile, contacts, addresses, bank accounts, questionnaire answers, attachments, and any
            portal logins linked to this registration.
          </p>

          <p className="text-sm text-zinc-600">
            Prefer the full record?{" "}
            <Link
              href={`/registrations/${r.id}`}
              className="text-brand-blue inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
            >
              Open <ExternalLink className="h-3.5 w-3.5" />
            </Link>
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
