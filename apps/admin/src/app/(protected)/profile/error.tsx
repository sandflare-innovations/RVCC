"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ErrorPanel
        title="Could not load profile"
        message={error.message || "Failed to load your profile information. Please try again."}
        onRetry={reset}
      />
    </div>
  );
}
