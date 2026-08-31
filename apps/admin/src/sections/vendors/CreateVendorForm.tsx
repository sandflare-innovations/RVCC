"use client";

import { AlertCircle, CheckCircle2, Copy, UserPlus } from "lucide-react";
import { useState } from "react";

import { Modal, SubmitLoader } from "@/components/ui";
import { EnquireField, enquireInputClass } from "@/sections/registrations/enquire/EnquireField";

export type IndustryOption = { id: string; name: string };

type Created = { email: string; tempPassword: string };

export function CreateVendorForm({
  industries,
  onCreated,
}: {
  industries: IndustryOption[];
  onCreated?: () => void;
}) {
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
      onCreated?.();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">Account Created Successfully</h3>
            <p className="text-sm text-emerald-700">For {created.email}</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertCircle className="h-4 w-4" />
            This password is shown once. Copy it now — you cannot see it again.
          </p>
          <div className="flex items-center gap-3">
            <code className="block flex-1 rounded-md border border-amber-200 bg-white px-4 py-3 text-center font-mono text-lg tracking-wider text-amber-950 select-all">
              {created.tempPassword}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(created.tempPassword);
                setCopied(true);
              }}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-md px-6 font-semibold text-white shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy Password
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t border-emerald-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setCopied(false);
              setOpen(false); // Close modal if they want to add another later
            }}
            className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <UserPlus className="h-4 w-4" />
        Add supplier account
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Supplier Account"
        maxWidth="2xl"
      >
        <form onSubmit={onSubmit} className="p-6">
          <p className="mb-6 text-sm text-zinc-500">
            For suppliers RVCC already works with. They receive a temporary password and must set
            their own on first sign-in.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <EnquireField label="Email Address" required>
              <input
                name="email"
                type="email"
                required
                className={enquireInputClass}
                placeholder="supplier@company.com"
              />
            </EnquireField>
            <EnquireField label="Contact Name" required>
              <input name="name" required className={enquireInputClass} placeholder="John Doe" />
            </EnquireField>
            <EnquireField label="Company Name">
              <input name="company" className={enquireInputClass} placeholder="Company Ltd" />
            </EnquireField>
            <EnquireField label="Phone Number">
              <input name="phone" className={enquireInputClass} placeholder="+1234567890" />
            </EnquireField>
          </div>

          {industries.length > 0 ? (
            <fieldset className="mt-8 border-t border-zinc-100 pt-6">
              <legend className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
                Assign Industries
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {industries.map((industry) => (
                  <label
                    key={industry.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      name="industryIds"
                      value={industry.id}
                      className="text-brand-blue focus:ring-brand-blue h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-sm font-medium text-zinc-900">{industry.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="mt-8 border-t border-zinc-100 pt-6">
              <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                No industries have been set up yet, so none can be assigned.
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {busy ? <SubmitLoader text="Creating" /> : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
