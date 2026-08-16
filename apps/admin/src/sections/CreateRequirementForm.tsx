"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";

export type ParticipantOption = { id: string; label: string };

export function CreateRequirementForm({ vendors }: { vendors: ParticipantOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>, post: boolean) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const vendorUserIds = form.getAll("vendorIds").map((id) => String(id));

    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeOfWork: form.get("scopeOfWork"),
          project: form.get("project"),
          sellingPrice: form.get("sellingPrice") || null,
          currency: form.get("currency") || "SAR",
          // datetime-local has no timezone; the browser's own offset is the
          // right interpretation of what the admin typed.
          closesAt: new Date(String(form.get("closesAt"))).toISOString(),
          vendorUserIds,
          post,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not save the requirement.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-blue hover:bg-brand-blue/90 mb-6 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition-colors"
      >
        Post a requirement
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => submit(e, true)}
      className="mb-6 rounded-lg border border-zinc-200 bg-white p-5"
    >
      <div className="grid gap-4">
        <EnquireField label="Scope of work" required>
          <textarea name="scopeOfWork" required rows={3} className={enquireInputClass} />
        </EnquireField>

        <div className="grid gap-4 sm:grid-cols-2">
          <EnquireField label="Project" required>
            <input name="project" required className={enquireInputClass} />
          </EnquireField>
          <EnquireField label="Closes at" required>
            <input name="closesAt" type="datetime-local" required className={enquireInputClass} />
          </EnquireField>
          <EnquireField label="Selling price" hint="Internal only — participants never see this.">
            <input name="sellingPrice" inputMode="decimal" className={enquireInputClass} />
          </EnquireField>
          <EnquireField label="Currency">
            <input name="currency" defaultValue="SAR" className={enquireInputClass} />
          </EnquireField>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
          Invite suppliers
        </legend>
        {vendors.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No active suppliers yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {vendors.map((v) => (
              <label key={v.id} className="flex items-center gap-2.5 text-sm text-zinc-800">
                <input type="checkbox" name="vendorIds" value={v.id} />
                {v.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {/* Disabled while in flight so a double-click cannot post twice. */}
        <button
          type="submit"
          disabled={busy}
          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Post requirement"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            const form = e.currentTarget.closest("form");
            if (form) {
              submit(
                {
                  preventDefault() {},
                  currentTarget: form,
                } as unknown as React.FormEvent<HTMLFormElement>,
                false
              );
            }
          }}
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
