"use client";

import { useState } from "react";
import {
  HiOutlineDownload,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineShare,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineFolder,
} from "react-icons/hi";
import {
  MdOutlineMusicNote,
  MdOutlineVideocam,
  MdOutlineImage,
} from "react-icons/md";
import type { PublicMediaFile } from "@/lib/content/media";

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ShareMediaClient({ file }: { file: PublicMediaFile }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: file.description || `Shared via RVCC: ${file.name}`,
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    handleCopyLink();
  };

  const isImage = file.fileType === "IMAGE";
  const isVideo = file.fileType === "VIDEO";
  const isAudio = file.fileType === "AUDIO";
  const isPdf = file.mimeType?.includes("pdf") || file.extension === "pdf";

  return (
    <div className="w-full flex flex-col items-center">
      {/* Media Card Container */}
      <div className="w-full rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        {/* Header with Title and Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
          <div className="min-w-0">
            {file.folder && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <HiOutlineFolder className="h-4 w-4 text-[#0073bc]" />
                <span>{file.folder.name}</span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate" title={file.name}>
              {file.name}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              {formatBytes(file.sizeBytes)} • {file.mimeType || file.extension.toUpperCase()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-400" /> : <HiOutlineClipboardCopy className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
            >
              <HiOutlineShare className="h-4 w-4" />
              <span>Share</span>
            </button>

            <a
              href={file.fileUrl}
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors shadow cursor-pointer"
            >
              <HiOutlineDownload className="h-4 w-4" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Media Preview Box */}
        <div className="my-6 flex items-center justify-center rounded-2xl bg-zinc-950/80 border border-zinc-800/60 p-2 sm:p-4 min-h-[320px] max-h-[70vh] overflow-hidden">
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.name}
              className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
            />
          ) : isVideo ? (
            <video
              src={file.fileUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[65vh] w-full rounded-lg shadow-xl"
            />
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center p-8 w-full max-w-md">
              <MdOutlineMusicNote className="h-16 w-16 text-[#0073bc] mb-4" />
              <p className="font-semibold text-sm mb-4 text-zinc-200">{file.name}</p>
              <audio src={file.fileUrl} controls className="w-full" />
            </div>
          ) : isPdf ? (
            <iframe
              src={file.fileUrl}
              title={file.name}
              className="h-[65vh] w-full rounded-lg bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <HiOutlineDocumentText className="h-16 w-16 text-zinc-500 mb-3" />
              <p className="font-medium text-base text-zinc-300">{file.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{formatBytes(file.sizeBytes)}</p>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-1.5 text-xs text-[#0073bc] hover:underline"
              >
                <span>Direct Open</span>
                <HiOutlineExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer / Description */}
        {file.description && (
          <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-800/40">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-sm text-zinc-300">{file.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
