"use client";

import { FileText, Paperclip, Plus, Trash2, UploadCloud } from "lucide-react";

/** Quote file + unit price captured on Post a Requirement, before the pipeline. */
export type SupplierQuoteDraft = {
  vendorUserId: string;
  unitPrice: string;
  file: File | null;
};

type VendorOption = { id: string; label: string; email?: string };

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition-colors focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-blue/20 placeholder:text-zinc-400";

/** Company name from "Acme Ltd (email@x.com)" labels used on this form. */
export function supplierNameFromLabel(label: string): string {
  const idx = label.lastIndexOf(" (");
  return idx > 0 ? label.slice(0, idx) : label;
}

export function emailFromVendor(vendor: VendorOption): string {
  if (vendor.email) return vendor.email;
  const match = vendor.label.match(/\(([^)]+)\)\s*$/);
  return match?.[1] || "";
}

export function hasQuotePayload(draft: SupplierQuoteDraft): boolean {
  return Boolean(draft.file) || draft.unitPrice.trim().length > 0;
}

export function SupplierQuoteAttach({
  vendors,
  drafts,
  onChange,
  allowPick,
}: {
  vendors: VendorOption[];
  drafts: SupplierQuoteDraft[];
  onChange: (next: SupplierQuoteDraft[]) => void;
  /** When true, show an Add row picker (open tender). Custom invite lists rows automatically. */
  allowPick?: boolean;
}) {
  const used = new Set(drafts.map((d) => d.vendorUserId));
  const unused = vendors.filter((v) => !used.has(v.id));

  function patch(vendorUserId: string, partial: Partial<SupplierQuoteDraft>) {
    onChange(drafts.map((d) => (d.vendorUserId === vendorUserId ? { ...d, ...partial } : d)));
  }

  function addVendor(id: string) {
    if (!id || used.has(id)) return;
    onChange([...drafts, { vendorUserId: id, unitPrice: "", file: null }]);
  }

  function remove(vendorUserId: string) {
    onChange(drafts.filter((d) => d.vendorUserId !== vendorUserId));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
      <div className="border-b border-zinc-100 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-950">
          <Paperclip className="text-brand-blue h-5 w-5" />
          Supplier quotations
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Attach each supplier&apos;s quote file and unit price here. Optional — you can also add
          quotations later on the requirement pipeline.
        </p>
      </div>

      {vendors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          Select at least one supplier above to attach their quote.
        </p>
      ) : drafts.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No quotes attached yet. Add a supplier below if you already received a price or file.
        </p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const vendor = vendors.find((v) => v.id === draft.vendorUserId);
            if (!vendor) return null;
            return (
              <div
                key={draft.vendorUserId}
                className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-zinc-900">
                    {supplierNameFromLabel(vendor.label)}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">{emailFromVendor(vendor)}</p>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.unitPrice}
                  onChange={(e) => patch(draft.vendorUserId, { unitPrice: e.target.value })}
                  className={inputClass}
                  placeholder="Unit price"
                  aria-label={`Unit price for ${supplierNameFromLabel(vendor.label)}`}
                />
                <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-600 hover:border-brand-blue/50">
                  {draft.file ? (
                    <>
                      <FileText className="text-brand-blue h-4 w-4 shrink-0" />
                      <span className="truncate font-semibold text-zinc-900">{draft.file.name}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span>Quote file (PDF, Word, Excel, image)</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={ACCEPT}
                    onChange={(e) =>
                      patch(draft.vendorUserId, { file: e.target.files?.[0] || null })
                    }
                  />
                </label>
                {allowPick ? (
                  <button
                    type="button"
                    onClick={() => remove(draft.vendorUserId)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove quote for ${supplierNameFromLabel(vendor.label)}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {allowPick && unused.length > 0 && (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-zinc-400" />
          <select
            className={`${inputClass} max-w-md`}
            defaultValue=""
            onChange={(e) => {
              addVendor(e.target.value);
              e.currentTarget.value = "";
            }}
          >
            <option value="">Add a supplier quote…</option>
            {unused.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
