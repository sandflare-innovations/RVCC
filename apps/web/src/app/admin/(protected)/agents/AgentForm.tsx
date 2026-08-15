"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function AgentForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add that agent.");
        return;
      }
      setEmail("");
      setName("");
      setCompany("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="text-sm text-neutral-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Company</span>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add agent"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
