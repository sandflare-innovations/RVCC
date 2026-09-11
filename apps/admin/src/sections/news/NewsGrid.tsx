"use client";

import type { NewsEventDTO } from "@rvcc/schemas";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ExternalLink,
  GripVertical,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import { NewsModal } from "./NewsModal";

export function NewsGrid({
  initialNews,
  canDelete = true,
}: {
  initialNews: NewsEventDTO[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<NewsEventDTO[]>(initialNews);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsEventDTO | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<NewsEventDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active status
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const toggleActive = async (item: NewsEventDTO) => {
    setBusyItemId(item.id);
    try {
      const res = await fetch(`/api/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
        );
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setBusyItemId(null);
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

    const nextItems = [...items];
    const [moved] = nextItems.splice(draggedIndex, 1);
    if (!moved) return;
    nextItems.splice(targetIndex, 0, moved);

    const reordered = nextItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    setItems(reordered);
    setDraggedIndex(null);

    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/news/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsIds: reordered.map((i) => i.id) }),
      });
      if (!res.ok) {
        setItems(initialNews);
      } else {
        router.refresh();
      }
    } catch {
      setItems(initialNews);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/news/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Failed to delete article."));
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message || "Network error.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 text-xs text-brand-blue">
              {isSavingOrder && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Loader2 size={13} className="animate-spin" />
                  Saving reorder...
                </span>
              )}
              <span>
                Showing <strong className="font-semibold text-zinc-800">{filteredItems.length}</strong> items
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input
              type="text"
              placeholder="Search news & events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-800 placeholder-zinc-400 focus:border-brand-blue focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-blue/90"
          >
            <Plus size={16} />
            Publish Article
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 py-16 text-center">
          <Newspaper size={32} className="text-zinc-300 mb-3" />
          <p className="text-sm font-semibold text-zinc-700">No articles found</p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery ? "Try refining your search" : "Get started by publishing your first article"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => {
            const isDragged = draggedIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${isOver ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-zinc-200"
                  } ${isDragged ? "opacity-40" : "opacity-100"}`}
              >
                {/* Drag Handle and Badges Bar */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                  {/* Drag Grip icon */}
                  <div className="absolute top-3 left-3 flex cursor-grab items-center gap-1 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 text-white opacity-80 hover:opacity-100">
                    <GripVertical size={13} />
                    <span className="text-[10px] font-mono">#{item.sortOrder + 1}</span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-3 right-3 rounded-md bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand-blue uppercase">
                    {item.category}
                  </div>

                  {/* Date & Edition on Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                    <span className="flex items-center gap-1 text-[11px] font-medium">
                      <Calendar size={12} />
                      {item.date}
                    </span>
                    {item.edition && (
                      <span className="font-mono text-[10px] uppercase opacity-80">
                        {item.edition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-base font-bold tracking-tight text-zinc-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500 mb-6 flex-1">
                    {item.excerpt}
                  </p>

                  {/* Bottom Controls */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                    {/* Active toggle */}
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${item.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                      />
                      {item.isActive ? "Published" : "Draft"}
                    </button>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        title="Edit Article"
                      >
                        <Pencil size={15} />
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete Article"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      {modalOpen && (
        <NewsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={editingItem}
          onSaved={(saved) => {
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
            router.refresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          open={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          title="Delete Article"
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle size={15} />
                <span>{deleteError}</span>
              </div>
            )}
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-900">&ldquo;{itemToDelete.title}&rdquo;</strong>? This
              action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete Forever
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
