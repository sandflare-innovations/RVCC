"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Trash2, Upload } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_ATTACHMENT_SECTIONS } from "@/data/enquire-attachments";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";

type AttachmentRow = {
  id: string;
  section: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
};

export function AttachmentsStep() {
  useRequireSession("attachments");
  const router = useRouter();
  const { registration, refresh, loading, saving, setError, advanceTo } = useEnquire();
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const attachments = (registration?.attachments ?? []) as AttachmentRow[];

  const uploadFile = async (section: string, file: File) => {
    setUploadingSection(section);
    setError(null);
    try {
      const form = new FormData();
      form.set("section", section);
      form.set("file", file);
      const res = await fetch("/api/enquire/attachments", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Upload failed");
        return;
      }
      await refresh();
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploadingSection(null);
    }
  };

  const deleteAttachment = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/enquire/attachments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Could not remove file");
        return;
      }
      await refresh();
    } catch {
      setError("Could not remove file");
    } finally {
      setDeletingId(null);
    }
  };

  const requiredSections = ENQUIRE_ATTACHMENT_SECTIONS.filter((s) => !("optional" in s && s.optional));
  const missingRequired = requiredSections.some(
    (s) => !attachments.some((a) => a.section === s.id)
  );

  if (loading && !registration) return null;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600">
        Upload supporting documents for procurement review. Required items are marked with an
        asterisk. PDF, JPEG, and PNG up to 15 MB each.
      </p>

      <div className="space-y-5">
        {ENQUIRE_ATTACHMENT_SECTIONS.map((section) => {
          const uploaded = attachments.filter((a) => a.section === section.id);
          const busy = uploadingSection === section.id;
          const optional = "optional" in section && section.optional;

          return (
            <div
              key={section.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {section.label}
                    {!optional ? <span className="text-red-600"> *</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{section.hint}</p>
                </div>
                <label className="bg-brand-blue inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy ? "Uploading…" : "Choose file"}
                  <input
                    type="file"
                    accept={section.accept}
                    className="sr-only"
                    disabled={busy || saving}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void uploadFile(section.id, file);
                    }}
                  />
                </label>
              </div>

              {uploaded.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {uploaded.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue min-w-0 truncate font-medium hover:underline"
                      >
                        {a.fileName}
                      </a>
                      <button
                        type="button"
                        disabled={deletingId === a.id}
                        onClick={() => void deleteAttachment(a.id)}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {deletingId === a.id ? "Removing…" : "Remove"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          onClick={() => router.push("/enquire/questionnaire")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          disabled={missingRequired || Boolean(uploadingSection)}
          onClick={() => {
            if (missingRequired) {
              setError("Please upload all required documents before continuing.");
              return;
            }
            advanceTo("review", { step: "attachments" });
          }}
        >
          Next: Review
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
