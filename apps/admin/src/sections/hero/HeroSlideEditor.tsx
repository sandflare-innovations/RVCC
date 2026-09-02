"use client";

import { AlertCircle, Check, ChevronLeft, Edit3, Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import type { HeroSlideDTO, HeroSlideInput } from "@rvcc/types";

export function HeroSlideEditor({ initial }: { initial: Partial<HeroSlideDTO> }) {
  const router = useRouter();
  const isEditing = Boolean(initial.id);

  const [form, setForm] = useState<HeroSlideInput>({
    badge: initial.badge ?? "Architecture & Design",
    title1: initial.title1 ?? "",
    title2: initial.title2 ?? "",
    description: initial.description ?? "",
    imageUrl: initial.imageUrl ?? "",
    primaryBtnText: initial.primaryBtnText ?? "Explore Works",
    primaryBtnLink: initial.primaryBtnLink ?? "#projects",
    secondaryBtnText: initial.secondaryBtnText ?? "E-Vendor Registration",
    secondaryBtnLink: initial.secondaryBtnLink ?? "/enquire/verify",
    sortOrder: initial.sortOrder ?? 0,
    isActive: initial.isActive ?? true,
  });

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse initial file base name and extension
  const parseFileInfo = (url?: string) => {
    if (!url) return { base: "", ext: ".webp" };
    try {
      const parts = url.split("/");
      const full = decodeURIComponent(parts[parts.length - 1] || "slide-image.webp");
      const dotIndex = full.lastIndexOf(".");
      if (dotIndex !== -1) {
        return {
          base: full.substring(0, dotIndex),
          ext: full.substring(dotIndex),
        };
      }
      return { base: full, ext: ".webp" };
    } catch {
      return { base: "slide-image", ext: ".webp" };
    }
  };

  const [fileBaseName, setFileBaseName] = useState<string>(() => parseFileInfo(initial.imageUrl).base);
  const [fileExtension, setFileExtension] = useState<string>(() => parseFileInfo(initial.imageUrl).ext);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!initial.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/hero-slides/${initial.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this slide."));
        return;
      }
      setShowDeleteModal(false);
      router.push("/content/hero");
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const setField = <K extends keyof HeroSlideInput>(key: K, value: HeroSlideInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dotIndex = file.name.lastIndexOf(".");
    const base = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
    const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : "";

    setFileBaseName(base);
    setFileExtension(ext);
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "hero");
      data.append("label", form.title1 ? `${form.title1}-${form.title2}` : "slide");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload image."));
        return;
      }

      const json = (await res.json()) as { fileUrl: string };
      setField("imageUrl", json.fileUrl);
    } catch {
      setError("Network error while uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const updateFileBaseName = (newBase: string) => {
    setFileBaseName(newBase);
    const fullFileName = `${newBase.trim()}${fileExtension}`;
    if (form.imageUrl) {
      try {
        const lastSlashIndex = form.imageUrl.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          const baseUrl = form.imageUrl.substring(0, lastSlashIndex + 1);
          setField("imageUrl", `${baseUrl}${encodeURIComponent(fullFileName)}`);
        } else {
          setField("imageUrl", fullFileName);
        }
      } catch {
        setField("imageUrl", fullFileName);
      }
    }
  };

  const submitSlide = async (publishLive: boolean) => {
    if (!form.title1.trim() || !form.title2.trim() || !form.description.trim() || !form.imageUrl.trim()) {
      setError("Please complete all required fields (Titles, Description, and Background Image).");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = isEditing ? `/api/hero-slides/${initial.id}` : "/api/hero-slides";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...form,
        isActive: publishLive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Could not save hero slide."));
        return;
      }

      router.push("/content/hero");
      router.refresh();
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitSlide(true);
      }}
      className="space-y-6"
    >
      {/* Fixed Sticky Top Action Toolbar - strictly no margin top, no border, clean surface */}
      <div className="sticky top-0 z-40 -mx-6 -mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white/95 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* iOS design back button: borderless, icon-only */}
          <Link
            href="/content/hero"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.2]" />
          </Link>
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
            disabled={busy || uploading}
            onClick={() => submitSlide(false)}
            className="relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-60"
          >
            {busy && (
              <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 opacity-80" />
            )}
            <span className="relative">Draft</span>
          </button>

          <button
            type="submit"
            disabled={busy || uploading}
            className="relative flex items-center justify-center overflow-hidden rounded-xl bg-[#0073bc] px-5 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#005fa0] active:scale-[0.99] disabled:opacity-60"
          >
            {busy && (
              <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
            )}
            <span className="relative">{isEditing ? "Publish Changes" : "Publish"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main container with generous padding-top spacing from the sticky toolbar */}
      <div className="pt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Fields */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Slide Headline & Texts</h2>
            <p className="mt-1 text-xs text-zinc-500">
              The hero headline is split into Title 1 (white) and Title 2 (accent brand blue).
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Small Badge / Category</label>
                <input
                  type="text"
                  value={form.badge ?? ""}
                  onChange={(e) => setField("badge", e.target.value)}
                  placeholder="e.g. Architecture & Design"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Title Part 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title1}
                    onChange={(e) => setField("title1", e.target.value)}
                    placeholder="e.g. Building"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Title Part 2 (Accent) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title2}
                    onChange={(e) => setField("title2", e.target.value)}
                    placeholder="e.g. Legacy"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Headline Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe your architectural mastery, engineering commitment, or vision..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Action Buttons</h2>
            <p className="mt-1 text-xs text-zinc-500">Configure the primary and secondary call-to-action buttons.</p>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Primary Button Label</label>
                  <input
                    type="text"
                    value={form.primaryBtnText ?? ""}
                    onChange={(e) => setField("primaryBtnText", e.target.value)}
                    placeholder="Explore Works"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Primary Button Link</label>
                  <input
                    type="text"
                    value={form.primaryBtnLink ?? ""}
                    onChange={(e) => setField("primaryBtnLink", e.target.value)}
                    placeholder="#projects"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Secondary Button Label</label>
                  <input
                    type="text"
                    value={form.secondaryBtnText ?? ""}
                    onChange={(e) => setField("secondaryBtnText", e.target.value)}
                    placeholder="E-Vendor Registration"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Secondary Button Link</label>
                  <input
                    type="text"
                    value={form.secondaryBtnLink ?? ""}
                    onChange={(e) => setField("secondaryBtnLink", e.target.value)}
                    placeholder="/enquire/verify"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Combined Image Upload & Live Preview Box */}
        <div className="space-y-4 lg:col-span-5">
          {/* Combined Image Area: Preview with Hover Edit Option - Fully Rounded */}
          <div className="group relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-sm">
            <input
              id="hero-image-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />

            {uploading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs">
                <div className="h-8 w-8 rounded-full bg-[#0073bc]/30 animate-pulse" />
                <span className="mt-3 text-xs font-semibold text-white animate-pulse">
                  Compressing & Uploading...
                </span>
              </div>
            )}

            {form.imageUrl ? (
              <>
                <Image
                  src={form.imageUrl}
                  alt="Slide preview"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                />

                {/* Parallax & Gradient Overlays like actual frontend */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 p-5 flex flex-col justify-end transition-opacity duration-200 group-hover:opacity-40">
                  {/* Badge Header with accent line */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-0.5 w-5 bg-[#0073bc]" />
                    <span className="text-[9px] font-bold tracking-[0.3em] text-white/60 uppercase">
                      {form.badge || "Architecture & Design"}
                    </span>
                  </div>

                  {/* Big Frontend Typography */}
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none sm:text-2xl">
                    <span className="block text-white">{form.title1 || "BUILDING"}</span>
                    <span className="block text-[#0073bc]">{form.title2 || "LEGACY"}</span>
                  </h3>

                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-300">
                    {form.description || "Redefining the architectural landscape through precision engineering..."}
                  </p>

                  {/* Frontend Buttons */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 border border-white bg-transparent px-3 py-1.5 text-[9px] font-bold tracking-widest text-white uppercase backdrop-blur-xs">
                      {form.primaryBtnText || "Explore Works"} →
                    </span>
                    <span className="inline-flex items-center gap-1.5 border border-white/60 bg-transparent px-3 py-1.5 text-[9px] font-bold tracking-widest text-white/80 uppercase backdrop-blur-xs">
                      {form.secondaryBtnText || "E-Vendor Registration"} →
                    </span>
                  </div>
                </div>

                {/* Hover Edit Overlay */}
                <label
                  htmlFor="hero-image-upload"
                  className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center bg-black/65 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0073bc] text-white shadow-lg">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <span className="mt-3 text-xs font-bold text-white tracking-wide">
                    Click to Change Image
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-300">WebP, PNG, or JPEG up to 10 MB</span>
                </label>
              </>
            ) : (
              <label
                htmlFor="hero-image-upload"
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center bg-white transition-colors hover:bg-zinc-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0073bc]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="mt-3 text-xs font-semibold text-zinc-800">
                  Click to browse & upload image
                </span>
                <span className="mt-1 text-[11px] text-zinc-400">WebP, PNG, or JPEG up to 10 MB</span>
              </label>
            )}
          </div>

          {/* File Name input label under the image with locked non-editable format */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700">
                File Name
              </label>
              {form.imageUrl && (
                <span className="text-[10px] font-bold text-emerald-600">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white overflow-hidden focus-within:border-[#0073bc] shadow-2xs">
              <input
                type="text"
                value={fileBaseName}
                onChange={(e) => updateFileBaseName(e.target.value)}
                placeholder="e.g. hero-slide"
                className="w-full px-3.5 py-2 text-xs text-zinc-800 focus:outline-hidden"
              />
              {fileExtension && (
                <span className="select-none bg-zinc-100 px-3 py-2 text-xs font-mono font-medium text-zinc-500 border-l border-zinc-200">
                  {fileExtension}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && isEditing && (
        <Modal
          open={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Delete Hero Slide"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete this hero slide{" "}
              <strong className="text-zinc-900">
                &ldquo;{form.title1} {form.title2}&rdquo;
              </strong>
              ? It will be removed from both the website and admin dashboard.
            </p>

            {deleteError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
    </form>
  );
}
