"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import type { HeroSlideDTO } from "@rvcc/types";

export function HeroSlideRowActions({
  slide,
  canDelete,
}: {
  slide: HeroSlideDTO;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not delete this slide."));
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
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={busy}
          title={slide.isActive ? "Hide slide from website" : "Show slide on website"}
          className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all ${
            slide.isActive
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 ring-1 ring-zinc-200"
          }`}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : slide.isActive ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Active
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5 text-zinc-400" />
              Draft
            </>
          )}
        </button>

        <Link
          href={`/content/hero/${slide.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-950"
          title="Edit Slide"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>

        {canDelete && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 shadow-xs transition-colors hover:bg-red-50 hover:text-red-700"
            title="Delete Slide"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDelete && (
        <Modal
          open={showDelete}
          onClose={() => !busy && setShowDelete(false)}
          title="Delete Hero Slide"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete the hero slide{" "}
              <strong className="text-zinc-900">
                &ldquo;{slide.title1} {slide.title2}&rdquo;
              </strong>
              ? It will no longer appear on the live homepage.
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={busy}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Slide
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
