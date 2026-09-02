"use client";

import { AlertCircle, ArrowLeft, Image as ImageIcon, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const setField = <K extends keyof HeroSlideInput>(key: K, value: HeroSlideInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title1.trim() || !form.title2.trim() || !form.description.trim() || !form.imageUrl.trim()) {
      setError("Please complete all required fields (Titles, Description, and Background Image).");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = isEditing ? `/api/hero-slides/${initial.id}` : "/api/hero-slides";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <form onSubmit={handleSave} className="space-y-8">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Fields */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Slide Headline & Texts</h2>
            <p className="mt-1 text-xs text-zinc-500">
              The hero headline is split into Title 1 (white) and Title 2 (accent blue).
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Small Badge / Category</label>
                <input
                  type="text"
                  value={form.badge ?? ""}
                  onChange={(e) => setField("badge", e.target.value)}
                  placeholder="e.g. Architecture & Design"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-blue-600 focus:outline-hidden"
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
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-zinc-900 transition-colors focus:border-blue-600 focus:outline-hidden"
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
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium text-blue-600 transition-colors focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe your architectural mastery, engineering commitment, or vision..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Action Buttons & Visibility</h2>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Primary Button Label</label>
                  <input
                    type="text"
                    value={form.primaryBtnText ?? ""}
                    onChange={(e) => setField("primaryBtnText", e.target.value)}
                    placeholder="Explore Works"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Primary Button Link</label>
                  <input
                    type="text"
                    value={form.primaryBtnLink ?? ""}
                    onChange={(e) => setField("primaryBtnLink", e.target.value)}
                    placeholder="#projects"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-600 focus:outline-hidden"
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
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Secondary Button Link</label>
                  <input
                    type="text"
                    value={form.secondaryBtnLink ?? ""}
                    onChange={(e) => setField("secondaryBtnLink", e.target.value)}
                    placeholder="/enquire/verify"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(e) => setField("sortOrder", parseInt(e.target.value, 10) || 0)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-600 focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">Lower numbers appear first (0, 1, 2...)</p>
                </div>
                <div className="flex items-center pt-6">
                  <label className="relative flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setField("isActive", e.target.checked)}
                      className="h-4 w-4 rounded-sm border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-zinc-900">Publish to live website</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Image Uploader & Live Card Preview */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-zinc-950">Background Image</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Upload directly to Cloudflare R2 (`rvcc-public-assets`) or paste an image URL.
            </p>

            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <UploadCloud className="h-6 w-6" />
                  )}
                </div>
                <span className="mt-3 text-xs font-semibold text-zinc-800">
                  {uploading ? "Compressing & Uploading to R2..." : "Click to browse image"}
                </span>
                <span className="mt-1 text-[11px] text-zinc-400">WebP, PNG, or JPEG up to 10 MB</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">Image Public CDN URL</label>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://pub-*.r2.dev/gallery/hero/..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Mini Live Preview */}
          <div className="overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 text-white shadow-lg">
            <div className="border-b border-zinc-800 px-4 py-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Live Card Preview
            </div>
            <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-900">
              {form.imageUrl ? (
                <Image
                  src={form.imageUrl}
                  alt="Slide preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                  <ImageIcon className="h-10 w-10 opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                  {form.badge || "Architecture & Design"}
                </span>
                <h3 className="mt-1 text-2xl font-black uppercase tracking-tight">
                  <span className="text-white">{form.title1 || "TITLE 1"} </span>
                  <span className="text-blue-400">{form.title2 || "TITLE 2"}</span>
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-zinc-300">
                  {form.description || "Slide description text preview..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <Link
          href="/content/hero"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Slides
        </Link>
        <button
          type="submit"
          disabled={busy || uploading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Hero Slide"}
        </button>
      </div>
    </form>
  );
}
