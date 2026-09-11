"use client";

import type { NewsEventDTO, NewsEventInput } from "@rvcc/schemas";
import { AlertCircle, Check, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { optimizeImageForUpload } from "@/lib/image-optimizer";
import { readApiError } from "@/lib/read-error";

interface NewsModalProps {
  open: boolean;
  onClose: () => void;
  item?: NewsEventDTO | null;
  onSaved: (item: NewsEventDTO) => void;
}

export function NewsModal({ open, onClose, item, onSaved }: NewsModalProps) {
  const isEditing = Boolean(item?.id);

  const [form, setForm] = useState<NewsEventInput>({
    title: item?.title ?? "",
    slug: item?.slug ?? "",
    category: item?.category ?? "COMMUNITY DEVELOPMENT",
    date: item?.date ?? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    edition: item?.edition ?? "",
    excerpt: item?.excerpt ?? "",
    content: item?.content ?? "",
    imageUrl: item?.imageUrl ?? "",
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  });

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setUploading(true);
    setError(null);

    try {
      const { file: optimizedFile } = await optimizeImageForUpload(originalFile, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.92,
      });

      const data = new FormData();
      data.append("file", optimizedFile);
      data.append("folder", "news");
      data.append("label", form.title ? form.title : "news-cover");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload image."));
        return;
      }

      const json = (await res.json()) as { fileUrl: string };
      setForm((prev) => ({ ...prev, imageUrl: json.fileUrl }));
    } catch (err: any) {
      setError(err?.message || "Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.imageUrl.trim()) {
      setError("Cover image is required.");
      return;
    }
    if (!form.excerpt?.trim()) {
      setError("Summary excerpt is required.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const url = isEditing && item ? `/api/news/${item.id}` : "/api/news";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError(await readApiError(res, `Failed to ${isEditing ? "update" : "create"} article.`));
        return;
      }

      const json = (await res.json()) as { news: NewsEventDTO };
      onSaved(json.news);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit News & Event" : "Create News & Event"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Community Landmark: The Lakes Park Project"
            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
          />
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. COMMUNITY DEVELOPMENT"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Publication Date
            </label>
            <input
              type="text"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              placeholder="e.g. April 15, 2024"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Edition & Slug Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Edition / Volume Tag
            </label>
            <input
              type="text"
              value={form.edition || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, edition: e.target.value }))}
              placeholder="e.g. Vol. 24 / Issue 02"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Slug (Optional - URL)
            </label>
            <input
              type="text"
              value={form.slug || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="Leave blank to auto-generate"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Cover Image <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {form.imageUrl ? (
              <div className="relative aspect-video w-48 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <Image
                  src={form.imageUrl}
                  alt="News preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                  className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex aspect-video w-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center transition-colors hover:border-brand-blue hover:bg-blue-50/20">
                <UploadCloud size={24} className="text-zinc-400 mb-2" />
                <span className="text-xs font-semibold text-zinc-600">
                  {uploading ? "Uploading..." : "Upload Image"}
                </span>
                <span className="text-[10px] text-zinc-400 mt-1">WebP, PNG, JPG</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Or paste an image URL directly"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:border-brand-blue focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Recommended aspect ratio: 16:9 or 16:10. High-res images will be automatically optimized.
              </p>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Excerpt / Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="A brief 1-2 sentence lead overview shown on cards and headers..."
            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
          />
        </div>

        {/* Full Content */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Full Article Story Body (Optional)
          </label>
          <textarea
            rows={5}
            value={form.content || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Full article content. Separate paragraphs with double newlines."
            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-brand-blue focus:outline-none"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300 text-brand-blue focus:ring-brand-blue"
          />
          <label htmlFor="isActive" className="text-xs font-medium text-zinc-700 select-none">
            Publish this item publicly on the website
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-blue/90 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                {isEditing ? "Update Story" : "Publish Story"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
