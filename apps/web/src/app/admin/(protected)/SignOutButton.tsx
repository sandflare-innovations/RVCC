"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Sign out failed");
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Sign out failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
        className="text-sm font-medium text-neutral-600 underline hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
