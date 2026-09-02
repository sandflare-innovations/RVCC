"use client";

import { Check, GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import type { HeroSlideDTO } from "@rvcc/types";

export function HeroSlidesGrid({
  initialSlides,
  canDelete = true,
}: {
  initialSlides: HeroSlideDTO[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlideDTO[]>(initialSlides);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Delete modal state
  const [slideToDelete, setSlideToDelete] = useState<HeroSlideDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active state per slide
  const [busySlideId, setBusySlideId] = useState<string | null>(null);

  const toggleActive = async (slide: HeroSlideDTO) => {
    setBusySlideId(slide.id);
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      if (res.ok) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, isActive: !s.isActive } : s))
        );
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setBusySlideId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const nextSlides = [...slides];
    const [moved] = nextSlides.splice(draggedIndex, 1);
    if (!moved) return;
    nextSlides.splice(targetIndex, 0, moved);

    // Reassign sortOrder locally for snappy feedback
    const reordered = nextSlides.map((s, idx) => ({ ...s, sortOrder: idx }));
    setSlides(reordered);
    setDraggedIndex(null);

    // Persist reorder to server
    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/hero-slides/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIds: reordered.map((s) => s.id) }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // rollback if needed
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const confirmDelete = async () => {
    if (!slideToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/hero-slides/${slideToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this slide."));
        return;
      }

      setSlides((prev) => prev.filter((s) => s.id !== slideToDelete.id));
      setSlideToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {isSavingOrder && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-[#0073bc]">
          <span className="h-3.5 w-3.5 rounded-full bg-[#0073bc]/30 animate-pulse" />
          <span>Updating slide order...</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          const isBusy = busySlideId === slide.id;

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={(e) => handleDragLeave(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex cursor-grab flex-col rounded-3xl border bg-white p-3 shadow-xs transition-all duration-200 active:cursor-grabbing ${
                isDragging
                  ? "scale-[0.98] opacity-40 border-blue-400 shadow-none ring-2 ring-blue-500"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-400 ring-offset-2"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {/* Image Preview Container with rounded bottom */}
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-white shadow-inner border border-zinc-100">
                {slide.imageUrl ? (
                  <Image
                    src={slide.imageUrl}
                    alt={`${slide.title1} ${slide.title2}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-400">
                    No preview image
                  </div>
                )}

                {/* Top Badges & Drag Grip Indicator */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md cursor-grab active:cursor-grabbing"
                      title="Drag to reposition slide order"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-800 uppercase shadow-xs backdrop-blur-md">
                      {slide.badge || "Slide"}
                    </span>
                  </div>

                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                    Order #{index + 1}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-3 pt-4">
                <div>
                  <h4 className="line-clamp-1 text-base font-bold text-zinc-900">
                    <span>{slide.title1} </span>
                    <span className="text-[#0073bc]">{slide.title2}</span>
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                    {slide.description || "No description provided."}
                  </p>
                </div>

                {/* CTA Buttons preview */}
                {(slide.primaryBtnText || slide.secondaryBtnText) && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-2">
                    {slide.primaryBtnText && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0073bc]">
                        {slide.primaryBtnText}
                      </span>
                    )}
                    {slide.secondaryBtnText && (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {slide.secondaryBtnText}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Toolbar with Delete Option */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(slide);
                    }}
                    disabled={isBusy}
                    title={slide.isActive ? "Hide slide from website" : "Show slide on website"}
                    className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${
                      slide.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 ring-1 ring-zinc-200"
                    }`}
                  >
                    {isBusy ? (
                      <span className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
                    ) : slide.isActive ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-zinc-400" />
                        Draft
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/content/hero/${encodeURIComponent(slide.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                      title="Edit Slide"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlideToDelete(slide);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 shadow-xs transition-colors hover:bg-red-50 hover:text-red-700"
                        title="Delete Slide"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Final Card: Add New Slide (Skeleton Card Design) */}
        <Link
          href="/content/hero/new"
          className="group relative flex min-h-[360px] flex-col justify-between rounded-3xl border-2 border-dashed border-zinc-200/90 bg-zinc-50/50 p-3 shadow-2xs transition-all duration-200 hover:border-[#0073bc] hover:bg-blue-50/20 hover:shadow-md"
        >
          {/* Skeleton Image Area with rounded bottom */}
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-white/70 flex flex-col items-center justify-center text-center p-4 transition-colors group-hover:border-[#0073bc]/40 group-hover:bg-blue-50/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-2xs transition-all duration-200 group-hover:scale-110 group-hover:bg-[#0073bc] group-hover:text-white">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="mt-3 text-sm font-bold text-zinc-800 group-hover:text-[#0073bc]">
              Add New Slide
            </span>
            <span className="mt-0.5 text-[11px] text-zinc-400">
              Upload image & configure headline
            </span>
          </div>

          {/* Skeleton Body Area */}
          <div className="flex flex-1 flex-col justify-between p-3 pt-4">
            <div className="space-y-2">
              <div className="h-3 w-4/5 rounded-full bg-zinc-200/70 group-hover:bg-blue-200/60" />
              <div className="h-3 w-3/5 rounded-full bg-zinc-200/50 group-hover:bg-blue-200/40" />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-[#0073bc] transition-colors">
                + Create new slide
              </span>
              <span className="inline-flex h-7 items-center rounded-xl bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs group-hover:bg-[#0073bc] group-hover:text-white transition-colors">
                Create
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {slideToDelete && (
        <Modal
          open={Boolean(slideToDelete)}
          onClose={() => !isDeleting && setSlideToDelete(null)}
          title="Delete Hero Slide"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete the hero slide{" "}
              <strong className="text-zinc-900">
                &ldquo;{slideToDelete.title1} {slideToDelete.title2}&rdquo;
              </strong>
              ? It will no longer appear on the live homepage.
            </p>

            {deleteError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Slide
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
