"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function VendorDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto bg-white p-8">
        <div className="mx-auto w-full max-w-6xl">
          <ErrorPanel
            title="Could not load vendor profile"
            message={
              error.message || "Failed to load vendor details. This might be a temporary issue."
            }
            onRetry={reset}
          />
        </div>
      </div>
    </div>
  );
}
