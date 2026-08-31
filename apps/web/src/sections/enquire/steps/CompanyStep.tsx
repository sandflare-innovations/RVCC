"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import countries from "world-countries";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ORG_TYPES, SUPPLIER_TYPES } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireTextareaClass,
} from "@/sections/enquire/EnquireField";

const COUNTRY_OPTIONS = countries
  .map((c) => ({
    value: c.name.common,
    label: c.name.common,
    flag: `fi fi-${c.cca2.toLowerCase()}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const ORG_OPTIONS = ORG_TYPES.map((t) => ({ value: t, label: t }));
const SUPPLIER_OPTIONS = SUPPLIER_TYPES.map((t) => ({ value: t, label: t }));

export function CompanyStep() {
  useRequireSession("company");
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
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

  const companyPayload = () => ({
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

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "company", ...companyPayload() });
    setPendingAction(null);
  };

  const goNext = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.legalName.trim()) newErrors.legalName = true;
    if (!form.dbaName.trim()) newErrors.dbaName = true;
    if (!form.country.trim()) newErrors.country = true;
    if (!form.organizationType.trim()) newErrors.organizationType = true;
    if (!form.supplierType.trim()) newErrors.supplierType = true;
    if (!form.yearEstablished.trim()) newErrors.yearEstablished = true;
    if (!form.vat.trim()) newErrors.vat = true;
    if (!form.cr.trim()) newErrors.cr = true;
    if (!form.tin.trim()) newErrors.tin = true;
    if (!form.dunsNumber.trim()) newErrors.dunsNumber = true;
    if (!form.website.trim()) newErrors.website = true;
    if (!form.description.trim()) newErrors.description = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    advanceTo("contacts", companyPayload());
  };

  if (loading && !registration) return null;

  const actions = (
    <>
      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="h-10 min-w-[120px] px-6 text-xs sm:w-auto sm:text-xs"
        disabled={saving}
        pending={pendingAction === "save"}
        onClick={() => void saveLater()}
      >
        Draft
      </InteractiveHoverButton>
      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="h-10 min-w-[120px] px-6 text-xs sm:w-auto sm:text-xs"
        onClick={goNext}
      >
        Next
      </InteractiveHoverButton>
    </>
  );

  return (
    <div className="space-y-8">
      {headerNode && createPortal(actions, headerNode)}
      <div className="grid gap-4 md:grid-cols-2">
        <EnquireField label="Legal company name" required>
          <input
            className={enquireInputClass}
            value={form.legalName}
            onChange={(e) => {
              set("legalName", e.target.value);
              if (errors.legalName) setErrors((p) => ({ ...p, legalName: false }));
            }}
            placeholder=" "
            aria-invalid={errors.legalName}
          />
        </EnquireField>
        <EnquireField label="Doing business as (DBA)" required>
          <input
            className={enquireInputClass}
            value={form.dbaName}
            onChange={(e) => {
              set("dbaName", e.target.value);
              if (errors.dbaName) setErrors((p) => ({ ...p, dbaName: false }));
            }}
            placeholder=" "
            aria-invalid={errors.dbaName}
          />
        </EnquireField>
        <EnquireField label="Country" required>
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={form.country}
            onChange={(val) => {
              set("country", val);
              if (errors.country) setErrors((p) => ({ ...p, country: false }));
            }}
            placeholder="Search country..."
            className={
              errors.country
                ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500"
                : ""
            }
          />
        </EnquireField>
        <EnquireField label="Organization type" required>
          <SearchableSelect
            options={ORG_OPTIONS}
            value={form.organizationType}
            onChange={(val) => {
              set("organizationType", val);
              if (errors.organizationType) setErrors((p) => ({ ...p, organizationType: false }));
            }}
            placeholder="Select organization type..."
            className={
              errors.organizationType
                ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500"
                : ""
            }
          />
        </EnquireField>
        <EnquireField label="Supplier type" required>
          <SearchableSelect
            options={SUPPLIER_OPTIONS}
            value={form.supplierType}
            onChange={(val) => {
              set("supplierType", val);
              if (errors.supplierType) setErrors((p) => ({ ...p, supplierType: false }));
            }}
            placeholder="Select supplier type..."
            className={
              errors.supplierType
                ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500"
                : ""
            }
          />
        </EnquireField>
        <EnquireField label="Year established" required>
          <input
            className={enquireInputClass}
            value={form.yearEstablished}
            onChange={(e) => {
              set("yearEstablished", e.target.value);
              if (errors.yearEstablished) setErrors((p) => ({ ...p, yearEstablished: false }));
            }}
            placeholder=" "
            aria-invalid={errors.yearEstablished}
          />
        </EnquireField>
        <EnquireField label="VAT / Tax ID" required>
          <input
            className={enquireInputClass}
            value={form.vat}
            onChange={(e) => {
              set("vat", e.target.value);
              if (errors.vat) setErrors((p) => ({ ...p, vat: false }));
            }}
            placeholder=" "
            aria-invalid={errors.vat}
          />
        </EnquireField>
        <EnquireField label="Commercial registration (CR)" required>
          <input
            className={enquireInputClass}
            value={form.cr}
            onChange={(e) => {
              set("cr", e.target.value);
              if (errors.cr) setErrors((p) => ({ ...p, cr: false }));
            }}
            placeholder=" "
            aria-invalid={errors.cr}
          />
        </EnquireField>
        <EnquireField label="TIN" required>
          <input
            className={enquireInputClass}
            value={form.tin}
            onChange={(e) => {
              set("tin", e.target.value);
              if (errors.tin) setErrors((p) => ({ ...p, tin: false }));
            }}
            placeholder=" "
            aria-invalid={errors.tin}
          />
        </EnquireField>
        <EnquireField label="D-U-N-S number" required>
          <input
            className={enquireInputClass}
            value={form.dunsNumber}
            onChange={(e) => {
              set("dunsNumber", e.target.value);
              if (errors.dunsNumber) setErrors((p) => ({ ...p, dunsNumber: false }));
            }}
            placeholder=" "
            aria-invalid={errors.dunsNumber}
          />
        </EnquireField>
        <EnquireField label="Website" className="md:col-span-2" required>
          <input
            className={enquireInputClass}
            value={form.website}
            onChange={(e) => {
              set("website", e.target.value);
              if (errors.website) setErrors((p) => ({ ...p, website: false }));
            }}
            placeholder="https://"
            aria-invalid={errors.website}
          />
        </EnquireField>
        <EnquireField label="Company description" className="md:col-span-2" required>
          <textarea
            className={enquireTextareaClass}
            value={form.description}
            onChange={(e) => {
              set("description", e.target.value);
              if (errors.description) setErrors((p) => ({ ...p, description: false }));
            }}
            placeholder=" "
            aria-invalid={errors.description}
          />
        </EnquireField>
      </div>
    </div>
  );
}
