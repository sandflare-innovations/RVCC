"use client";

import {
  Check,
  ChevronLeft,
  Eye,
  GripVertical,
  Image as ImageIcon,
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
import type { ProjectDTO } from "@rvcc/types";

export function ProjectsGrid({
  initialProjects,
  canDelete = true,
}: {
  initialProjects: ProjectDTO[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState<ProjectDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active status
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [projects, selectedCategory, searchQuery]);

  const toggleActive = async (project: ProjectDTO) => {
    setBusyProjectId(project.id);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !project.isActive }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, isActive: !p.isActive } : p))
        );
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setBusyProjectId(null);
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

    const nextProjects = [...projects];
    const [moved] = nextProjects.splice(draggedIndex, 1);
    if (!moved) return;
    nextProjects.splice(targetIndex, 0, moved);

    const reordered = nextProjects.map((p, idx) => ({ ...p, sortOrder: idx }));
    setProjects(reordered);
    setDraggedIndex(null);

    setIsSavingOrder(true);
    try {
      await fetch("/api/projects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectIds: reordered.map((p) => p.id) }),
      });
      router.refresh();
    } catch {
      // fallback
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this project."));
        return;
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDrag = !searchQuery && selectedCategory === "All";

  return (
    <>
      {/* Top Header & Search / Filters Toolbar */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
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
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950">Projects</h1>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                  {projects.length} {projects.length === 1 ? "Project" : "Projects"}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Manage architectural portfolio, scope of work, and connected gallery images
              </p>
            </div>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, location, client..."
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

      {/* Category Pills Bar */}
      {categories.length > 2 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#0073bc] text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isSavingOrder && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-[#0073bc]">
          <span className="h-3.5 w-3.5 rounded-full bg-[#0073bc]/30 animate-pulse" />
          <span>Updating project display order...</span>
        </div>
      )}

      {/* Modern Card Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Skeleton Add Card as First Card */}
        <Link
          href="/content/projects/new"
          className="group relative flex min-h-[380px] flex-col justify-between rounded-3xl border-2 border-dashed border-zinc-200/90 bg-zinc-50/50 p-3.5 shadow-2xs transition-all duration-200 hover:border-[#0073bc] hover:bg-blue-50/20 hover:shadow-md cursor-pointer"
        >
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-white/70 flex flex-col items-center justify-center p-4 text-center transition-colors group-hover:border-[#0073bc]/40 group-hover:bg-blue-50/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-2xs transition-all duration-200 group-hover:scale-110 group-hover:bg-[#0073bc] group-hover:text-white">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="mt-3 text-sm font-bold text-zinc-800 group-hover:text-[#0073bc]">
              Create New Project
            </span>
            <span className="mt-0.5 text-[11px] text-zinc-400">
              Add details, scope & gallery pictures
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between p-3 pt-4">
            <div className="space-y-2">
              <div className="h-3 w-4/5 rounded-full bg-zinc-200/70 group-hover:bg-blue-200/60 transition-colors" />
              <div className="h-3 w-3/5 rounded-full bg-zinc-200/50 group-hover:bg-blue-200/40 transition-colors" />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-[#0073bc] transition-colors">
                + Add architectural project
              </span>
              <span className="inline-flex h-7 items-center rounded-xl bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs group-hover:bg-[#0073bc] group-hover:text-white transition-colors">
                Create
              </span>
            </div>
          </div>
        </Link>

        {/* Existing Projects Cards */}
        {filteredProjects.map((project, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          const isBusy = busyProjectId === project.id;
          const galleryCount = project._count?.gallery ?? project.gallery?.length ?? 0;

          return (
            <div
              key={project.id}
              draggable={canDrag}
              onDragStart={(e) => canDrag && handleDragStart(e, index)}
              onDragOver={(e) => canDrag && handleDragOver(e, index)}
              onDragLeave={(e) => canDrag && handleDragLeave(e, index)}
              onDrop={(e) => canDrag && handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} flex-col justify-between overflow-hidden rounded-3xl border bg-white p-3.5 shadow-xs transition-all duration-200 ${
                isDragging
                  ? "scale-[0.98] opacity-40 border-blue-400 shadow-none ring-2 ring-blue-500"
                  : isOver
                    ? "border-blue-500 ring-2 ring-blue-400 ring-offset-2"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {/* Clickable Image & Header */}
              <div>
                <Link
                  href={`/content/projects/${project.id}`}
                  className="block relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-inner border border-zinc-100 group/link"
                >
                  {project.coverImage ? (
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover/link:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-400">
                      No cover image
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {canDrag && (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md cursor-grab active:cursor-grabbing"
                          title="Drag to reposition project"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-800 uppercase shadow-xs backdrop-blur-md">
                        {project.category}
                      </span>
                    </div>

                    <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Connected Gallery Count Badge */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                    <ImageIcon className="h-3 w-3" />
                    <span>{galleryCount} Gallery {galleryCount === 1 ? "Image" : "Images"}</span>
                  </div>
                </Link>

                {/* Project Info */}
                <div className="pt-4">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span>{project.location}</span>
                    <span>{project.year}</span>
                  </div>

                  <Link href={`/content/projects/${project.id}`} className="block group-hover:text-[#0073bc] transition-colors">
                    <h3 className="mt-1 line-clamp-1 text-base font-bold text-zinc-900">
                      {project.title}
                    </h3>
                  </Link>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {project.description || "No description provided."}
                  </p>

                  {project.client && (
                    <div className="mt-2 text-[11px] text-zinc-600">
                      <span className="font-semibold text-zinc-400">Client:</span> {project.client}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                        project.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : project.status === "In Progress"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            : "bg-blue-50 text-[#0073bc] ring-1 ring-blue-200"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Toolbar */}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() => toggleActive(project)}
                  disabled={isBusy}
                  title={project.isActive ? "Hide project from website" : "Show project on website"}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${
                    project.isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 ring-1 ring-zinc-200"
                  }`}
                >
                  {isBusy ? (
                    <span className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
                  ) : project.isActive ? (
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

                {/* Edit & Detail & Delete Actions */}
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/content/projects/${project.id}`}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                    title="View & Edit Details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Manage</span>
                  </Link>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 shadow-2xs transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Delete Project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search Results */}
      {filteredProjects.length === 0 && searchQuery && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800">No projects found</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            No projects match &ldquo;{searchQuery}&rdquo;. Try another search keyword.
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

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <Modal
          open={Boolean(projectToDelete)}
          onClose={() => !isDeleting && setProjectToDelete(null)}
          title="Delete Project"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete the project{" "}
              <strong className="text-zinc-900">&ldquo;{projectToDelete.title}&rdquo;</strong>?
              It will no longer appear on the live website.
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
                onClick={() => setProjectToDelete(null)}
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
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
