"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle, ExternalLink, Eye, Trash2 } from "lucide-react";

import { StatusBadge } from "@repo/ui";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export type RegistrationSummary = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  createdAt: string;
  company: {
    legalName: string;
    dbaName: string;
    country: string;
    organizationType: string;
    supplierType: string;
    website: string;
    yearEstablished: string;
    dunsNumber: string;
    description: string;
    tax: Record<string, string>;
  } | null;
  contacts: { name: string; email: string; jobTitle: string; phone: string; wantsLogin: boolean }[];
  addresses: { label: string; full: string; purposes: string }[];
  bankAccountCount: number;
  categories: string;
  vendorAccounts: string[];
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(120px,180px)_1fr] gap-3 border-b border-zinc-100 py-1.5 last:border-0">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm break-words text-zinc-950">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function RegistrationRowActions({
  registration,
  canDelete,
}: {
  registration: RegistrationSummary;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const r = registration;
  const label = r.company?.legalName?.trim() || r.email;
  // Typed confirmation stands in for the colour cue a red button would give.
  const confirmTarget = r.referenceNumber || r.email;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${r.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not delete this registration."));
        return;
      }
      setShowDelete(false);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          aria-label={`View details for ${label}`}
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => {
              setConfirmText("");
              setError(null);
              setShowDelete(true);
            }}
            aria-label={`Delete ${label}`}
            className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title={label}
        description={[r.email, r.referenceNumber].filter(Boolean).join(" · ")}
        size="lg"
        footer={
          <Link
            href={`/registrations/${r.id}`}
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors"
          >
            Open full record
            <ExternalLink className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status} />
            <span className="text-xs text-zinc-500">
              {r.submittedAt ? `Submitted ${r.submittedAt}` : `Started ${r.createdAt}`}
            </span>
          </div>

          <section>
            <h3 className="mb-1.5 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
              Company
            </h3>
            <dl>
              <Row label="Legal name" value={r.company?.legalName} />
              <Row label="Trading name" value={r.company?.dbaName} />
              <Row label="Country" value={r.company?.country} />
              <Row label="Organization" value={r.company?.organizationType} />
              <Row label="Supplier type" value={r.company?.supplierType} />
              <Row label="Established" value={r.company?.yearEstablished} />
              <Row label="Website" value={r.company?.website} />
              <Row label="VAT" value={r.company?.tax.vat} />
              <Row label="CR" value={r.company?.tax.cr} />
              <Row label="D-U-N-S" value={r.company?.dunsNumber} />
              <Row label="Description" value={r.company?.description} />
            </dl>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
              Contacts ({r.contacts.length})
            </h3>
            {r.contacts.length === 0 ? (
              <p className="text-sm text-zinc-600">None provided.</p>
            ) : (
              <ul className="space-y-2">
                {r.contacts.map((c, i) => (
                  <li key={i} className="rounded-md border border-zinc-100 px-3 py-2 text-sm">
                    <p className="font-medium text-zinc-950">{c.name || "—"}</p>
                    <p className="text-zinc-600">
                      {[c.jobTitle, c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {c.wantsLogin && (
                      <p className="text-brand-blue mt-0.5 text-xs font-semibold">
                        Requested portal login
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
              Addresses ({r.addresses.length})
            </h3>
            {r.addresses.length === 0 ? (
              <p className="text-sm text-zinc-600">None provided.</p>
            ) : (
              <ul className="space-y-2">
                {r.addresses.map((a, i) => (
                  <li key={i} className="rounded-md border border-zinc-100 px-3 py-2 text-sm">
                    <p className="text-zinc-950">{a.full || "—"}</p>
                    {a.purposes && <p className="text-xs text-zinc-600">{a.purposes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
              Other
            </h3>
            <dl>
              <Row label="Products & services" value={r.categories} />
              <Row
                label="Bank accounts"
                value={
                  r.bankAccountCount
                    ? `${r.bankAccountCount} on file — open full record to view`
                    : "None"
                }
              />
              <Row label="Portal accounts" value={r.vendorAccounts.join(", ")} />
            </dl>
          </section>
        </div>
      </Modal>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete registration"
        description="This cannot be undone."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={busy}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy || confirmText.trim() !== confirmTarget}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-zinc-700">
            Deleting <strong className="text-zinc-950">{label}</strong> also removes its company
            profile, {r.contacts.length} contact{r.contacts.length === 1 ? "" : "s"},{" "}
            {r.addresses.length} address{r.addresses.length === 1 ? "" : "es"}, {r.bankAccountCount}{" "}
            bank account{r.bankAccountCount === 1 ? "" : "s"}, questionnaire answers, attachments
            {r.vendorAccounts.length > 0 && (
              <>
                {" "}
                and{" "}
                <strong className="text-zinc-950">{r.vendorAccounts.length} portal login</strong>
                {r.vendorAccounts.length === 1 ? "" : "s"}
              </>
            )}
            .
          </p>

          <div>
            <label
              htmlFor="confirm-delete"
              className="block text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase"
            >
              Type <span className="font-mono normal-case">{confirmTarget}</span> to confirm
            </label>
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 mt-1.5 w-full rounded-md border border-zinc-300 px-3.5 py-2.5 text-base outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
