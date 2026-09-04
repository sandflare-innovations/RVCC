"use client";

import {
  Building2,
  Check,
  ChevronLeft,
  ExternalLink,
  Globe,
  GripVertical,
  Loader2,
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
import type { SisterCompanyDTO } from "@rvcc/types";
import { CompanyModal } from "./CompanyModal";

export function CompaniesGrid({
  initialCompanies,
  canDelete = true,
}: {
  initialCompanies: SisterCompanyDTO[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState<SisterCompanyDTO[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SisterCompanyDTO | null>(null);

  // Delete modal state
  const [companyToDelete, setCompanyToDelete] = useState<SisterCompanyDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active status
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);

  const toggleActive = async (company: SisterCompanyDTO) => {
    setBusyCompanyId(company.id);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !company.isActive }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === company.id ? { ...c, isActive: !c.isActive } : c))
        );
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setBusyCompanyId(null);
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

    const nextCompanies = [...companies];
    const [moved] = nextCompanies.splice(draggedIndex, 1);
    if (!moved) return;
    nextCompanies.splice(targetIndex, 0, moved);

    const reordered = nextCompanies.map((c, idx) => ({ ...c, sortOrder: idx }));
    setCompanies(reordered);
    setDraggedIndex(null);

    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/companies/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: reordered.map((c) => c.id) }),
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
    if (!companyToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/companies/${companyToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this sister concern company."));
        return;
      }

      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id));
      setCompanyToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCompanySaved = (saved: SisterCompanyDTO) => {
    setCompanies((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c));
      }
      return [...prev, saved];
    });
    router.refresh();
  };

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q))
    );
  }, [companies, searchQuery]);

  return (
    <>
      {/* Top Header with Title on Left and Search on Right (Same Row) */}
      <div className="flex flex-col gap-4 bg-white pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-5 w-5 text-[#0073bc]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950">Our Sister Concern Companies</h1>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                  {filteredCompanies.length} {filteredCompanies.length === 1 ? "Company" : "Companies"}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Manage subsidiary logos, names, categories, and interactive 1:1 display order
              </p>
            </div>
          </div>
        </div>

        {/* Right side search input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or sector..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-9 text-xs font-medium text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isSavingOrder && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-[#0073bc]">
          <span className="h-3.5 w-3.5 rounded-full bg-[#0073bc]/30 animate-pulse" />
          <span>Updating sister company display order...</span>
        </div>
      )}

      {/* Modern 1:1 Aspect Ratio Grid - larger cards with fewer columns per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* 1:1 Aspect Ratio Skeleton Add Card as First Card */}
        <button
          type="button"
          onClick={() => {
            setEditingCompany(null);
            setModalOpen(true);
          }}
          className="group relative flex flex-col justify-between rounded-3xl border-2 border-dashed border-zinc-200/90 bg-zinc-50/50 p-3.5 shadow-2xs transition-all duration-200 hover:border-[#0073bc] hover:bg-blue-50/20 hover:shadow-md cursor-pointer text-left"
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#0073bc]">
              + New Company
            </span>
          </div>

          <div className="relative aspect-square w-full rounded-2xl border border-dashed border-zinc-200 bg-white/70 flex flex-col items-center justify-center p-3 text-center transition-colors group-hover:border-[#0073bc]/40 group-hover:bg-blue-50/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-2xs transition-all duration-200 group-hover:scale-110 group-hover:bg-[#0073bc] group-hover:text-white">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-zinc-800 group-hover:text-[#0073bc]">
              Add Sister Company
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-zinc-400">
              Upload logo & details
            </span>
          </div>

          <div className="pt-2 text-center text-[10px] font-medium text-zinc-400">
            PNG / WebP (1:1 / Free Aspect)
          </div>
        </button>

        {/* Existing Company Cards */}
        {filteredCompanies.map((company, index) => {
          const isOver = dragOverIndex === index;
          const isDragged = draggedIndex === index;
          const isBusy = busyCompanyId === company.id;

          return (
            <div
              key={company.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={(e) => handleDragLeave(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:border-[#0073bc]/40 hover:shadow-md cursor-grab active:cursor-grabbing select-none ${
                isOver ? "border-[#0073bc] ring-2 ring-[#0073bc]/20 scale-[1.02]" : ""
              } ${isDragged ? "opacity-40" : ""}`}
            >
              {/* Card Header: Reorder handle & badge */}
              <div className="flex items-center justify-between pb-2">
                <div
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5 cursor-grab active:cursor-grabbing" />
                  <span className="font-mono text-[10px] font-medium text-zinc-400">
                    #{index + 1}
                  </span>
                </div>

                {company.websiteUrl && (
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-[#0073bc] transition-colors"
                    title="Open website"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* 1:1 Aspect Ratio Logo Box */}
              <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center p-3 overflow-hidden group-hover:bg-zinc-50/50 transition-colors">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={company.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Globe className="h-10 w-10 text-zinc-300" />
                )}

                {/* Quick overlay action buttons on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-2xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCompany(company);
                      setModalOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-zinc-800 shadow-md hover:bg-zinc-100 hover:text-[#0073bc] transition-all"
                    title="Edit company"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompanyToDelete(company);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-600 shadow-md hover:bg-rose-50 transition-all"
                      title="Delete company"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Company Info & Active Toggle */}
              <div className="pt-3.5">
                <h4 className="line-clamp-1 text-sm font-bold text-zinc-900" title={company.name}>
                  {company.name}
                </h4>
                <p className="line-clamp-1 text-xs font-medium text-zinc-400 mt-0.5">
                  {company.industry || "Sister Concern"}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(company);
                    }}
                    disabled={isBusy}
                    title={company.isActive ? "Hide from website" : "Show on website"}
                    className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${
                      company.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-200"
                    }`}
                  >
                    {isBusy ? (
                      <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
                    ) : company.isActive ? (
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
                      setEditingCompany(company);
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
      {filteredCompanies.length === 0 && searchQuery && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800">No companies found</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            No sister concern companies match &ldquo;{searchQuery}&rdquo;. Try searching for another name or sector.
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
        <CompanyModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          company={editingCompany}
          onSaved={handleCompanySaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {companyToDelete && (
        <Modal
          open={Boolean(companyToDelete)}
          onClose={() => !isDeleting && setCompanyToDelete(null)}
          title="Delete Sister Concern Company"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to remove{" "}
              <strong className="text-zinc-900">&ldquo;{companyToDelete.name}&rdquo;</strong>{" "}
              from the sister concern companies list?
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
                onClick={() => setCompanyToDelete(null)}
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
                <span>Delete Company</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
