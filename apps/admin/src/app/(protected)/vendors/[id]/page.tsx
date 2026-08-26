import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Mail, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  FileText,
  CalendarDays,
  User,
  KeyRound,
  History,
  Info
} from "lucide-react";

import { adminSessionJson } from "@/lib/admin-data";
import { BackButton } from "@/components/ui/back-button";
import { StatusBadge } from "@/lib/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { VendorProfileActions } from "./VendorProfileActions";
import { RegistrationDetailsToggle } from "./RegistrationDetailsToggle";

export const dynamic = "force-dynamic";

function formatDateTime(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
};

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xs font-bold tracking-[0.12em] text-brand-blue uppercase flex items-center gap-2">
        <Info className="w-4 h-4" />
        {title}
      </h2>
      {children}
    </section>
  );
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

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-3 last:border-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm break-words text-zinc-950 font-medium">{value?.trim() || "—"}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Payload = {
  vendor: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    portalAccess: "RELEASED" | "HELD";
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    lockedUntil: string | null;
    activeSessions: number;
    registrationId: string | null;
    companyName: string | null;
    referenceNumber: string | null;
    registrationStatus: string | null;
    registrationComplete: boolean;
    registration: {
      id: string;
      referenceNumber: string | null;
      status: string;
      company: { legalName: string } | null;
    } | null;
  };
  quotes: Array<{
    id: string;
    newPrice: string | number | null;
    status: string;
    submittedAt: string | null;
    requirementProject: string;
    requirementRef: string | null;
    requirementId: string;
  }>;
  invites: Array<{
    id: string;
    emailStatus: string;
    emailedAt: string | null;
    requirementProject: string;
    requirementRef: string | null;
    requirementId: string;
  }>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function VendorDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        <Skeleton className="h-9 w-32 rounded-lg" />
        
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lists skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
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

async function VendorData({ id }: { id: string }) {
  const result = await adminSessionJson<Payload>(`/vendors/${encodeURIComponent(id)}`);
  
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load vendor profile ({result.status}).
      </p>
    );
  }

  const { vendor, quotes, invites } = result.data;
  const isLocked = !!vendor.lockedUntil;

  let registrationDetail = null;
  if (vendor.registrationId) {
    const regRes = await adminSessionJson<RegistrationDetail>(`/registrations/${vendor.registrationId}`);
    if (regRes.ok) registrationDetail = regRes.data;
  }

  const r = registrationDetail;
  const company = r?.company ?? null;
  const tax = (company?.taxIdentifiers ?? {}) as Record<string, string>;
  const categories = (r?.productCategories ?? [])
    .map((cid) => ENQUIRE_CATEGORIES.find((c) => c.id === cid)?.label ?? cid)
    .join(", ");

  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full px-8 py-8 space-y-8 pb-24">
        <BackButton label="Back to vendors" />
        
        {/* Premium Header Profile Section */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center border border-brand-blue/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <span className="text-3xl font-bold text-brand-blue tracking-wider">
                {getInitials(vendor.name, vendor.email)}
              </span>
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                {vendor.name || "Unnamed Vendor"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <Mail className="w-4 h-4" />
                <span>{vendor.email}</span>
              </div>
              
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={vendor.isActive ? "ACTIVE" : "DISABLED"} />
                  <StatusBadge status={vendor.portalAccess === "RELEASED" ? "RELEASED" : "HELD"} />
                  {vendor.mustChangePassword && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      <KeyRound className="w-3.5 h-3.5" />
                      Password reset required
                    </span>
                  )}
                </div>
                
                <div className="hidden sm:block w-px h-8 bg-zinc-200"></div>
                
                <VendorProfileActions 
                  vendor={{
                    id: vendor.id,
                    email: vendor.email,
                    portalAccess: vendor.portalAccess as "HELD" | "RELEASED"
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

      {/* Grid Layout for Metrics & Registration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Registration Card */}
        <div className={`col-span-1 ${vendor.registration ? 'lg:col-span-2' : ''} bg-white rounded-2xl border border-zinc-200 overflow-hidden`}>
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-500" />
              Company Registration
            </h3>
            {vendor.registration && (
              <StatusBadge status={vendor.registrationStatus || "DRAFT"} />
            )}
          </div>
          <div className="p-6">
            {vendor.registration ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Company Legal Name</p>
                    <p className="text-sm text-zinc-950 font-medium">
                      {vendor.companyName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Registration Ref #</p>
                    <p className="text-sm font-mono text-zinc-700">
                      {vendor.referenceNumber || "Draft"}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                    {vendor.registrationComplete ? (
                      <><CheckCircle className="w-4 h-4 text-emerald-500" /> Application submitted</>
                    ) : (
                      <><Clock className="w-4 h-4 text-amber-500" /> Application incomplete</>
                    )}
                  </span>
                  
                  <Link 
                    href={`/registrations/${vendor.registrationId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:ring-offset-1"
                  >
                    View Application
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-950">No Registration Linked</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    This account was likely created manually and is not linked to a supplier registration application.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Card */}
        <div className="col-span-1 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
            <h3 className="font-semibold text-zinc-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-zinc-500" />
              Security & Access
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Account Created
              </p>
              <p className="text-sm text-zinc-950">{formatDateOnly(vendor.createdAt)}</p>
            </div>
            
            <div className="pt-3 border-t border-zinc-100">
              <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Last Sign In
              </p>
              <p className="text-sm text-zinc-950">{formatDateTime(vendor.lastLoginAt)}</p>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">Active Sessions</p>
              <p className="text-sm font-semibold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded-md">
                {vendor.activeSessions}
              </p>
            </div>

            {isLocked && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-sm text-red-900">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <p>
                  Account is temporarily locked due to failed login attempts until {formatDateTime(vendor.lockedUntil)}.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lists Layout (Quotes & Invites) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quotes Section */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Quotes ({quotes.length})
            </h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
            {quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-500 text-sm p-6">
                No quotes submitted yet.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {quotes.map((quote) => (
                  <li key={quote.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link 
                          href={`/requirements/${quote.requirementId}`}
                          className="text-sm font-medium text-brand-blue hover:underline"
                        >
                          {quote.requirementProject}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">
                          {quote.requirementRef || "Draft Ref"}
                        </p>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>Submitted: {formatDateOnly(quote.submittedAt)}</span>
                      {quote.newPrice && (
                        <span className="font-medium text-zinc-950 tabular-nums">
                          {String(quote.newPrice)} SAR
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Invites Section */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-950 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              Requirement Invites ({invites.length})
            </h3>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
            {invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-500 text-sm p-6">
                No invites sent yet.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {invites.map((invite) => (
                  <li key={invite.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link 
                          href={`/requirements/${invite.requirementId}`}
                          className="text-sm font-medium text-zinc-900 hover:text-brand-blue transition-colors"
                        >
                          {invite.requirementProject}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">
                          {invite.requirementRef || "Draft Ref"}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        invite.emailStatus === 'SENT' ? 'bg-green-50 text-green-700' :
                        invite.emailStatus === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {invite.emailStatus}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Emailed: {formatDateOnly(invite.emailedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Full Registration Profile Information */}
      {r && (
        <RegistrationDetailsToggle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Section title="Company Profile">
                <dl>
                  <Row label="Legal name" value={str(company?.legalName)} />
                  <Row label="Trading name" value={str(company?.dbaName)} />
                  <Row label="Country" value={str(company?.country)} />
                  <Row label="Organization type" value={str(company?.organizationType)} />
                  <Row label="Supplier type" value={str(company?.supplierType)} />
                  <Row label="Year established" value={str(company?.yearEstablished)} />
                  <Row label="Website" value={str(company?.website)} />
                  <Row label="VAT" value={tax.vat} />
                  <Row label="CR" value={tax.cr} />
                  <Row label="TIN" value={tax.tin} />
                  <Row label="D-U-N-S" value={str(company?.dunsNumber)} />
                  <Row label="Description" value={str(company?.description)} />
                </dl>
              </Section>

              {r.classifications.length > 0 && (
                <Section title={`Classifications (${r.classifications.length})`}>
                  <div className="space-y-4">
                    {r.classifications.map((c) => (
                      <dl key={str(c.id)} className="rounded-lg border border-zinc-100 p-4 bg-zinc-50/50">
                        <Row label="Classification" value={str(c.classification)} />
                        <Row label="Certificate no." value={str(c.certificateNumber)} />
                        <Row label="Agency" value={str(c.certifyingAgency)} />
                        <Row
                          label="Valid"
                          value={[str(c.effectiveDate), str(c.expirationDate)].filter(Boolean).join(" → ")}
                        />
                      </dl>
                    ))}
                  </div>
                </Section>
              )}

              {r.bankAccounts.length > 0 && (
                <Section title={`Bank accounts (${r.bankAccounts.length})`}>
                  <div className="space-y-4">
                    {r.bankAccounts.map((b) => (
                      <dl key={str(b.id)} className="rounded-lg border border-zinc-100 p-4 bg-zinc-50/50">
                        <Row
                          label="Bank"
                          value={[str(b.bankName), str(b.branchName)].filter(Boolean).join(" — ")}
                        />
                        <Row label="Account name" value={str(b.accountName)} />
                        <Row label="Account number" value={str(b.accountNumber)} />
                        <Row label="IBAN" value={str(b.iban)} />
                        <Row label="Routing" value={str(b.routingNumber)} />
                        <Row
                          label="Currency / country"
                          value={[str(b.currency), str(b.country)].filter(Boolean).join(" · ")}
                        />
                      </dl>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="space-y-6">
              <Section title={`Contacts (${r.contacts.length})`}>
                {r.contacts.length === 0 && <p className="text-sm text-zinc-600">None provided.</p>}
                <div className="space-y-4">
                  {r.contacts.map((c) => (
                    <dl key={str(c.id)} className="rounded-lg border border-zinc-100 p-4 bg-zinc-50/50">
                      <Row label="Name" value={`${str(c.firstName)} ${str(c.lastName)}`.trim()} />
                      <Row label="Email" value={str(c.email)} />
                      <Row label="Job title" value={str(c.jobTitle)} />
                      <Row label="Phone" value={str(c.phone) || str(c.mobile)} />
                      <Row label="Administrative" value={c.isAdministrative ? "Yes" : "No"} />
                    </dl>
                  ))}
                </div>
              </Section>

              <Section title={`Addresses (${r.addresses.length})`}>
                {r.addresses.length === 0 && <p className="text-sm text-zinc-600">None provided.</p>}
                <div className="space-y-4">
                  {r.addresses.map((a) => (
                    <dl key={str(a.id)} className="rounded-lg border border-zinc-100 p-4 bg-zinc-50/50">
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
                        value={Array.isArray(a.purposes) ? (a.purposes as string[]).join(", ") : ""}
                      />
                      <Row
                        label="Contact"
                        value={[str(a.phone), str(a.email)].filter(Boolean).join(" · ")}
                      />
                    </dl>
                  ))}
                </div>
              </Section>

              <Section title="Products & services">
                <p className="text-sm font-medium text-zinc-950 px-2 py-1">{categories || "—"}</p>
              </Section>

              <Section title="Questionnaire">
                <dl>
                  {ENQUIRE_QUESTIONNAIRE.map((q) => (
                    <Row
                      key={q.key}
                      label={q.label}
                      value={r.questionnaire.find((a) => a.questionKey === q.key)?.answer}
                    />
                  ))}
                </dl>
              </Section>
            </div>
          </div>
        </RegistrationDetailsToggle>
      )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<VendorDetailSkeleton />}>
      <VendorData id={id} />
    </Suspense>
  );
}
