"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Pencil } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import {
  type DraftRegistration,
  useEnquire,
  useRequireSession,
} from "@/sections/enquire/EnquireContext";

function display(value?: string | null) {
  const v = value?.trim();
  return v ? v : "—";
}

function maskAccount(value?: string | null) {
  const v = value?.trim() ?? "";
  if (!v) return "—";
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, v.length - 4))}${v.slice(-4)}`;
}

function DocField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-0.5 border-b border-zinc-100 py-1.5 sm:grid-cols-[minmax(140px,200px)_1fr] sm:gap-3 sm:py-2">
      <dt className="text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
        {label}
      </dt>
      <dd className="text-sm leading-snug break-words whitespace-pre-wrap text-zinc-950">
        {display(value)}
      </dd>
    </div>
  );
}

function DocSection({
  number,
  title,
  editHref,
  children,
}: {
  number: string;
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-zinc-200 last:border-b-0">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:px-7">
        <h3 className="font-heading text-xl tracking-[0.04em] text-zinc-950 uppercase sm:text-2xl">
          <span className="text-brand-blue mr-2 font-mono text-base tabular-nums sm:text-lg">
            {number}
          </span>
          {title}
        </h3>
        <Link
          href={editHref}
          className="text-brand-blue inline-flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-[0.08em] uppercase transition-opacity hover:opacity-80"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit
        </Link>
      </div>
      <div className="px-5 py-1 sm:px-7">{children}</div>
    </section>
  );
}

function EntryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-2 rounded-md border border-zinc-200 bg-white px-3 py-2">
      <p className="mb-1 text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase">{title}</p>
      <dl>{children}</dl>
    </div>
  );
}

function ReviewDocument({ registration }: { registration: DraftRegistration }) {
  const tax = (registration.company?.taxIdentifiers || {}) as Record<string, string>;
  const categories = registration.productCategories
    .map((id) => ENQUIRE_CATEGORIES.find((c) => c.id === id)?.label || id)
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <header className="border-b border-zinc-200 bg-white px-5 py-6 sm:px-7">
        <p className="text-brand-blue text-sm font-bold tracking-[0.2em] uppercase sm:text-base">
          RVCC Procurement
        </p>
        <h2 className="font-heading mt-1.5 text-2xl tracking-[0.04em] text-zinc-950 uppercase sm:text-3xl">
          Prospective Supplier Registration
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Applicant email
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-950">{display(registration.email)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Status
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-950">{display(registration.status)}</dd>
          </div>
        </dl>
      </header>

      <DocSection number="01" title="Company details" editHref="/register/company">
        <dl>
          <DocField label="Legal company name" value={registration.company?.legalName} />
          <DocField label="Doing business as (DBA)" value={registration.company?.dbaName} />
          <DocField label="Country" value={registration.company?.country} />
          <DocField label="Organization type" value={registration.company?.organizationType} />
          <DocField label="Supplier type" value={registration.company?.supplierType} />
          <DocField label="Year established" value={registration.company?.yearEstablished} />
          <DocField label="VAT / Tax ID" value={tax.vat} />
          <DocField label="Commercial registration (CR)" value={tax.cr} />
          <DocField label="TIN" value={tax.tin} />
          <DocField label="D-U-N-S number" value={registration.company?.dunsNumber} />
          <DocField label="Website" value={registration.company?.website} />
          <DocField label="Company description" value={registration.company?.description} />
        </dl>
      </DocSection>

      <DocSection number="02" title="Contacts" editHref="/register/contacts">
        {registration.contacts.length === 0 ? (
          <p className="py-3 text-sm text-zinc-500">No contacts provided.</p>
        ) : (
          registration.contacts.map((c, i) => (
            <EntryCard key={c.id || i} title={`Contact ${i + 1}`}>
              <DocField label="Name" value={`${c.firstName || ""} ${c.lastName || ""}`.trim()} />
              <DocField label="Job title" value={c.jobTitle} />
              <DocField label="Email" value={c.email} />
              <DocField label="Phone" value={c.phone} />
              <DocField label="Mobile" value={c.mobile} />
              <DocField label="Administrative contact" value={c.isAdministrative ? "Yes" : "No"} />
              <DocField label="Request portal login" value={c.requestUserAccount ? "Yes" : "No"} />
            </EntryCard>
          ))
        )}
      </DocSection>

      <DocSection number="03" title="Addresses" editHref="/register/addresses">
        {registration.addresses.length === 0 ? (
          <p className="py-3 text-sm text-zinc-500">No addresses provided.</p>
        ) : (
          registration.addresses.map((a, i) => (
            <EntryCard key={a.id || i} title={a.label?.trim() || `Address ${i + 1}`}>
              <DocField label="Line 1" value={a.line1} />
              <DocField label="Line 2" value={a.line2} />
              <DocField label="City" value={a.city} />
              <DocField label="Region / state" value={a.region} />
              <DocField label="Postal code" value={a.postalCode} />
              <DocField label="Country" value={a.country} />
              <DocField label="Phone" value={a.phone} />
              <DocField label="Email" value={a.email} />
              <DocField label="Purposes" value={a.purposes?.length ? a.purposes.join(", ") : ""} />
            </EntryCard>
          ))
        )}
      </DocSection>

      <DocSection number="04" title="Classifications" editHref="/register/classifications">
        {registration.classifications.length === 0 ? (
          <p className="py-3 text-sm text-zinc-500">No classifications provided.</p>
        ) : (
          registration.classifications.map((c, i) => (
            <EntryCard key={c.id || i} title={`Classification ${i + 1}`}>
              <DocField label="Classification" value={c.classification} />
              <DocField label="Certificate number" value={c.certificateNumber} />
              <DocField label="Certifying agency" value={c.certifyingAgency} />
              <DocField label="Effective date" value={c.effectiveDate} />
              <DocField label="Expiration date" value={c.expirationDate} />
            </EntryCard>
          ))
        )}
      </DocSection>

      <DocSection number="05" title="Bank accounts" editHref="/register/bank">
        {registration.bankAccounts.length === 0 ? (
          <p className="py-3 text-sm text-zinc-500">No bank accounts provided.</p>
        ) : (
          registration.bankAccounts.map((b, i) => (
            <EntryCard key={b.id || i} title={`Account ${i + 1}`}>
              <DocField label="Country" value={b.country} />
              <DocField label="Bank name" value={b.bankName} />
              <DocField label="Branch" value={b.branchName} />
              <DocField label="Account name" value={b.accountName} />
              <DocField label="Account number" value={maskAccount(b.accountNumber)} />
              <DocField label="IBAN" value={maskAccount(b.iban)} />
              <DocField label="Routing number" value={maskAccount(b.routingNumber)} />
              <DocField label="Currency" value={b.currency} />
            </EntryCard>
          ))
        )}
      </DocSection>

      <DocSection number="06" title="Products & services" editHref="/register/products">
        {categories.length === 0 ? (
          <p className="py-3 text-sm text-zinc-500">No categories selected.</p>
        ) : (
          <ul className="grid gap-2 py-3 sm:grid-cols-2">
            {categories.map((label) => (
              <li
                key={label}
                className="border-brand-blue/30 flex items-start gap-2 border-l-2 pl-3 text-sm text-zinc-950"
              >
                {label}
              </li>
            ))}
          </ul>
        )}
      </DocSection>

      <DocSection number="07" title="Questionnaire" editHref="/register/questionnaire">
        <dl>
          {ENQUIRE_QUESTIONNAIRE.map((q) => {
            const ans = registration.questionnaire.find((a) => a.questionKey === q.key)?.answer;
            return <DocField key={q.key} label={q.label} value={ans} />;
          })}
        </dl>
      </DocSection>

      <footer className="border-t border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-relaxed text-zinc-500 sm:px-7 sm:text-base">
        This document is a read-only summary of your application. Use Edit on any section to change
        details — updates appear here automatically before you submit.
      </footer>
    </article>
  );
}

export function ReviewStep() {
  useRequireSession("review");
  const router = useRouter();
  const { registration, loading, refresh, setError, clearLocal } = useEnquire();
  const [busy, setBusy] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setLocalErrors([]);
    try {
      const draft = registration;
      if (!draft) {
        setError("Nothing to submit — verify your email and complete the form.");
        return;
      }
      const res = await fetch("/api/enquire/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          company: draft.company,
          contacts: draft.contacts,
          addresses: draft.addresses,
          classifications: draft.classifications,
          bankAccounts: draft.bankAccounts,
          productCategories: draft.productCategories,
          questionnaire: draft.questionnaire,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalErrors(data.errors || [data.error || "Submit failed"]);
        setError(data.error || "Submit failed");
        return;
      }
      clearLocal();
      router.push(`/access-held?ref=${encodeURIComponent(data.referenceNumber || "")}`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !registration) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
          Confirm every section below. Submitting saves your application to RVCC — until then it
          stays only in this browser.
        </p>
      </div>

      {localErrors.length > 0 && (
        <ul
          role="alert"
          className="list-inside list-disc border-l-4 border-red-500 bg-red-50 px-4 py-3.5 text-base leading-relaxed font-medium text-red-800"
        >
          {localErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {registration ? (
        <ReviewDocument registration={registration} />
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-base text-zinc-600">
          No draft loaded. Verify your email to continue.
        </p>
      )}

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={busy}
          onClick={() => router.push("/register/questionnaire")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          pending={busy}
          disabled={!registration}
          onClick={() => void submit()}
        >
          {busy ? "Submitting…" : "Submit Registration"}
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
