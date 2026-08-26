"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      <div className="flex-1 flex items-center justify-center p-8">
        <ErrorPanel
          title="Could not load dashboard"
          message={error.message || "An unexpected error occurred while loading the dashboard data. Please try again."}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
