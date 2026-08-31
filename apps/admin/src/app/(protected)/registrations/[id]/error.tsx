"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function RegistrationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6 p-6">
      <ErrorPanel
        title="Could not load registration"
        message={
          error.message || "Failed to load registration details. This might be a temporary issue."
        }
        onRetry={reset}
      />
    </div>
  );
}
