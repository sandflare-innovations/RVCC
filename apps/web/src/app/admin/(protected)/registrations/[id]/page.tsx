import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { getAdminFromSession, hasRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ReviewPanel } from "@/sections/admin/ReviewPanel";
import { StatusBadge } from "@/sections/admin/StatusBadge";

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

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminFromSession();

  const r = await prisma.supplierRegistration.findUnique({
    where: { id },
    include: {
      company: true,
      contacts: { orderBy: { sortOrder: "asc" } },
      addresses: { orderBy: { sortOrder: "asc" } },
      classifications: { orderBy: { sortOrder: "asc" } },
      bankAccounts: { orderBy: { sortOrder: "asc" } },
      questionnaire: true,
      attachments: true,
      reviewedBy: { select: { name: true, email: true } },
      vendorUsers: { select: { email: true, isActive: true, mustChangePassword: true } },
    },
  });

  if (!r) notFound();

  const tax = (r.company?.taxIdentifiers ?? {}) as Record<string, string>;
  const categories = r.productCategories
    .map((cid) => ENQUIRE_CATEGORIES.find((c) => c.id === cid)?.label ?? cid)
    .join(", ");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/registrations"
        className="hover:text-brand-blue inline-flex items-center gap-1.5 text-sm text-zinc-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to registrations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {r.company?.legalName || "Unnamed company"}
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
            on {r.reviewedAt.toLocaleDateString("en-GB")} by{" "}
            {r.reviewedBy?.name || r.reviewedBy?.email || "a deleted account"}
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
          <Row label="Legal name" value={r.company?.legalName} />
          <Row label="Trading name" value={r.company?.dbaName} />
          <Row label="Country" value={r.company?.country} />
          <Row label="Organization type" value={r.company?.organizationType} />
          <Row label="Supplier type" value={r.company?.supplierType} />
          <Row label="Year established" value={r.company?.yearEstablished} />
          <Row label="Website" value={r.company?.website} />
          <Row label="VAT" value={tax.vat} />
          <Row label="CR" value={tax.cr} />
          <Row label="TIN" value={tax.tin} />
          <Row label="D-U-N-S" value={r.company?.dunsNumber} />
          <Row label="Description" value={r.company?.description} />
        </dl>
      </Section>

      <Section title={`Contacts (${r.contacts.length})`}>
        {r.contacts.length === 0 && <p className="text-sm text-zinc-600">None provided.</p>}
        <div className="space-y-4">
          {r.contacts.map((c) => (
            <dl key={c.id} className="rounded-md border border-zinc-100 p-3">
              <Row label="Name" value={`${c.firstName} ${c.lastName}`} />
              <Row label="Email" value={c.email} />
              <Row label="Job title" value={c.jobTitle} />
              <Row label="Phone" value={c.phone || c.mobile} />
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
            <dl key={a.id} className="rounded-md border border-zinc-100 p-3">
              <Row label="Label" value={a.label} />
              <Row
                label="Address"
                value={[a.line1, a.line2, a.city, a.region, a.postalCode, a.country]
                  .filter(Boolean)
                  .join(", ")}
              />
              <Row label="Purposes" value={a.purposes.join(", ")} />
              <Row label="Contact" value={[a.phone, a.email].filter(Boolean).join(" · ")} />
            </dl>
          ))}
        </div>
      </Section>

      {r.classifications.length > 0 && (
        <Section title={`Classifications (${r.classifications.length})`}>
          <div className="space-y-4">
            {r.classifications.map((c) => (
              <dl key={c.id} className="rounded-md border border-zinc-100 p-3">
                <Row label="Classification" value={c.classification} />
                <Row label="Certificate no." value={c.certificateNumber} />
                <Row label="Agency" value={c.certifyingAgency} />
                <Row
                  label="Valid"
                  value={[c.effectiveDate, c.expirationDate].filter(Boolean).join(" → ")}
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
              <dl key={b.id} className="rounded-md border border-zinc-100 p-3">
                <Row label="Bank" value={[b.bankName, b.branchName].filter(Boolean).join(" — ")} />
                <Row label="Account name" value={b.accountName} />
                <Row label="Account number" value={b.accountNumber} />
                <Row label="IBAN" value={b.iban} />
                <Row label="Routing" value={b.routingNumber} />
                <Row
                  label="Currency / country"
                  value={[b.currency, b.country].filter(Boolean).join(" · ")}
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
