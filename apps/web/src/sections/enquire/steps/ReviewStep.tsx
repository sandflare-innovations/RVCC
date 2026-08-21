"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Pencil } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { attachmentSectionLabel } from "@/data/enquire-attachments";
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
    <div className="grid gap-0.5 border-b border-zinc-100 py-2 sm:grid-cols-[minmax(140px,200px)_1fr] sm:gap-3 sm:py-3">
      <dt className="text-xs font-bold tracking-[0.06em] text-zinc-900 uppercase">
        {label}
      </dt>
      <dd className="text-[15px] leading-snug break-words whitespace-pre-wrap text-zinc-600 font-medium">
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
    <section className="group border-b border-zinc-100 last:border-b-0">
      <div className="flex items-center justify-between gap-3 bg-white px-6 py-5 sm:px-10 transition-colors group-hover:bg-zinc-50/30">
        <h3 className="font-enquire text-lg sm:text-xl text-zinc-900 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-enquire text-lg font-medium">
            {number}
          </span>
          {title}
        </h3>
        <Link
          href={editHref}
          className="text-brand-blue/70 hover:text-brand-blue flex shrink-0 items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors bg-white hover:bg-brand-blue/5 px-3 py-1.5 rounded-full ring-1 ring-brand-blue/20 shadow-sm"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit
        </Link>
      </div>
      <div className="px-6 pb-6 sm:px-10">{children}</div>
    </section>
  );
}

function EntryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-zinc-200/60 bg-white/50 shadow-sm transition-all hover:shadow-md hover:bg-white">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
        <p className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase">{title}</p>
      </div>
      <dl className="px-4 py-2">{children}</dl>
    </div>
  );
}

export function ReviewDocument({ registration }: { registration: DraftRegistration }) {
  const tax = (registration.company?.taxIdentifiers || {}) as Record<string, string>;
  const categories = registration.productCategories
    .map((id) => ENQUIRE_CATEGORIES.find((c) => c.id === id)?.label || id)
    .filter(Boolean);

  return (
    <article className="relative flex flex-col h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-blue via-brand-blue/80 to-brand-blue z-10" />
      
      <header className="relative shrink-0 border-b border-zinc-100 bg-zinc-50/50 px-6 py-5 sm:px-8 sm:py-6 flex flex-col items-center text-center">
        <p className="text-brand-blue/80 text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5">
          RVCC Procurement
        </p>
        <h2 className="font-enquire text-xl text-zinc-950 sm:text-2xl font-medium tracking-tight">
          Supplier Registration Dossier
        </h2>
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <img src="/images/logo/logo.webp" alt="" className="w-28 h-auto" />
        </div>
        
        <dl className="mt-4 w-full text-center">
          <div>
            <dt className="text-[11px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
              Applicant email
            </dt>
            <dd className="mt-0.5 text-sm text-zinc-950 font-medium">{display(registration.email)}</dd>
          </div>
        </dl>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        <DocSection number="01" title="Company details" editHref="/enquire/company">
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

        <DocSection number="02" title="Contacts" editHref="/enquire/contacts">
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

        <DocSection number="03" title="Addresses" editHref="/enquire/addresses">
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

        <DocSection number="04" title="Classifications" editHref="/enquire/classifications">
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

        <DocSection number="05" title="Bank accounts" editHref="/enquire/bank">
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

        <DocSection number="06" title="Products & services" editHref="/enquire/products">
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

        <DocSection number="07" title="Questionnaire" editHref="/enquire/questionnaire">
          <dl>
            {ENQUIRE_QUESTIONNAIRE.map((q) => {
              const ans = registration.questionnaire.find((a) => a.questionKey === q.key)?.answer;
              return <DocField key={q.key} label={q.label} value={ans} />;
            })}
          </dl>
        </DocSection>

        <DocSection number="08" title="Supporting documents" editHref="/enquire/attachments">
          {(registration.attachments ?? []).length === 0 ? (
            <p className="py-3 text-sm text-zinc-500">No documents uploaded.</p>
          ) : (
            <dl>
              {(registration.attachments ?? []).map((a) => (
                <div
                  key={a.id}
                  className="grid gap-0.5 border-b border-zinc-100 py-2 sm:grid-cols-[minmax(140px,200px)_1fr] sm:gap-3 sm:py-3"
                >
                  <dt className="text-xs font-bold tracking-[0.06em] text-zinc-900 uppercase">
                    {attachmentSectionLabel(a.section)}
                  </dt>
                  <dd className="text-[15px] text-zinc-600 font-medium">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue font-medium hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DocSection>
      </div>
    </article>
  );
}

export function ReviewStep() {
  useRequireSession("review");
  const router = useRouter();
  const { registration, loading, refresh, setError } = useEnquire();
  const [busy, setBusy] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

  // Always pull the latest persisted draft when this step mounts or regains focus,
  // so edits from earlier steps show up without a full page reload.
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      setSyncing(true);
      try {
        await refresh();
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };
    void sync();

    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setLocalErrors([]);
    try {
      // Flush any in-flight background saves before locking the submission.
      await refresh();
      const res = await fetch("/api/enquire/submit", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalErrors(data.errors || [data.error || "Submit failed"]);
        setError(data.error || "Submit failed");
        return;
      }
      router.push(`/enquire/done?ref=${encodeURIComponent(data.referenceNumber || "")}`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !registration) return null;

  return (
    <div className="flex flex-col flex-1 h-full animate-fade-in pb-2">
      {headerNode &&
        createPortal(
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <InteractiveHoverButton
              type="button"
              variant="solid"
              className="flex-1 sm:flex-none px-8"
              pending={busy}
              disabled={!registration}
              onClick={() => void submit()}
            >
              {busy ? "Submitting..." : "Submit"}
            </InteractiveHoverButton>
          </div>,
          headerNode
        )}

      {syncing && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-1.5 rounded-full bg-brand-blue text-white text-xs font-bold tracking-[0.1em] uppercase shadow-lg shadow-brand-blue/30 animate-in fade-in zoom-in duration-300">
          Updating...
        </div>
      )}

      {localErrors.length > 0 && (
        <ul
          role="alert"
          className="mb-4 shrink-0 list-inside list-disc rounded-xl border border-red-500/20 bg-red-50 px-5 py-4 text-sm leading-relaxed font-medium text-red-800"
        >
          {localErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {registration ? (
        <div className="flex-1 min-h-0">
          <ReviewDocument registration={registration} />
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-base text-zinc-600">
          Your draft could not be loaded. Return to{" "}
          <Link
            href="/enquire/verify"
            className="text-brand-blue font-semibold underline-offset-2 hover:underline"
          >
            Verify
          </Link>{" "}
          and sign in again.
        </p>
      )}
    </div>
  );
}
