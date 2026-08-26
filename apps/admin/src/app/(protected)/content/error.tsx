"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      <div className="flex-1 overflow-y-auto bg-white p-8">
        <div className="mx-auto w-full max-w-6xl">
          <ErrorPanel
            title="Could not load content dashboard"
            message={error.message || "Failed to load content data. Please try again."}
            onRetry={reset}
          />
        </div>
      </div>
    </div>
  );
}
