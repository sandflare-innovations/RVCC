"use client";

import { Check, ExternalLink, Globe, GripVertical, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import type { ClientPartnerDTO } from "@rvcc/types";
import { ClientModal } from "./ClientModal";

export function ClientsGrid({
  initialClients,
  canDelete = true,
}: {
  initialClients: ClientPartnerDTO[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientPartnerDTO[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientPartnerDTO | null>(null);

  // Delete modal state
  const [clientToDelete, setClientToDelete] = useState<ClientPartnerDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active status
  const [busyClientId, setBusyClientId] = useState<string | null>(null);

  const toggleActive = async (client: ClientPartnerDTO) => {
    setBusyClientId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !client.isActive }),
      });
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, isActive: !c.isActive } : c))
        );
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setBusyClientId(null);
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

    const nextClients = [...clients];
    const [moved] = nextClients.splice(draggedIndex, 1);
    if (!moved) return;
    nextClients.splice(targetIndex, 0, moved);

    const reordered = nextClients.map((c, idx) => ({ ...c, sortOrder: idx }));
    setClients(reordered);
    setDraggedIndex(null);

    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/clients/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: reordered.map((c) => c.id) }),
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
    if (!clientToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this client partner."));
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setClientToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClientSaved = (saved: ClientPartnerDTO) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c));
      }
      return [...prev, saved];
    });
    router.refresh();
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  return (
    <>
      {/* Search & Actions Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or industry..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-xs font-medium text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
            {filteredClients.length} {filteredClients.length === 1 ? "Client" : "Clients"}
          </span>
          {searchQuery && (
            <span className="text-[11px] text-zinc-400">
              (filtered from {clients.length})
            </span>
          )}
        </div>
      </div>

      {isSavingOrder && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-[#0073bc]">
          <span className="h-3.5 w-3.5 rounded-full bg-[#0073bc]/30 animate-pulse" />
          <span>Updating client partner display order...</span>
        </div>
      )}

      {/* Modern 1:1 Aspect Ratio Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {/* 1:1 Aspect Ratio Skeleton Add Card as First Card */}
        <button
          type="button"
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
          className="group relative flex flex-col justify-between rounded-3xl border-2 border-dashed border-zinc-200/90 bg-zinc-50/50 p-3.5 shadow-2xs transition-all duration-200 hover:border-[#0073bc] hover:bg-blue-50/20 hover:shadow-md cursor-pointer text-left"
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#0073bc]">
              + New Client
            </span>
          </div>

          <div className="relative aspect-square w-full rounded-2xl border border-dashed border-zinc-200 bg-white/70 flex flex-col items-center justify-center p-3 text-center transition-colors group-hover:border-[#0073bc]/40 group-hover:bg-blue-50/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-2xs transition-all duration-200 group-hover:scale-110 group-hover:bg-[#0073bc] group-hover:text-white">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-zinc-800 group-hover:text-[#0073bc]">
              Add Logo
            </span>
            <span className="text-[9px] text-zinc-400">1:1 Ratio</span>
          </div>

          <div className="pt-3">
            <div className="h-3 w-3/4 rounded-full bg-zinc-200/70 group-hover:bg-blue-200/60 transition-colors" />
            <div className="mt-1 h-2 w-1/2 rounded-full bg-zinc-200/50 group-hover:bg-blue-200/40 transition-colors" />
            <div className="mt-2.5 border-t border-dashed border-zinc-200 pt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-[#0073bc] transition-colors">
                + Upload
              </span>
            </div>
          </div>
        </button>

        {filteredClients.map((client, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          const isBusy = busyClientId === client.id;
          const canDrag = !searchQuery; // Disable drag during active search filtering to prevent order confusion

          return (
            <div
              key={client.id}
              draggable={canDrag}
              onDragStart={(e) => canDrag && handleDragStart(e, index)}
              onDragOver={(e) => canDrag && handleDragOver(e, index)}
              onDragLeave={(e) => canDrag && handleDragLeave(e, index)}
              onDrop={(e) => canDrag && handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} flex-col justify-between overflow-hidden rounded-3xl border bg-white p-3.5 shadow-xs transition-all duration-200 ${
                isDragging
                  ? "scale-[0.97] opacity-40 border-blue-400 shadow-none ring-2 ring-blue-500"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-400 ring-offset-2"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {/* Top Bar: Drag handle, Order badge */}
              <div className="flex items-center justify-between gap-1.5 pb-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 group-hover:text-zinc-700 transition-colors"
                  title="Drag to reposition client"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400">
                  #{index + 1}
                </span>
              </div>

              {/* 1:1 Square Logo Container with Architectural Accent */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-transform duration-300 group-hover:scale-102">
                <Image
                  src={client.logoUrl}
                  alt={client.name}
                  fill
                  className="object-contain p-2 transition-all duration-300 group-hover:filter-none"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                />

                {/* Subtle Hover Action Buttons */}
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                      setModalOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-zinc-800 shadow-md transition-transform hover:scale-110"
                    title="Edit Client"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {client.websiteUrl && (
                    <a
                      href={client.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-zinc-800 shadow-md transition-transform hover:scale-110"
                      title="Visit Website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientToDelete(client);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-md transition-transform hover:scale-110"
                      title="Delete Client"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Client Info & Active Toggle */}
              <div className="pt-3">
                <h4 className="line-clamp-1 text-xs font-bold text-zinc-900" title={client.name}>
                  {client.name}
                </h4>
                <p className="line-clamp-1 text-[10px] font-medium text-zinc-400">
                  {client.industry || "General"}
                </p>

                <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(client);
                    }}
                    disabled={isBusy}
                    title={client.isActive ? "Hide from website" : "Show on website"}
                    className={`flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold transition-all ${
                      client.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-200"
                    }`}
                  >
                    {isBusy ? (
                      <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
                    ) : client.isActive ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="h-2.5 w-2.5 text-zinc-400" />
                        Draft
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                      setModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-[#0073bc] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search Results */}
      {filteredClients.length === 0 && searchQuery && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800">No clients found</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            No client partners match &ldquo;{searchQuery}&rdquo;. Try searching for another name or sector.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <ClientModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          client={editingClient}
          onSaved={handleClientSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <Modal
          open={Boolean(clientToDelete)}
          onClose={() => !isDeleting && setClientToDelete(null)}
          title="Delete Client Partner"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to remove{" "}
              <strong className="text-zinc-900">&ldquo;{clientToDelete.name}&rdquo;</strong>{" "}
              from the client partners list?
            </p>

            {deleteError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClientToDelete(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 shadow-2xs hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
