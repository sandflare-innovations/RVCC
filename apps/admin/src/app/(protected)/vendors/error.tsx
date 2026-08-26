"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function VendorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ErrorPanel
        title="Could not load vendors"
        message={error.message || "Failed to load vendors list. Please try again."}
        onRetry={reset}
      />
    </div>
  );
}
