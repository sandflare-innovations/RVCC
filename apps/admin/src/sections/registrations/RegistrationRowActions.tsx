"use client";

import { AlertCircle, Eye, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  canDelete = true,
  onDeleted,
  onUpdated,
  onDropdownOpen,
}: {
  registration: RegistrationSummary;
  canDelete?: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onDropdownOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setShowDropdown(false);
        onDropdownOpen?.(false);
      }
    }
    function handleScrollOrResize() {
      setShowDropdown(false);
      onDropdownOpen?.(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [onDropdownOpen]);

  const r = registration;
  const label = r.companyName?.trim() || r.email;

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
          className={`rounded-md p-1.5 transition-colors ${
            showDropdown
              ? "bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30"
              : "text-zinc-600 hover:bg-brand-blue/10 hover:text-brand-blue"
          }`}
          aria-label="Registration actions"
          aria-expanded={showDropdown}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showDropdown &&
          dropdownRef.current &&
          createPortal(
            (() => {
              const rect = dropdownRef.current.getBoundingClientRect();
              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceAbove = rect.top;
              const dropdownHeight = 96; // 2 items + divider + padding
              const fitsBelow = spaceBelow >= dropdownHeight + 12;
              const opensUp =
                !fitsBelow && (spaceAbove >= dropdownHeight + 12 || spaceAbove > spaceBelow);

              const right = Math.max(8, window.innerWidth - rect.right);

              if (opensUp) {
                const bottom = Math.max(8, window.innerHeight - rect.top + 4);
                return (
                  <div
                    ref={menuRef}
                    className="fixed z-[9999] w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      bottom,
                      right,
                      maxHeight: Math.max(80, Math.min(spaceAbove - 12, 320)),
                      overflowY: "auto",
                    }}
                  >
                    <Link
                      href={`/registrations/${r.id}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
                    >
                      <Eye className="h-4 w-4 text-brand-blue" />
                      View details
                    </Link>
                    {canDelete && (
                      <>
                        <div className="my-1 h-px bg-zinc-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowDropdown(false);
                            setError(null);
                            setShowDelete(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
                        >
                          <Trash2 className="h-4 w-4 text-brand-blue" />
                          Delete registration
                        </button>
                      </>
                    )}
                  </div>
                );
              }

              // Opens downward — clamp top so it never hides below screen edge
              const top = Math.max(
                8,
                Math.min(window.innerHeight - dropdownHeight - 12, rect.bottom + 4)
              );
              return (
                <div
                  ref={menuRef}
                  className="fixed z-[9999] w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    top,
                    right,
                    maxHeight: Math.max(80, Math.min(spaceBelow - 12, 320)),
                    overflowY: "auto",
                  }}
                >
                  <Link
                    href={`/registrations/${r.id}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
                  >
                    <Eye className="h-4 w-4 text-brand-blue" />
                    View details
                  </Link>
                  {canDelete && (
                    <>
                      <div className="my-1 h-px bg-zinc-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          setError(null);
                          setShowDelete(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue"
                      >
                        <Trash2 className="h-4 w-4 text-brand-blue" />
                        Delete registration
                      </button>
                    </>
                  )}
                </div>
              );
            })(),
            document.body
          )}
      </div>

      <Modal
        open={showDelete}
        onClose={() => !busy && setShowDelete(false)}
        closeOnBackdropClick={false}
        title="Delete vendor registration"
        description="This cannot be undone."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={busy}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-brand-blue/50 hover:bg-brand-blue/5 hover:text-brand-blue disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-blue px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue/90 focus-visible:ring-2 focus-visible:ring-brand-blue/30 disabled:opacity-55"
            >
              <Trash2 className="h-4 w-4 text-white" />
              {busy ? "Deleting…" : "Yes, Delete Registration"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border-l-4 border-brand-blue bg-brand-blue/5 px-3.5 py-3 text-sm font-medium text-zinc-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Trash2 className="h-5 w-5 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Are you sure you want to delete this vendor registration?
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Registration for <strong className="text-zinc-950">{label}</strong>
                {r.referenceNumber ? ` (${r.referenceNumber})` : ""} will be removed permanently.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3.5 text-xs text-zinc-700">
            <strong className="font-semibold text-brand-blue">Warning:</strong> This will permanently delete the company profile, contacts,
            addresses, bank accounts, questionnaire answers, attachments, and any linked vendor
            portal accounts.
          </div>
        </div>
      </Modal>
    </>
  );
}
