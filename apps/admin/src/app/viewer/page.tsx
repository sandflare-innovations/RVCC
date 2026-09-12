"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Copy,
  Download,
  Loader2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";

const Model3DPreview = dynamic(
  () =>
    import("@/sections/files/Model3DPreview").then((m) => m.Model3DPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-[#0073bc]" />
      </div>
    ),
  }
);

function formatBytes(bytes: number | string | null | undefined) {
  const num = Number(bytes);
  if (!num || isNaN(num) || num === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function ViewerContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const name = searchParams.get("name") || "3D Model";
  const size = searchParams.get("size");
  const ext = searchParams.get("ext") || "glb";

  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "/content/files";
    }
  };

  if (!url) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 mb-4 border border-zinc-800">
          <Box className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">No Model URL Provided</h2>
        <p className="mt-2 text-xs text-zinc-400 max-w-sm">
          Please provide a valid 3D model URL in the query parameter (e.g. ?url=...)
        </p>
        <Link
          href="/content/files"
          className="mt-6 flex items-center gap-2 rounded-2xl bg-[#0073bc] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to File Manager</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col bg-black text-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            title="Close Tab"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Box className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold text-zinc-100" title={name}>
                  {name}
                </h1>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono uppercase text-zinc-400 shrink-0">
                  {ext.toUpperCase()}
                </span>
                {size && (
                  <span className="text-[11px] text-zinc-400 hidden sm:inline shrink-0">
                    • {formatBytes(size)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Copy Direct CDN URL"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copied ? "Copied!" : "Copy CDN"}</span>
          </button>

          <a
            href={url}
            download={name}
            className="flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors shadow-xs cursor-pointer"
            title="Download Original Model"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
        </div>
      </header>

      {/* Main 3D Viewport Filling 100% of the Window */}
      <main className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-zinc-950">
        <Model3DPreview
          url={url}
          name={name}
          sizeBytes={size || undefined}
          className="h-full w-full rounded-none"
        />
      </main>
    </div>
  );
}

export default function Standalone3DViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-[#0073bc]" />
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
