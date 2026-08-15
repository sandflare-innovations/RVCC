"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function AgentToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-60"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
