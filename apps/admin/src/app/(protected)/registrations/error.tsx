"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function RegistrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ErrorPanel
        title="Could not load registrations"
        message={error.message || "Failed to load registrations list. Please try again."}
        onRetry={reset}
      />
    </div>
  );
}
