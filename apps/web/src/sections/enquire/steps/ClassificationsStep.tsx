"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { CLASSIFICATION_OPTIONS } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
} from "@/sections/enquire/EnquireField";

type Row = {
  classification: string;
  certificateNumber: string;
  certifyingAgency: string;
  effectiveDate: string;
  expirationDate: string;
};

const empty = (): Row => ({
  classification: "",
  certificateNumber: "",
  certifyingAgency: "",
  effectiveDate: "",
  expirationDate: "",
});

export function ClassificationsStep() {
  useRequireSession("classifications");
  const router = useRouter();
  const { registration, saveDraft, loading } = useEnquire();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!registration) return;
    if (registration.classifications?.length) {
      setRows(
        registration.classifications.map((c) => ({
          classification: c.classification,
          certificateNumber: c.certificateNumber,
          certifyingAgency: c.certifyingAgency,
          effectiveDate: c.effectiveDate,
          expirationDate: c.expirationDate,
        }))
      );
    }
  }, [registration]);

  const update = (i: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({
      step: next,
      classifications: rows.filter((r) => r.classification.trim()),
    });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
        Optional. Add any diversity, SME, or certification classifications that apply to your
        business.
      </p>

      {rows.map((r, i) => (
        <div key={i} className="grid gap-6 border-b border-zinc-100 pb-8 md:grid-cols-2">
          <EnquireField label="Classification" required className="md:col-span-2">
            <select
              className={enquireSelectClass}
              value={r.classification}
              onChange={(e) => update(i, "classification", e.target.value)}
            >
              <option value="">Select…</option>
              {CLASSIFICATION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </EnquireField>
          <EnquireField label="Certificate number">
            <input
              className={enquireInputClass}
              value={r.certificateNumber}
              onChange={(e) => update(i, "certificateNumber", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Certifying agency">
            <input
              className={enquireInputClass}
              value={r.certifyingAgency}
              onChange={(e) => update(i, "certifyingAgency", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Effective date">
            <input
              type="date"
              className={enquireInputClass}
              value={r.effectiveDate}
              onChange={(e) => update(i, "effectiveDate", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Expiration date">
            <input
              type="date"
              className={enquireInputClass}
              value={r.expirationDate}
              onChange={(e) => update(i, "expirationDate", e.target.value)}
            />
          </EnquireField>
          <button
            type="button"
            className="text-left text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-red-500 md:col-span-2"
            onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="brand-outline"
        className="h-12 rounded-none"
        onClick={() => setRows((prev) => [...prev, empty()])}
      >
        Add Classification
      </Button>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => router.push("/enquire/addresses")}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => void persist("classifications")}
        >
          Save for Later
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void persist("bank")}
        >
          Next: Bank Accounts
        </Button>
      </div>
    </div>
  );
}
