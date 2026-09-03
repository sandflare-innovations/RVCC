"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Filter,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import { AVAILABLE_SERVICES } from "@/sections/projects/ProjectEditor";
import type { GalleryImageDTO, ProjectDTO } from "@rvcc/types";

export function GalleryGrid({
  initialImages,
  projects,
}: {
  initialImages: (GalleryImageDTO & { projectTitle?: string; projectSlug?: string })[];
  projects: ProjectDTO[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [viewMode, setViewMode] = useState<"all" | "projects" | "services">("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Direct file input trigger ref (when clicking card to upload)
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete modal state
  const [imageToDelete, setImageToDelete] = useState<GalleryImageDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered images
  const filteredImages = useMemo(() => {
    let list = [...images];

    if (viewMode === "all") {
      // In "all" mode, show all images unfiltered
    } else if (viewMode === "projects") {
      if (selectedProjectId !== "ALL") {
        list = list.filter((img) => img.projectId === selectedProjectId);
      }
    } else if (viewMode === "services") {
      if (selectedServiceSlug !== "ALL") {
        list = list.filter((img) => {
          const proj = projects.find((p) => p.id === img.projectId);
          const slugs = img.serviceSlugs?.length ? img.serviceSlugs : proj?.serviceSlugs ?? [];
          return slugs.includes(selectedServiceSlug);
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (img) =>
          img.caption.toLowerCase().includes(q) ||
          (img.projectTitle && img.projectTitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [images, projects, viewMode, selectedProjectId, selectedServiceSlug, searchQuery]);

  // When files are selected from the file picker
  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    // If already scoped to a specific project, upload directly to that project
    if (viewMode === "projects" && selectedProjectId !== "ALL") {
      uploadFilesWithProject(fileArray, selectedProjectId);
    } else {
      // Otherwise, open project selection modal asking which project to add under
      setPendingFiles(fileArray);
      setTargetProjectId(projects[0]?.id ?? "");
      setUploadModalOpen(true);
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const uploadFilesWithProject = async (files: File[], projId: string) => {
    if (!files || files.length === 0) return;
    if (!projId) {
      setUploadError("Please select a project to connect these images with.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const project = projects.find((p) => p.id === projId);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("folder", `gallery/${project?.slug || "general"}`);
        uploadForm.append("label", caption.trim() ? caption : `photo-${i + 1}`);

        const uploadRes = await fetch("/api/content/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) continue;
        const uploadData = (await uploadRes.json()) as { fileUrl: string };

        const linkRes = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projId,
            imageUrl: uploadData.fileUrl,
            caption: caption.trim() || file.name.replace(/\.[^/.]+$/, ""),
            sortOrder: images.length + i,
            isActive: true,
          }),
        });

        if (linkRes.ok) {
          const resJson = await linkRes.json();
          setImages((prev) => [resJson.image, ...prev]);
        }
      }

      setUploadModalOpen(false);
      setPendingFiles([]);
      setCaption("");
      router.refresh();
    } catch {
      setUploadError("Error uploading images. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/gallery/${imageToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
        setImageToDelete(null);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Fixed Sticky Top Bar: Sorting & Search in a single sleek row */}
      <div className="sticky top-0 z-30 -mx-5 -mt-5 md:-mx-8 md:-mt-8 mb-8 md:mb-10 border-b border-zinc-200/80 bg-white/95 px-5 md:px-8 py-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: View Mode Toggle & Custom Dropdown Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher: All vs By Project vs By Service */}
            <div className="flex shrink-0 items-center rounded-2xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode("all");
                  setSelectedProjectId("ALL");
                  setSelectedServiceSlug("ALL");
                  setIsDropdownOpen(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "all"
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("projects");
                  setSelectedServiceSlug("ALL");
                  setIsDropdownOpen(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "projects"
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                By Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("services");
                  setSelectedProjectId("ALL");
                  setIsDropdownOpen(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "services"
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                By Service
              </button>
            </div>

            {/* When viewing a specific project detail, show Back button */}
            {viewMode === "projects" && selectedProjectId !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedProjectId("ALL")}
                className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>All Projects</span>
              </button>
            )}

            {/* When viewing a specific service detail, show Back button */}
            {viewMode === "services" && selectedServiceSlug !== "ALL" && (
              <button
                type="button"
                onClick={() => setSelectedServiceSlug("ALL")}
                className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>All Services</span>
              </button>
            )}

            {/* Custom Interactive Dropdown (Shown in By Project mode) */}
            {viewMode === "projects" && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-2xs hover:border-zinc-300 hover:bg-zinc-50/60 focus:border-[#0073bc] focus:outline-hidden transition-all min-w-[190px] md:min-w-[220px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">
                      {selectedProjectId === "ALL"
                        ? `All Projects (${images.length})`
                        : projects.find((p) => p.id === selectedProjectId)?.title || "Select Project"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-zinc-700" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-64 md:w-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId("ALL");
                        setIsDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                        selectedProjectId === "ALL"
                          ? "bg-blue-50 text-[#0073bc] font-bold"
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <span>All Projects</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                        {images.length}
                      </span>
                    </button>

                    <div className="my-1 border-t border-zinc-100" />

                    {projects.map((proj) => {
                      const count = images.filter((img) => img.projectId === proj.id).length;
                      const isSelected = selectedProjectId === proj.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-[#0073bc] font-bold"
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <span className="truncate text-left">{proj.title}</span>
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 shrink-0">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Search Box + Add Images Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60 md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search caption or project..."
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

            {/* Add Images Header Button: Triggers File Picker Directly */}
            <button
              type="button"
              onClick={() => cardFileInputRef.current?.click()}
              className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Images</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Header & Card Upload */}
      <input
        type="file"
        ref={cardFileInputRef}
        multiple
        accept="image/webp,image/png,image/jpeg"
        onChange={handleFilesChosen}
        className="sr-only hidden"
      />

      {/* Main Image Container with Comfortable Top Padding from Header */}
      <div className="pt-2 md:pt-4">
        {/* Collections Grid (Projects or Services) vs Individual Photos Grid */}
        {viewMode === "projects" && selectedProjectId === "ALL" && !searchQuery ? (
          /* Project Collections Multi-Thumb Stacks */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const projImages = images.filter((img) => img.projectId === proj.id);
            const mainThumb = projImages[0]?.imageUrl || proj.coverImage || "/images/projects/1.webp";
            const secondaryThumbs = projImages.slice(1, 4);

            return (
              <div
                key={proj.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-zinc-300 hover:shadow-xl"
              >
                <div>
                  {/* Multi-Image Stack Design */}
                  <div className="mb-4 space-y-2.5">
                    {/* Main Big Thumbnail */}
                    <div
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-inner cursor-pointer"
                    >
                      <Image
                        src={mainThumb}
                        alt={proj.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-800 uppercase shadow-xs backdrop-blur-md">
                          {proj.category}
                        </span>
                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                          {projImages.length} {projImages.length === 1 ? "Photo" : "Photos"}
                        </span>
                      </div>
                    </div>

                    {/* Secondary 3 Thumbnails Strip */}
                    <div className="grid grid-cols-3 gap-2">
                      {secondaryThumbs.length > 0 ? (
                        secondaryThumbs.map((sec, idx) => (
                          <div
                            key={sec.id || idx}
                            onClick={() => setSelectedProjectId(proj.id)}
                            className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 cursor-pointer"
                          >
                            <Image
                              src={sec.imageUrl}
                              alt={`${proj.title} preview ${idx}`}
                              fill
                              className="object-cover opacity-85 transition-opacity duration-300 hover:opacity-100"
                              sizes="10vw"
                            />
                          </div>
                        ))
                      ) : (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex items-center justify-center text-[10px] text-zinc-300 font-medium"
                          >
                            Empty
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Title and Category */}
                  <div className="pt-2">
                    <h3 className="line-clamp-1 text-lg font-bold text-zinc-900 group-hover:text-[#0073bc] transition-colors">
                      {proj.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                      {proj.location} • {proj.year}
                    </p>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0073bc] hover:underline cursor-pointer"
                  >
                    <span>View all {projImages.length} images</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetProjectId(proj.id);
                        cardFileInputRef.current?.click();
                      }}
                      className="flex h-8 items-center gap-1 rounded-xl bg-blue-50 px-2.5 text-xs font-bold text-[#0073bc] hover:bg-blue-100 transition-colors"
                      title="Upload photo directly to this project"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Upload</span>
                    </button>

                    <Link
                      href={`/content/projects/${proj.id}`}
                      className="flex h-8 items-center rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                      title="Open project details"
                    >
                      Project
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "services" && selectedServiceSlug === "ALL" && !searchQuery ? (
        /* Service Collections Multi-Thumb Stacks */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_SERVICES.map((srv) => {
            const srvImages = images.filter((img) => {
              const proj = projects.find((p) => p.id === img.projectId);
              const slugs = img.serviceSlugs?.length ? img.serviceSlugs : proj?.serviceSlugs ?? [];
              return slugs.includes(srv.slug);
            });
            const mainThumb = srvImages[0]?.imageUrl || "/images/projects/1.webp";
            const secondaryThumbs = srvImages.slice(1, 4);

            return (
              <div
                key={srv.slug}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-zinc-300 hover:shadow-xl"
              >
                <div>
                  {/* Multi-Image Stack Design */}
                  <div className="mb-4 space-y-2.5">
                    {/* Main Big Thumbnail */}
                    <div
                      onClick={() => setSelectedServiceSlug(srv.slug)}
                      className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-inner cursor-pointer"
                    >
                      <Image
                        src={mainThumb}
                        alt={srv.label}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-800 uppercase shadow-xs backdrop-blur-md">
                          Service
                        </span>
                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                          {srvImages.length} {srvImages.length === 1 ? "Photo" : "Photos"}
                        </span>
                      </div>
                    </div>

                    {/* Secondary 3 Thumbnails Strip */}
                    <div className="grid grid-cols-3 gap-2">
                      {secondaryThumbs.length > 0 ? (
                        secondaryThumbs.map((sec, idx) => (
                          <div
                            key={sec.id || idx}
                            onClick={() => setSelectedServiceSlug(srv.slug)}
                            className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 cursor-pointer"
                          >
                            <Image
                              src={sec.imageUrl}
                              alt={`${srv.label} preview ${idx}`}
                              fill
                              className="object-cover opacity-85 transition-opacity duration-300 hover:opacity-100"
                              sizes="10vw"
                            />
                          </div>
                        ))
                      ) : (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex items-center justify-center text-[10px] text-zinc-300 font-medium"
                          >
                            Empty
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Title and Count */}
                  <div className="pt-2">
                    <h3 className="line-clamp-1 text-lg font-bold text-zinc-900 group-hover:text-[#0073bc] transition-colors">
                      {srv.label}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                      {srvImages.length} {srvImages.length === 1 ? "gallery photo" : "gallery photos"}
                    </p>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceSlug(srv.slug)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0073bc] hover:underline cursor-pointer"
                  >
                    <span>View all {srvImages.length} images</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <span className="rounded-xl bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-600">
                    {srvImages.length} Photos
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Individual Photos Grid: 4 items in a row with larger image size and no add image card */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
            >
              {/* Image Box: Large aspect-16/10 or square for high visibility */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/50">
                <Image
                  src={img.imageUrl}
                  alt={img.caption || "Gallery photo"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />

                {/* Hover Actions */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover:opacity-100 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageToDelete(img);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md hover:bg-red-700 hover:scale-110 transition-all cursor-pointer"
                    title="Delete image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Info Footer */}
              <div className="pt-3.5">
                <h4 className="line-clamp-1 text-sm font-bold text-zinc-900" title={img.caption}>
                  {img.caption || "Untitled"}
                </h4>
                <Link
                  href={`/content/projects/${img.projectId}`}
                  className="mt-1 line-clamp-1 text-xs font-semibold text-[#0073bc] hover:underline"
                >
                  {img.projectTitle || "View Project"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {filteredImages.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800">No images in this collection</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Upload gallery photos to display them across the site.
          </p>
          <button
            type="button"
            onClick={() => cardFileInputRef.current?.click()}
            className="mt-4 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0]"
          >
            Add Images
          </button>
        </div>
      )}
      </div>

      {/* Upload Project Selection Modal (Shown when adding files) */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            if (!uploading) {
              setUploadModalOpen(false);
              setPendingFiles([]);
            }
          }}
          title="Add Under Project"
        >
          <div className="space-y-4">
            {pendingFiles.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs font-medium text-[#0073bc]">
                Selected <span className="font-bold">{pendingFiles.length}</span> image
                {pendingFiles.length === 1 ? "" : "s"} to upload. Choose the project to assign them to:
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700">Select Project *</label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700">Caption / Label (Optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Facade Detail"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            {uploadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setUploadModalOpen(false);
                  setPendingFiles([]);
                }}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading || !targetProjectId}
                onClick={() => uploadFilesWithProject(pendingFiles, targetProjectId)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] disabled:opacity-50"
              >
                {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{uploading ? "Uploading..." : `Upload to Project`}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <Modal
          open={Boolean(imageToDelete)}
          onClose={() => !isDeleting && setImageToDelete(null)}
          title="Delete Gallery Image"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to remove this gallery image? It will no longer show under this
              project or in the website gallery.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setImageToDelete(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
