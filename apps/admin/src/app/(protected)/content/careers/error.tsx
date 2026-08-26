"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function CareersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ErrorPanel
        title="Could not load careers"
        message={error.message || "Failed to load job listings. Please try again."}
        onRetry={reset}
      />
    </div>
  );
}
