import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";

import { ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/lib/ui";

import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { registrationAttachmentLabel } from "@/data/registration-attachments";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { ReviewPanel } from "@/sections/ReviewPanel";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(140px,220px)_1fr] gap-3 border-b border-zinc-100 py-2 last:border-0">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm break-words text-zinc-950">{value?.trim() || "—"}</dd>
    </div>
  );
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

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, result] = await Promise.all([
    getAdminFromSession(),
    adminSessionJson<RegistrationDetail>(`/registrations/${encodeURIComponent(id)}`),
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

  return (
    <div className="space-y-6">
      <BackButton label="Back to registrations" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {str(company?.legalName) || "Unnamed company"}
            </h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {r.email}
            {r.referenceNumber ? ` · ${r.referenceNumber}` : ""}
          </p>
        </div>
      </div>

      {r.reviewedAt && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <span className="font-medium text-zinc-950">
            {r.status === "APPROVED" ? "Approved" : "Rejected"}
          </span>{" "}
          <span className="text-zinc-600">
            on{" "}
            {r.reviewedAt && !isNaN(new Date(r.reviewedAt).getTime())
              ? new Date(r.reviewedAt).toLocaleDateString("en-GB")
              : "—"}{" "}
            by {r.reviewedBy?.name || r.reviewedBy?.email || "a deleted account"}
          </span>
          {r.reviewNote && <p className="mt-1.5 text-zinc-700">“{r.reviewNote}”</p>}
        </div>
      )}

      {admin && hasRole(admin.role, "ADMIN") ? (
        <ReviewPanel registrationId={r.id} status={r.status} />
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          Your role is read-only. Approving or rejecting requires an Admin account.
        </p>
      )}

      <Section title="Company">
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

      <Section title={`Contacts (${r.contacts.length})`}>
        {r.contacts.length === 0 && <p className="text-sm text-zinc-600">None provided.</p>}
        <div className="space-y-4">
          {r.contacts.map((c) => (
            <dl key={str(c.id)} className="rounded-md border border-zinc-100 p-3">
              <Row label="Name" value={`${str(c.firstName)} ${str(c.lastName)}`.trim()} />
              <Row label="Email" value={str(c.email)} />
              <Row label="Job title" value={str(c.jobTitle)} />
              <Row label="Phone" value={str(c.phone) || str(c.mobile)} />
              <Row label="Administrative" value={c.isAdministrative ? "Yes" : "No"} />
              <Row label="Wants portal login" value={c.requestUserAccount ? "Yes" : "No"} />
            </dl>
          ))}
        </div>
      </Section>

      <Section title={`Addresses (${r.addresses.length})`}>
        {r.addresses.length === 0 && <p className="text-sm text-zinc-600">None provided.</p>}
        <div className="space-y-4">
          {r.addresses.map((a) => (
            <dl key={str(a.id)} className="rounded-md border border-zinc-100 p-3">
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

      {r.classifications.length > 0 && (
        <Section title={`Classifications (${r.classifications.length})`}>
          <div className="space-y-4">
            {r.classifications.map((c) => (
              <dl key={str(c.id)} className="rounded-md border border-zinc-100 p-3">
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
          <p className="mb-3 text-xs font-medium text-zinc-900">
            Payment details — treat as confidential and verify through an independent channel before
            any transfer.
          </p>
          <div className="space-y-4">
            {r.bankAccounts.map((b) => (
              <dl key={str(b.id)} className="rounded-md border border-zinc-100 p-3">
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

      <Section title="Products & services">
        <p className="text-sm text-zinc-950">{categories || "—"}</p>
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

      <Section title={`Attachments (${(r.attachments ?? []).length})`}>
        {(r.attachments ?? []).length === 0 ? (
          <p className="text-sm text-zinc-600">None uploaded.</p>
        ) : (
          <ul className="space-y-2">
            {(r.attachments ?? []).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-100 px-3 py-2 text-sm"
              >
                <span className="text-zinc-600">{registrationAttachmentLabel(a.section)}</span>
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue font-medium hover:underline"
                >
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {r.vendorUsers.length > 0 && (
        <Section title="Portal accounts">
          <ul className="space-y-1.5 text-sm">
            {r.vendorUsers.map((v) => (
              <li key={v.email} className="flex items-center gap-2 text-zinc-950">
                {v.email}
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
  );
}
