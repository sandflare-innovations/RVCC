"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { applyUpdate, onUpdateAvailable } from "@/lib/pwa/register-sw";

export function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    return onUpdateAvailable((available) => {
      setVisible(available);
    });
  }, []);

  useEffect(() => {
    if (!visible || applying) return;

    const timer = window.setTimeout(() => {
      setApplying(true);
      applyUpdate();
    }, 12_000);

    return () => window.clearTimeout(timer);
  }, [visible, applying]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-4 pt-3"
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Update available</p>
          <p className="text-xs text-zinc-500">A newer version of RVCC Vendor Portal is ready.</p>
        </div>
        <button
          type="button"
          disabled={applying}
          onClick={() => {
            setApplying(true);
            applyUpdate();
          }}
          className="bg-brand-blue inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${applying ? "animate-spin" : ""}`} />
          {applying ? "Updating…" : "Update now"}
        </button>
      </div>
    </div>
  );
}
