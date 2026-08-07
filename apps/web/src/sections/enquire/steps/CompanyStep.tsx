"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { COUNTRIES, ORG_TYPES, SUPPLIER_TYPES } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
  enquireTextareaClass,
} from "@/sections/enquire/EnquireField";

export function CompanyStep() {
  useRequireSession("company");
  const router = useRouter();
  const { registration, saveDraft, loading } = useEnquire();
  const [form, setForm] = useState({
    legalName: "",
    dbaName: "",
    country: "Saudi Arabia",
    vat: "",
    cr: "",
    tin: "",
    organizationType: "",
    supplierType: "",
    website: "",
    yearEstablished: "",
    dunsNumber: "",
    description: "",
  });

  useEffect(() => {
    if (!registration?.company) return;
    const tax = (registration.company.taxIdentifiers || {}) as Record<string, string>;
    setForm({
      legalName: registration.company.legalName || "",
      dbaName: registration.company.dbaName || "",
      country: registration.company.country || "Saudi Arabia",
      vat: tax.vat || "",
      cr: tax.cr || "",
      tin: tax.tin || "",
      organizationType: registration.company.organizationType || "",
      supplierType: registration.company.supplierType || "",
      website: registration.company.website || "",
      yearEstablished: registration.company.yearEstablished || "",
      dunsNumber: registration.company.dunsNumber || "",
      description: registration.company.description || "",
    });
  }, [registration]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const persist = async (nextStep: string) => {
    const ok = await saveDraft({
      step: nextStep,
      company: {
        legalName: form.legalName,
        dbaName: form.dbaName,
        country: form.country,
        taxIdentifiers: { vat: form.vat, cr: form.cr, tin: form.tin },
        organizationType: form.organizationType,
        supplierType: form.supplierType,
        website: form.website,
        yearEstablished: form.yearEstablished,
        dunsNumber: form.dunsNumber,
        description: form.description,
      },
    });
    if (ok) router.push(`/enquire/${nextStep}`);
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <EnquireField label="Legal company name" required>
          <input
            className={enquireInputClass}
            value={form.legalName}
            onChange={(e) => set("legalName", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="Doing business as (DBA)">
          <input
            className={enquireInputClass}
            value={form.dbaName}
            onChange={(e) => set("dbaName", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="Country" required>
          <select
            className={enquireSelectClass}
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </EnquireField>
        <EnquireField label="Organization type">
          <select
            className={enquireSelectClass}
            value={form.organizationType}
            onChange={(e) => set("organizationType", e.target.value)}
          >
            <option value="">Select…</option>
            {ORG_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </EnquireField>
        <EnquireField label="Supplier type">
          <select
            className={enquireSelectClass}
            value={form.supplierType}
            onChange={(e) => set("supplierType", e.target.value)}
          >
            <option value="">Select…</option>
            {SUPPLIER_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </EnquireField>
        <EnquireField label="Year established">
          <input
            className={enquireInputClass}
            value={form.yearEstablished}
            onChange={(e) => set("yearEstablished", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="VAT / Tax ID">
          <input
            className={enquireInputClass}
            value={form.vat}
            onChange={(e) => set("vat", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="Commercial registration (CR)">
          <input
            className={enquireInputClass}
            value={form.cr}
            onChange={(e) => set("cr", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="TIN">
          <input
            className={enquireInputClass}
            value={form.tin}
            onChange={(e) => set("tin", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="D-U-N-S number">
          <input
            className={enquireInputClass}
            value={form.dunsNumber}
            onChange={(e) => set("dunsNumber", e.target.value)}
          />
        </EnquireField>
        <EnquireField label="Website" className="md:col-span-2">
          <input
            className={enquireInputClass}
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
          />
        </EnquireField>
        <EnquireField label="Company description" className="md:col-span-2">
          <textarea
            className={enquireTextareaClass}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </EnquireField>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => void persist("company")}
        >
          Save for Later
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void persist("contacts")}
        >
          Next: Contacts
        </Button>
      </div>
    </div>
  );
}
