"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import type { GalleryImageDTO, ProjectDTO, ProjectInput, ProjectStatus } from "@rvcc/types";

const STATUS_OPTIONS: ProjectStatus[] = ["Completed", "In Progress", "Upcoming"];

const DEFAULT_CATEGORIES = [
  "Commercial Architecture",
  "Residential Architecture",
  "Corporate Infrastructure",
  "Landscape & Urbanism",
  "Industrial Engineering",
  "Civil Construction",
  "Structural Steel",
  "Interior Finishing",
];

export const AVAILABLE_SERVICES = [
  { slug: "artificial-grass", label: "Artificial Grass" },
  { slug: "architectural-service", label: "Architectural Service" },
  { slug: "artificial-lakes", label: "Artificial Lakes" },
  { slug: "cladding-works", label: "Cladding Works" },
  { slug: "fountain-services", label: "Fountain Services" },
  { slug: "hardscaping-works", label: "Hardscaping Works" },
  { slug: "irrigation-plantation", label: "Irrigation & Plantation" },
  { slug: "land-development", label: "Land Development" },
  { slug: "landscape-works", label: "Landscape Works" },
  { slug: "steel-metal-works", label: "Steel Works / Metal Works" },
  { slug: "sand-removal-earthwork", label: "Sand Removal Earth Work" },
  { slug: "building-projects", label: "Building Projects" },
];

export function ProjectEditor({ initial }: { initial: Partial<ProjectDTO> }) {
  const router = useRouter();
  const isEditing = Boolean(initial.id);

  const [form, setForm] = useState<ProjectInput>({
    title: initial.title ?? "",
    slug: initial.slug ?? "",
    category: initial.category ?? "Commercial Architecture",
    serviceSlugs: initial.serviceSlugs ?? [],
    client: initial.client ?? "",
    location: initial.location ?? "Riyadh, KSA",
    year: initial.year ?? new Date().getFullYear().toString(),
    status: (initial.status as ProjectStatus) ?? "Completed",
    description: initial.description ?? "",
    coverImage: initial.coverImage ?? "",
    scope: initial.scope ?? [],
    sortOrder: initial.sortOrder ?? 0,
    isActive: initial.isActive ?? true,
  });

  const [newScopeTag, setNewScopeTag] = useState("");
  const [galleryImages, setGalleryImages] = useState<GalleryImageDTO[]>(initial.gallery ?? []);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gallery item delete modal
  const [imageToDelete, setImageToDelete] = useState<GalleryImageDTO | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Project delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setField = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addScopeTag = () => {
    if (!newScopeTag.trim()) return;
    if (form.scope?.includes(newScopeTag.trim())) return;
    setField("scope", [...(form.scope ?? []), newScopeTag.trim()]);
    setNewScopeTag("");
  };

  const removeScopeTag = (tag: string) => {
    setField("scope", (form.scope ?? []).filter((s) => s !== tag));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", `projects/${form.slug || "general"}`);
      data.append("label", form.title ? form.title : "project-cover");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload cover image."));
        return;
      }

      const json = (await res.json()) as { fileUrl: string };
      setField("coverImage", json.fileUrl);
    } catch {
      setError("Network error while uploading cover image.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!initial.id) {
      setError("Please save the project first before uploading gallery images.");
      return;
    }

    setUploadingGallery(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("folder", `gallery/${form.slug || "project"}`);
        uploadForm.append("label", `${form.title || "image"}-${i + 1}`);

        const uploadRes = await fetch("/api/content/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) continue;
        const uploadData = (await uploadRes.json()) as { fileUrl: string };

        // Link directly to project via separate gallery table
        const linkRes = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: initial.id,
            imageUrl: uploadData.fileUrl,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            sortOrder: galleryImages.length + i,
            isActive: true,
            isCover: !form.coverImage && galleryImages.length === 0 && i === 0,
          }),
        });

        if (linkRes.ok) {
          const created = (await linkRes.json()) as { image: GalleryImageDTO };
          setGalleryImages((prev) => [...prev, created.image]);
          if (!form.coverImage && galleryImages.length === 0 && i === 0) {
            setField("coverImage", uploadData.fileUrl);
          }
        }
      }
      router.refresh();
    } catch {
      setError("Failed to upload some gallery images.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSetCover = async (img: GalleryImageDTO) => {
    setField("coverImage", img.imageUrl);
    setGalleryImages((prev) =>
      prev.map((item) => ({
        ...item,
        isCover: item.id === img.id,
      }))
    );

    if (initial.id) {
      try {
        await Promise.all([
          fetch(`/api/projects/${initial.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImage: img.imageUrl }),
          }),
          fetch(`/api/gallery/${img.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCover: true }),
          }),
        ]);
        router.refresh();
      } catch {
        // ignore
      }
    }
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;
    setIsDeletingImage(true);
    try {
      const res = await fetch(`/api/gallery/${imageToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGalleryImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
        if (form.coverImage === imageToDelete.imageUrl) {
          const remaining = galleryImages.filter((img) => img.id !== imageToDelete.id);
          setField("coverImage", remaining[0]?.imageUrl || "");
        }
        setImageToDelete(null);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsDeletingImage(false);
    }
  };

  const submitProject = async (publishLive: boolean) => {
    if (!form.title.trim() || !form.category.trim()) {
      setError("Please fill in project title and category.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const url = isEditing ? `/api/projects/${initial.id}` : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...form,
        isActive: publishLive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Could not save project."));
        return;
      }

      const json = await res.json();
      const savedId = json.project?.id;

      if (!isEditing && savedId) {
        router.push(`/content/projects/${savedId}`);
      } else {
        router.push("/content/projects");
      }
      router.refresh();
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!initial.id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/projects/${initial.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this project."));
        return;
      }
      setShowDeleteModal(false);
      router.push("/content/projects");
      router.refresh();
    } catch {
      setDeleteError("Network error while deleting project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitProject(true);
      }}
      className="space-y-6"
    >
      {/* Sticky Action Toolbar */}
      <div className="sticky top-0 z-40 -mx-6 -mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white/95 px-6 py-2.5 backdrop-blur-md border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Link
            href="/content/projects"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
            aria-label="Back to projects"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.2]" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900">
              {isEditing ? `Edit: ${initial.title}` : "New Project"}
            </span>
            {form.slug && (
              <span className="hidden sm:inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                /{form.slug}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 shadow-2xs hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}

          <button
            type="button"
            disabled={busy || uploadingCover || uploadingGallery}
            onClick={() => submitProject(false)}
            className="relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-60"
          >
            {busy && (
              <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 opacity-80" />
            )}
            <span className="relative">Draft</span>
          </button>

          <button
            type="submit"
            disabled={busy || uploadingCover || uploadingGallery}
            className="relative flex items-center justify-center overflow-hidden rounded-xl bg-[#0073bc] px-5 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#005fa0] active:scale-[0.99] disabled:opacity-60"
          >
            {busy && (
              <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
            )}
            <span className="relative">{isEditing ? "Save Changes" : "Publish Project"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left = Info Form, Right = Cover & Media */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Core Project Metadata */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Project Information</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Basic architectural attributes and client information.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Project Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. KAFD Iconic Tower"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Category *</label>
                  <input
                    type="text"
                    list="project-categories"
                    required
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    placeholder="e.g. Commercial Architecture"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                  <datalist id="project-categories">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as ProjectStatus)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Associations (Multi-Select Pills) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Associated Services
                </label>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Select which services this project and its gallery photos appear under on the public website.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isSelected = form.serviceSlugs?.includes(srv.slug);
                    return (
                      <button
                        key={srv.slug}
                        type="button"
                        onClick={() => {
                          const current = form.serviceSlugs ?? [];
                          const next = isSelected
                            ? current.filter((s) => s !== srv.slug)
                            : [...current, srv.slug];
                          setField("serviceSlugs", next);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#0073bc] text-white shadow-xs"
                            : "border border-zinc-200 bg-zinc-50/70 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{srv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Client</label>
                  <input
                    type="text"
                    value={form.client ?? ""}
                    onChange={(e) => setField("client", e.target.value)}
                    placeholder="e.g. KAFD Development"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Location</label>
                  <input
                    type="text"
                    value={form.location ?? ""}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="e.g. Riyadh, KSA"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Year</label>
                  <input
                    type="text"
                    value={form.year ?? ""}
                    onChange={(e) => setField("year", e.target.value)}
                    placeholder="e.g. 2024"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">Description</label>
                <textarea
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Architectural overview, highlights and engineering challenges solved..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>

              {/* URL Slug (Optional Override) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Custom Slug <span className="font-normal text-zinc-400">(Leave blank for automatic generation)</span>
                </label>
                <input
                  type="text"
                  value={form.slug ?? ""}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="e.g. kafd-iconic-tower"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-mono text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Scope of Work Tags */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Scope of Work</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Services and scopes provided for this project (e.g. Civil Works, Facade Design).
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newScopeTag}
                onChange={(e) => setNewScopeTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addScopeTag();
                  }
                }}
                placeholder="Add scope item..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={addScopeTag}
                className="flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.scope && form.scope.length > 0 ? (
                form.scope.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#0073bc]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeScopeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-blue-200/50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400">No scope items added yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cover Image & Project-Specific Gallery */}
        <div className="space-y-6 lg:col-span-5">
          {/* Cover Image Upload Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950">Cover Image</h2>
              {form.coverImage && (
                <span className="text-[10px] font-bold text-emerald-600">✓ Uploaded</span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Primary hero and card image for the project across the website.
            </p>

            <div className="mt-4">
              <input
                id="project-cover-upload"
                type="file"
                accept="image/webp,image/png,image/jpeg"
                onChange={handleCoverUpload}
                className="sr-only"
              />

              <div className="group relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-[#0073bc]">
                {uploadingCover ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/80">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0073bc]" />
                    <span className="text-xs font-semibold text-zinc-600">Uploading cover...</span>
                  </div>
                ) : form.coverImage ? (
                  <>
                    <Image
                      src={form.coverImage}
                      alt="Project cover"
                      fill
                      className="object-cover"
                    />
                    <label
                      htmlFor="project-cover-upload"
                      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 text-white"
                    >
                      <UploadCloud className="h-6 w-6" />
                      <span className="mt-2 text-xs font-bold">Change Cover Image</span>
                    </label>
                  </>
                ) : (
                  <label
                    htmlFor="project-cover-upload"
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0073bc]">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <span className="mt-3 text-xs font-semibold text-zinc-800">
                      Click to upload cover image
                    </span>
                    <span className="mt-1 text-[11px] text-zinc-400">WebP, PNG, or JPEG</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Project Gallery Images (Separate Table) */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Project Gallery Images</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Images linked directly to this project via the gallery table.
                </p>
              </div>

              {isEditing && (
                <label
                  htmlFor="project-gallery-upload"
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0073bc] hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload</span>
                </label>
              )}
            </div>

            <input
              id="project-gallery-upload"
              type="file"
              multiple
              accept="image/webp,image/png,image/jpeg"
              onChange={handleGalleryUpload}
              className="sr-only"
              disabled={!isEditing}
            />

            {!isEditing ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
                Please save this project first to start uploading connected gallery photos.
              </div>
            ) : uploadingGallery ? (
              <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#0073bc]" />
                <span className="text-xs font-semibold text-zinc-600">Uploading gallery items...</span>
              </div>
            ) : galleryImages.length === 0 ? (
              <label
                htmlFor="project-gallery-upload"
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center transition-colors hover:border-[#0073bc]"
              >
                <ImageIcon className="h-8 w-8 text-zinc-400" />
                <span className="mt-2 text-xs font-semibold text-zinc-700">
                  No gallery images yet
                </span>
                <span className="mt-0.5 text-[11px] text-zinc-400">
                  Click to browse and upload multiple photos
                </span>
              </label>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryImages.map((img) => {
                  const isCurrentCover = form.coverImage === img.imageUrl || img.isCover;
                  return (
                    <div
                      key={img.id}
                      className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                        isCurrentCover
                          ? "border-[#0073bc] ring-2 ring-[#0073bc]/30 shadow-xs"
                          : "border-zinc-100 bg-zinc-100 hover:border-zinc-300"
                      }`}
                    >
                      <Image
                        src={img.imageUrl}
                        alt={img.caption || "Gallery image"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Current Cover Badge */}
                      {isCurrentCover && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-[#0073bc] px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white shadow-xs backdrop-blur-md">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          <span>Cover</span>
                        </div>
                      )}

                      {/* Hover Actions: Set as Cover & Delete */}
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-2xs transition-opacity group-hover:opacity-100 p-2">
                        {!isCurrentCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(img)}
                            className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-900 shadow-sm hover:bg-blue-50 hover:text-[#0073bc] transition-colors"
                            title="Set as Project Cover Image"
                          >
                            <Star className="h-3 w-3" />
                            <span>Set as Cover</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setImageToDelete(img)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-600/90 text-white hover:bg-red-600 hover:scale-110 transition-all"
                          title="Delete image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Gallery Image Confirmation */}
      {imageToDelete && (
        <Modal
          open={Boolean(imageToDelete)}
          onClose={() => !isDeletingImage && setImageToDelete(null)}
          title="Remove Gallery Image"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to remove this image from the project gallery?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingImage}
                onClick={() => setImageToDelete(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingImage}
                onClick={confirmDeleteImage}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingImage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Project Confirmation */}
      {showDeleteModal && (
        <Modal
          open={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Delete Project"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete this project? This will also remove its associated
              gallery records.
            </p>
            {deleteError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProject}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}
