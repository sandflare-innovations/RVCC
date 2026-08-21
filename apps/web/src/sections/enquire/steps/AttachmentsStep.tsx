"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload, FileText, RefreshCw, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const PdfThumbnail = dynamic(() => import("./PdfThumbnail"), { ssr: false });

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_ATTACHMENT_SECTIONS } from "@/data/enquire-attachments";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { cn } from "@lib/utils";

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
  const [showErrors, setShowErrors] = useState(false);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

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

  const goNext = () => {
    if (missingRequired) {
      setShowErrors(true);
      setError("Please upload all required documents before continuing.");
      return;
    }
    advanceTo("review", { step: "attachments" });
  };

  const actions = (
    <>
      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="h-10 px-6 min-w-[120px] text-xs sm:w-auto sm:text-xs"
        disabled={Boolean(uploadingSection)}
        onClick={goNext}
      >
        Next
      </InteractiveHoverButton>
    </>
  );

  if (loading && !registration) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {headerNode && createPortal(actions, headerNode)}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ENQUIRE_ATTACHMENT_SECTIONS.map((section) => {
          const uploaded = attachments.filter((a) => a.section === section.id);
          const busy = uploadingSection === section.id;
          const optional = "optional" in section && section.optional;
          const isMissing = !optional && uploaded.length === 0;
          
          const uploadedFile = uploaded[0]; // Restrict to 1 file visually
          const isImage = uploadedFile?.fileName.match(/\.(jpeg|jpg|png|gif)$/i);
          const isPdf = uploadedFile?.fileName.match(/\.pdf$/i);

          return (
            <div
              key={section.id}
              className={cn(
                "rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6",
                showErrors && isMissing ? "border-red-500 ring-1 ring-red-500" : "border-zinc-200"
              )}
            >
              <div className="flex-1 w-full">
                <p className="text-[15px] font-medium text-zinc-900">
                  {section.label}
                  {!optional && <span className="text-brand-blue ml-1.5">*</span>}
                </p>
                <p className="mt-1 text-[13px] text-zinc-500 max-w-md">{section.hint}</p>
                
                {!uploadedFile && (
                  <label className={cn(
                    "mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shrink-0",
                    "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                    busy && "opacity-50 cursor-not-allowed"
                  )}>
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
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
                )}
              </div>

              {uploadedFile && (
                <div className="relative group w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0 shadow-sm transition-transform duration-200 hover:scale-105">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadedFile.fileUrl} alt={uploadedFile.fileName} className="w-full h-full object-cover" />
                  ) : isPdf ? (
                    <PdfThumbnail url={uploadedFile.fileUrl} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-brand-blue">
                      <FileText className="w-10 h-10 mb-3 opacity-80" />
                      <span className="text-[10px] font-medium line-clamp-3 leading-tight break-all text-zinc-700">
                        {uploadedFile.fileName}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                    <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 transition-colors transform hover:scale-110" title="Change file">
                      <RefreshCw className="w-4 h-4" />
                      <input
                        type="file"
                        accept={section.accept}
                        className="sr-only"
                        disabled={busy || deletingId === uploadedFile.id || saving}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) {
                            await deleteAttachment(uploadedFile.id);
                            await uploadFile(section.id, file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={deletingId === uploadedFile.id}
                      onClick={() => void deleteAttachment(uploadedFile.id)}
                      className="bg-white/20 hover:bg-red-500/80 text-white rounded-full p-2.5 transition-colors transform hover:scale-110"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Busy Overlay */}
                  {(busy || deletingId === uploadedFile.id) && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-blue mb-2" />
                      <span className="text-[10px] font-semibold text-brand-blue">
                        {busy ? "Uploading..." : "Removing..."}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
