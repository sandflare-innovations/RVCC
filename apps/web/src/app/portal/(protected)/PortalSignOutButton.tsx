"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function PortalSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Could not sign out. Try again.");
        return;
      }
      router.replace("/portal/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
