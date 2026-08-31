"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuPlus as Plus } from "react-icons/lu";

import { DatePicker } from "@/components/ui/date-picker";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CLASSIFICATION_OPTIONS } from "@/data/enquire-questionnaire";
import { enquireActionLinkClass } from "@/sections/enquire/enquire-typography";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
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

const CLASSIFICATION_OPTIONS_LIST = CLASSIFICATION_OPTIONS.map((c) => ({
  value: c,
  label: c,
}));

export function ClassificationsStep() {
  useRequireSession("classifications");
  const router = useRouter();
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([empty()]);
  const [errors, setErrors] = useState<Record<string, boolean>[]>([]);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

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

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({
      step: "classifications",
      classifications: rows.filter((r) => r.classification.trim()),
    });
    setPendingAction(null);
  };

  const goNext = () => {
    const newErrors = rows.map((r) => {
      const err: Record<string, boolean> = {};
      if (!r.classification.trim()) err.classification = true;
      return err;
    });

    if (newErrors.some((err) => Object.keys(err).length > 0)) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    advanceTo("bank", {
      classifications: rows.filter((r) => r.classification.trim()),
    });
  };

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

  if (loading && !registration) return null;

  return (
    <div className="space-y-8">
      {headerNode && createPortal(actions, headerNode)}

      {rows.map((r, i) => {
        const err = errors[i] || {};
        return (
          <div
            key={i}
            className="animate-fade-in grid gap-4 border-b border-zinc-100 pb-8 md:grid-cols-2 md:gap-5"
          >
            <div className="flex items-center justify-between pb-2 md:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-zinc-900 uppercase">
                Classification {String(i + 1).padStart(2, "0")}
              </h3>
              {rows.length > 1 && (
                <button
                  type="button"
                  className={enquireActionLinkClass}
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              )}
            </div>

            <EnquireField label="Classification" required className="md:col-span-2">
              <SearchableSelect
                options={CLASSIFICATION_OPTIONS_LIST}
                value={r.classification}
                onChange={(val) => {
                  update(i, "classification", val);
                  if (err.classification) {
                    setErrors((prev) =>
                      prev.map((e, idx) => (idx === i ? { ...e, classification: false } : e))
                    );
                  }
                }}
                placeholder="Select classification..."
                className={
                  err.classification
                    ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500"
                    : ""
                }
              />
            </EnquireField>

            <EnquireField label="Certificate number">
              <input
                className={enquireInputClass}
                value={r.certificateNumber}
                onChange={(e) => update(i, "certificateNumber", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Certifying agency">
              <input
                className={enquireInputClass}
                value={r.certifyingAgency}
                onChange={(e) => update(i, "certifyingAgency", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Effective date">
              <DatePicker
                value={r.effectiveDate}
                onChange={(val) => update(i, "effectiveDate", val)}
              />
            </EnquireField>
            <EnquireField label="Expiration date">
              <DatePicker
                value={r.expirationDate}
                onChange={(val) => update(i, "expirationDate", val)}
              />
            </EnquireField>
          </div>
        );
      })}

      <div className="flex justify-center pt-4 pb-8">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, empty()])}
          disabled={saving}
          className="hover:text-brand-blue hover:border-brand-blue focus:ring-brand-blue inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold tracking-wide text-zinc-700 transition-all hover:bg-zinc-50 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          ADD CLASSIFICATION
        </button>
      </div>
    </div>
  );
}
