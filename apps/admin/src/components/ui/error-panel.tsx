"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Reusable error boundary component shown when a Suspense section or page
 * fails to load. Provides a branded UI with a retry button.
 */
export function ErrorPanel({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200/60 bg-red-50/50 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-zinc-900">{title}</h2>
      {message && <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="hover:border-brand-blue hover:text-brand-blue focus:ring-brand-blue/30 mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all focus:ring-2 focus:outline-none"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
