"use client";

import { AlertCircle, Check, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { optimizeImageForUpload } from "@/lib/image-optimizer";
import { readApiError } from "@/lib/read-error";
import type { ClientPartnerDTO, ClientPartnerInput } from "@rvcc/types";

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client?: ClientPartnerDTO | null;
  onSaved: (client: ClientPartnerDTO) => void;
}

export function ClientModal({ open, onClose, client, onSaved }: ClientModalProps) {
  const isEditing = Boolean(client?.id);

  const [form, setForm] = useState<ClientPartnerInput>({
    name: client?.name ?? "",
    logoUrl: client?.logoUrl ?? "",
    industry: client?.industry ?? "General",
    websiteUrl: client?.websiteUrl ?? "",
    sortOrder: client?.sortOrder ?? 0,
    isActive: client?.isActive ?? true,
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

      // 2. Upload to Cloudflare R2 under "clients" folder
      const data = new FormData();
      data.append("file", optimizedFile);
      data.append("folder", "clients");
      data.append("label", form.name ? form.name : "client-logo");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        setError(await readApiError(res, "Failed to upload client logo."));
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
      setError("Client name is required.");
      return;
    }
    if (!form.logoUrl.trim()) {
      setError("Please upload a client logo.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const url = isEditing && client ? `/api/clients/${client.id}` : "/api/clients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError(await readApiError(res, `Failed to ${isEditing ? "update" : "create"} client.`));
        return;
      }

      const json = (await res.json()) as { client: ClientPartnerDTO };
      onSaved(json.client);
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={isEditing ? "Edit Client Partner" : "Add Client Partner"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1:1 Aspect Ratio Logo Upload Box */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Client Logo (1:1 Ratio)
          </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="group relative aspect-square w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-2 shadow-2xs transition-all hover:border-[#0073bc] hover:bg-blue-50/20">
              <input
                id="client-logo-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />

              {uploading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="mt-1 text-[9px] font-bold text-white uppercase tracking-wider">
                    Optimizing
                  </span>
                </div>
              )}

              {form.logoUrl ? (
                <>
                  <div className="relative h-full w-full">
                    <Image
                      src={form.logoUrl}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <label
                    htmlFor="client-logo-upload"
                    className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <UploadCloud className="h-5 w-5 text-white" />
                    <span className="mt-1 text-[10px] font-bold text-white uppercase tracking-wider">
                      Replace
                    </span>
                  </label>
                </>
              ) : (
                <label
                  htmlFor="client-logo-upload"
                  className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-center"
                >
                  <UploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-[#0073bc]" />
                  <span className="mt-1.5 text-[10px] font-bold text-zinc-600 group-hover:text-[#0073bc]">
                    Upload Logo
                  </span>
                  <span className="text-[9px] text-zinc-400">1:1 Square</span>
                </label>
              )}
            </div>

            <div className="flex-1 text-xs text-zinc-500 leading-relaxed">
              <p className="font-semibold text-zinc-800">High-Resolution Logo Upload</p>
              <p className="mt-1 text-zinc-500">
                Transparent PNG or WebP recommended. We preserve clean transparency and lossless vector clarity when uploading to the dedicated <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-800">clients/</code> storage folder.
              </p>
              {form.logoUrl && (
                <p className="mt-2 flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Logo ready for save
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Client Name & Industry */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
              Client / Company Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Saudi Aramco"
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
              Industry / Sector
            </label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g. Energy & Infrastructure"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
            Partner Website URL (Optional)
          </label>
          <input
            type="url"
            value={form.websiteUrl ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
            placeholder="https://example.com"
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
              Controls visibility on the clients partner network and logo marquee.
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
            <span>{isEditing ? "Save Changes" : "Create Client"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
