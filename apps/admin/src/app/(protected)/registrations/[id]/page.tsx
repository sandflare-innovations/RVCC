import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Mail,
  FileText,
  User,
  KeyRound,
  Info,
  MapPin,
  CreditCard,
  HelpCircle,
  Paperclip,
  ShieldCheck,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";

import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton";

import { StatusBadge } from "@/lib/ui";

import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { registrationAttachmentLabel } from "@/data/registration-attachments";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { ReviewPanel } from "@/sections/registrations/ReviewPanel";

export const dynamic = "force-dynamic";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
        <h2 className="text-xs font-bold tracking-[0.12em] text-brand-blue uppercase">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm break-words text-zinc-950 font-medium">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RegistrationDetail = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  productCategories: string[];
  company: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  classifications: Array<Record<string, unknown>>;
  bankAccounts: Array<Record<string, unknown>>;
  questionnaire: Array<{ questionKey: string; answer: string }>;
  attachments: Array<{
    id: string;
    section: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  }>;
  vendorUsers: Array<{
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
  }>;
  reviewedBy: { name: string; email: string } | null;
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function RegistrationDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        <Skeleton className="h-9 w-36 rounded-lg" />

        {/* Header skeleton */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <Skeleton className="h-5 w-48 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function RegistrationData({ id }: { id: string }) {
  const [admin, result] = await Promise.all([
    getAdminFromSession(),
    adminSessionJson<RegistrationDetail>(
      `/registrations/${encodeURIComponent(id)}`
    ),
  ]);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load registration ({result.status}).
      </p>
    );
  }

  const r = result.data;
  const company = r.company ?? null;
  const tax = (company?.taxIdentifiers ?? {}) as Record<string, string>;
  const categories = (r.productCategories ?? [])
    .map((cid) => ENQUIRE_CATEGORIES.find((c) => c.id === cid)?.label ?? cid)
    .join(", ");

  const companyLegalName = str(company?.legalName);

  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        <BackButton label="Back to registrations" />

        {/* Premium Header Profile Section */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-6 relative z-10">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center border border-brand-blue/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <span className="text-3xl font-bold text-brand-blue tracking-wider">
                {getInitials(companyLegalName, r.email)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                {companyLegalName || "Unnamed Company"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <Mail className="w-4 h-4" />
                <span>{r.email}</span>
                {r.referenceNumber && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="font-mono text-xs bg-zinc-100 px-2 py-0.5 rounded-md">
                      {r.referenceNumber}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={r.status} />
                  {r.reviewedAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {r.status === "APPROVED" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Reviewed {formatDate(r.reviewedAt)}
                    </span>
                  )}
                </div>

                {r.status === "SUBMITTED" && (
                  <>
                    <div className="hidden sm:block w-px h-8 bg-zinc-200" />
                    <ReviewPanel registrationId={r.id} status={r.status} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Note */}
        {r.reviewedAt && r.reviewNote && (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4">
            <p className="text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase mb-2">
              Review Note
            </p>
            <p className="text-sm text-zinc-700 italic">"{r.reviewNote}"</p>
            {r.reviewedBy && (
              <p className="mt-2 text-xs text-zinc-500">
                by {r.reviewedBy.name || r.reviewedBy.email}
              </p>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Section */}
          <div className="lg:col-span-2">
            <Section title="Company Profile" icon={Building2}>
              <dl>
                <Row label="Legal name" value={str(company?.legalName)} />
                <Row label="Trading name" value={str(company?.dbaName)} />
                <Row label="Country" value={str(company?.country)} />
                <Row
                  label="Organization type"
                  value={str(company?.organizationType)}
                />
                <Row label="Supplier type" value={str(company?.supplierType)} />
                <Row
                  label="Year established"
                  value={str(company?.yearEstablished)}
                />
                <Row label="Website" value={str(company?.website)} />
                <Row label="VAT" value={tax.vat} />
                <Row label="CR" value={tax.cr} />
                <Row label="TIN" value={tax.tin} />
                <Row label="D-U-N-S" value={str(company?.dunsNumber)} />
                <Row label="Description" value={str(company?.description)} />
              </dl>
            </Section>
          </div>

          {/* Contacts */}
          <Section
            title={`Contacts (${r.contacts.length})`}
            icon={Users}
          >
            {r.contacts.length === 0 && (
              <p className="text-sm text-zinc-600">None provided.</p>
            )}
            <div className="space-y-4">
              {r.contacts.map((c) => (
                <dl
                  key={str(c.id)}
                  className="rounded-xl border border-zinc-100 p-4 bg-zinc-50/50"
                >
                  <Row
                    label="Name"
                    value={`${str(c.firstName)} ${str(c.lastName)}`.trim()}
                  />
                  <Row label="Email" value={str(c.email)} />
                  <Row label="Job title" value={str(c.jobTitle)} />
                  <Row label="Phone" value={str(c.phone) || str(c.mobile)} />
                  <Row
                    label="Administrative"
                    value={c.isAdministrative ? "Yes" : "No"}
                  />
                  <Row
                    label="Wants portal login"
                    value={c.requestUserAccount ? "Yes" : "No"}
                  />
                </dl>
              ))}
            </div>
          </Section>

          {/* Addresses */}
          <Section
            title={`Addresses (${r.addresses.length})`}
            icon={MapPin}
          >
            {r.addresses.length === 0 && (
              <p className="text-sm text-zinc-600">None provided.</p>
            )}
            <div className="space-y-4">
              {r.addresses.map((a) => (
                <dl
                  key={str(a.id)}
                  className="rounded-xl border border-zinc-100 p-4 bg-zinc-50/50"
                >
                  <Row label="Label" value={str(a.label)} />
                  <Row
                    label="Address"
                    value={[a.line1, a.line2, a.city, a.region, a.postalCode, a.country]
                      .map(str)
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Row
                    label="Purposes"
                    value={
                      Array.isArray(a.purposes)
                        ? (a.purposes as string[]).join(", ")
                        : ""
                    }
                  />
                  <Row
                    label="Contact"
                    value={[str(a.phone), str(a.email)]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </dl>
              ))}
            </div>
          </Section>

          {/* Classifications */}
          {r.classifications.length > 0 && (
            <Section
              title={`Classifications (${r.classifications.length})`}
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                {r.classifications.map((c) => (
                  <dl
                    key={str(c.id)}
                    className="rounded-xl border border-zinc-100 p-4 bg-zinc-50/50"
                  >
                    <Row label="Classification" value={str(c.classification)} />
                    <Row
                      label="Certificate no."
                      value={str(c.certificateNumber)}
                    />
                    <Row label="Agency" value={str(c.certifyingAgency)} />
                    <Row
                      label="Valid"
                      value={[str(c.effectiveDate), str(c.expirationDate)]
                        .filter(Boolean)
                        .join(" → ")}
                    />
                  </dl>
                ))}
              </div>
            </Section>
          )}

          {/* Bank Accounts */}
          {r.bankAccounts.length > 0 && (
            <Section
              title={`Bank Accounts (${r.bankAccounts.length})`}
              icon={CreditCard}
            >
              <p className="mb-4 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                ⚠️ Payment details — treat as confidential and verify through
                an independent channel before any transfer.
              </p>
              <div className="space-y-4">
                {r.bankAccounts.map((b) => (
                  <dl
                    key={str(b.id)}
                    className="rounded-xl border border-zinc-100 p-4 bg-zinc-50/50"
                  >
                    <Row
                      label="Bank"
                      value={[str(b.bankName), str(b.branchName)]
                        .filter(Boolean)
                        .join(" — ")}
                    />
                    <Row label="Account name" value={str(b.accountName)} />
                    <Row label="Account number" value={str(b.accountNumber)} />
                    <Row label="IBAN" value={str(b.iban)} />
                    <Row label="Routing" value={str(b.routingNumber)} />
                    <Row
                      label="Currency / country"
                      value={[str(b.currency), str(b.country)]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  </dl>
                ))}
              </div>
            </Section>
          )}

          {/* Products & Services */}
          <Section title="Products & Services" icon={Info}>
            <p className="text-sm font-medium text-zinc-950">
              {categories || "—"}
            </p>
          </Section>

          {/* Questionnaire */}
          <Section title="Questionnaire" icon={HelpCircle}>
            <dl>
              {ENQUIRE_QUESTIONNAIRE.map((q) => (
                <Row
                  key={q.key}
                  label={q.label}
                  value={
                    r.questionnaire.find((a) => a.questionKey === q.key)
                      ?.answer
                  }
                />
              ))}
            </dl>
          </Section>
        </div>

        {/* Attachments */}
        <Section
          title={`Attachments (${(r.attachments ?? []).length})`}
          icon={Paperclip}
        >
          {(r.attachments ?? []).length === 0 ? (
            <p className="text-sm text-zinc-600">None uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {(r.attachments ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-sm"
                >
                  <span className="text-zinc-600 font-medium">
                    {registrationAttachmentLabel(a.section)}
                  </span>
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {a.fileName}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Portal Accounts */}
        {r.vendorUsers.length > 0 && (
          <Section title="Portal Accounts" icon={KeyRound}>
            <ul className="space-y-2">
              {r.vendorUsers.map((v) => (
                <li
                  key={v.email}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-zinc-950 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    {v.email}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {v.isActive ? "active" : "disabled"}
                    {v.mustChangePassword ? " · must set new password" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function RegistrationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<RegistrationDetailSkeleton />}>
      <RegistrationData id={id} />
    </Suspense>
  );
}
