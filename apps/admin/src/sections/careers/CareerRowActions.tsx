"use client";

import { AlertCircle, Eye, EyeOff, MoreVertical,Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export function CareerRowActions({
  job,
  canDelete,
  onDropdownOpen,
}: {
  job: { id: string; title: string; slug: string; isPublished: boolean };
  canDelete: boolean;
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

  const togglePublished = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/careers/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: !job.isPublished }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/careers/${job.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not delete this posting."));
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
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  void togglePublished();
                }}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                {job.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {job.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  router.push(`/content/careers/${job.id}`);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
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
        title="Delete posting"
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
              disabled={busy || confirmText.trim() !== job.slug}
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
            Deleting <strong className="text-zinc-950">{job.title}</strong> removes it from the
            public careers page permanently. To hide it temporarily, unpublish instead.
          </p>
          <div>
            <label
              htmlFor="confirm-slug"
              className="block text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase"
            >
              Type <span className="font-mono normal-case">{job.slug}</span> to confirm
            </label>
            <input
              id="confirm-slug"
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
