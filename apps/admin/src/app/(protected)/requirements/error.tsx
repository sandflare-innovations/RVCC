"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function RequirementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ErrorPanel
        title="Could not load requirements"
        message={error.message || "Failed to load requirements list. Please try again."}
        onRetry={reset}
      />
    </div>
  );
}
