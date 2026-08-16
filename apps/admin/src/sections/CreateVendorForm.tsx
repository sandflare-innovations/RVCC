"use client";

import { useState } from "react";

import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";

export type IndustryOption = { id: string; name: string };

type Created = { email: string; tempPassword: string };

/**
 * Creates a supplier login for a company RVCC already works with.
 *
 * The temporary password comes back once, in the create response, and is never
 * stored in plaintext or emailed — so this is the only place it is ever shown,
 * and the copy says so plainly.
 */
export function CreateVendorForm({ industries }: { industries: IndustryOption[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          company: form.get("company"),
          phone: form.get("phone"),
          industryIds: form.getAll("industryIds"),
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        vendor?: { email: string };
        tempPassword?: string;
      };

      if (!res.ok || !body.vendor || !body.tempPassword) {
        setError(body.error ?? "Could not create the account.");
        return;
      }
      setCreated({ email: body.vendor.email, tempPassword: body.tempPassword });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-950">Account created for {created.email}</p>
        <p className="mt-1 text-sm font-medium text-amber-700">
          This password is shown once. Copy it now — you cannot see it again.
        </p>
        <code className="mt-3 block rounded-md bg-zinc-100 px-3.5 py-2.5 font-mono text-base tracking-wide text-zinc-950 select-all">
          {created.tempPassword}
        </code>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(created.tempPassword);
              setCopied(true);
            }}
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition-colors"
          >
            {copied ? "Copied" : "Copy password"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setCopied(false);
            }}
            className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-blue hover:bg-brand-blue/90 mb-6 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition-colors"
      >
        Add supplier account
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
      <p className="mb-4 text-sm text-zinc-600">
        For suppliers RVCC already works with. They receive a temporary password and must set their
        own on first sign-in.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <EnquireField label="Email" required>
          <input name="email" type="email" required className={enquireInputClass} />
        </EnquireField>
        <EnquireField label="Contact name" required>
          <input name="name" required className={enquireInputClass} />
        </EnquireField>
        <EnquireField label="Company">
          <input name="company" className={enquireInputClass} />
        </EnquireField>
        <EnquireField label="Phone">
          <input name="phone" className={enquireInputClass} />
        </EnquireField>
      </div>

      {industries.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase">
            Industries
          </legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {industries.map((industry) => (
              <label key={industry.id} className="flex items-center gap-2.5 text-sm text-zinc-800">
                <input type="checkbox" name="industryIds" value={industry.id} />
                {industry.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          No industries have been set up yet, so none can be assigned.
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex gap-2">
        {/* Disabled while in flight so a double-click cannot create two accounts. */}
        <button
          type="submit"
          disabled={busy}
          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
