"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

import { Modal, SubmitLoader } from "@/components/ui";

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

    const category = form.get("category");
    const scopeOfWork = form.get("scopeOfWork");
    const scopeWithCategory = category ? `${scopeOfWork}\n\nCategory: ${category}` : scopeOfWork;

    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeOfWork: scopeWithCategory,
          project: form.get("project"),
          sellingPrice: form.get("sellingPrice") || null,
          currency: form.get("currency") || "SAR",
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <FileText className="h-4 w-4" />
        Post a requirement
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Requirement" maxWidth="2xl">
        <form onSubmit={(e) => submit(e, true)} className="p-6">
          <p className="mb-6 text-sm text-zinc-500">
            Detail the scope of work and optionally invite pre-approved suppliers to participate.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6">
            <EnquireField label="Scope of work" required>
              <textarea
                name="scopeOfWork"
                required
                rows={4}
                className={enquireInputClass}
                placeholder="Describe the requirements in detail..."
              />
            </EnquireField>

            <div className="grid gap-6 sm:grid-cols-2">
              <EnquireField label="Project Title" required>
                <input
                  name="project"
                  required
                  className={enquireInputClass}
                  placeholder="e.g. Q3 Server Refresh"
                />
              </EnquireField>
              <EnquireField label="Category">
                <select name="category" className={enquireInputClass}>
                  <option value="">Select a category (optional)</option>
                  <option value="IT & Hardware">IT & Hardware</option>
                  <option value="Software Services">Software Services</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </EnquireField>
              <EnquireField label="Closes at (Deadline)" required>
                <input
                  name="closesAt"
                  type="datetime-local"
                  required
                  className={enquireInputClass}
                />
              </EnquireField>
              <EnquireField
                label="Selling price"
                hint="Internal only — participants never see this."
              >
                <input
                  name="sellingPrice"
                  inputMode="decimal"
                  className={enquireInputClass}
                  placeholder="0.00"
                />
              </EnquireField>
              <EnquireField label="Currency">
                <input name="currency" defaultValue="SAR" className={enquireInputClass} />
              </EnquireField>
            </div>
          </div>

          <fieldset className="mt-8 border-t border-zinc-100 pt-6">
            <legend className="mb-4 text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
              Invite suppliers
            </legend>
            {vendors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                No active suppliers available to invite.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {vendors.map((v) => (
                  <label
                    key={v.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      name="vendorIds"
                      value={v.id}
                      className="text-brand-blue focus:ring-brand-blue h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-sm font-medium text-zinc-900">{v.label}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Cancel
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {busy ? <SubmitLoader text="Saving" /> : "Post Requirement"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
