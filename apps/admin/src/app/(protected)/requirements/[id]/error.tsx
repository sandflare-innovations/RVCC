"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function RequirementDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <ErrorPanel
            title="Could not load requirement"
            message={
              error.message ||
              "Failed to load requirement details. This might be a temporary issue."
            }
            onRetry={reset}
          />
        </div>
      </div>
    </div>
  );
}
