"use client";

import { AlertCircle, Check, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { optimizeImageForUpload } from "@/lib/image-optimizer";
import { readApiError } from "@/lib/read-error";
import type { SisterCompanyDTO, SisterCompanyInput } from "@rvcc/types";

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  company?: SisterCompanyDTO | null;
  onSaved: (company: SisterCompanyDTO) => void;
}

export function CompanyModal({ open, onClose, company, onSaved }: CompanyModalProps) {
  const isEditing = Boolean(company?.id);

  const [form, setForm] = useState<SisterCompanyInput>({
    name: company?.name ?? "",
    logoUrl: company?.logoUrl ?? "",
    industry: company?.industry ?? "Sister Concern",
    websiteUrl: company?.websiteUrl ?? "",
    sortOrder: company?.sortOrder ?? 0,
    isActive: company?.isActive ?? true,
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
      // 1. Lossless/ultra-high-quality client-side WebP optimization (preserves alpha channels & clean logo edges)
      const { file: optimizedFile } = await optimizeImageForUpload(originalFile, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.98,
      });

      // 2. Upload to Cloudflare R2 under "sister-companies" folder
      const data = new FormData();
      data.append("file", optimizedFile);
      data.append("folder", "sister-companies");
      data.append("label", form.name ? form.name : "company-logo");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload company logo."));
        return;
      }

      const json = (await res.json()) as { fileUrl: string };
      setForm((prev) => ({ ...prev, logoUrl: json.fileUrl }));
    } catch (err: any) {
      setError(err?.message || "Error optimizing and uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!form.logoUrl.trim()) {
      setError("Please upload a company logo.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const url = isEditing && company ? `/api/companies/${company.id}` : "/api/companies";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError(await readApiError(res, `Failed to ${isEditing ? "update" : "create"} sister company.`));
        return;
      }

      const json = await res.json();
      const savedCompany = json.company as SisterCompanyDTO;
      onSaved(savedCompany);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={isEditing ? "Edit Sister Concern Company" : "New Sister Concern Company"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Logo Upload Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Company Logo *
          </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-2 overflow-hidden shadow-2xs group hover:border-[#0073bc] transition-colors">
              {form.logoUrl ? (
                <>
                  <Image
                    src={form.logoUrl}
                    alt="Logo Preview"
                    fill
                    className="object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, logoUrl: "" }))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Remove Logo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : uploading ? (
                <Loader2 className="h-6 w-6 text-[#0073bc] animate-spin" />
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center">
                  <UploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-[#0073bc] transition-colors" />
                  <span className="mt-1 text-[10px] font-bold text-zinc-400 group-hover:text-[#0073bc]">
                    Upload
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-xs text-zinc-500 leading-relaxed">
              <p className="font-semibold text-zinc-800">High-Resolution Logo Upload</p>
              <p className="mt-1 text-zinc-500">
                Transparent PNG or WebP recommended. We preserve clean transparency and lossless vector clarity when uploading to the dedicated <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-800">sister-companies/</code> storage folder.
              </p>
              {form.logoUrl && (
                <p className="mt-2 flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Logo ready for save
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Company Name & Industry */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
              Company Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Flyin Co"
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
              Category / Sector
            </label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g. Sister Concern / Aviation"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Company Website URL (Optional)
          </label>
          <input
            type="url"
            value={form.websiteUrl ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
            placeholder="https://www.flyinco.com"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              Display on Website
            </span>
            <p className="text-[11px] text-zinc-500">
              Controls visibility on the homepage Sister Concern Companies ticker and grid.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              form.isActive ? "bg-[#0073bc]" : "bg-zinc-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                form.isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || uploading}
            className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#005fa0] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditing ? "Save Changes" : "Create Company"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
