"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createPortal } from "react-dom";
import countries from "world-countries";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { COUNTRIES } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
} from "@/sections/enquire/EnquireField";
import { enquireActionLinkClass, enquireMutedClass } from "@/sections/enquire/enquire-typography";

type Row = {
  country: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  routingNumber: string;
  swift: string;
  currency: string;
};

const empty = (): Row => ({
  country: "Saudi Arabia",
  bankName: "",
  branchName: "",
  accountName: "",
  accountNumber: "",
  iban: "",
  routingNumber: "",
  swift: "",
  currency: "SAR",
});

const COUNTRY_OPTIONS = countries
  .map((c) => ({
    value: c.name.common,
    label: c.name.common,
    flag: `fi fi-${c.cca2.toLowerCase()}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function BankStep() {
  useRequireSession("bank");
  const router = useRouter();
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([empty()]);
  const [errors, setErrors] = useState<Record<string, boolean>[]>([]);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

  useEffect(() => {
    if (!registration?.bankAccounts?.length) return;
    setRows(
      registration.bankAccounts.map((b) => ({
        country: b.country || "Saudi Arabia",
        bankName: b.bankName,
        branchName: b.branchName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        iban: b.iban,
        routingNumber: b.routingNumber,
        swift: (b as any).swift || "",
        currency: b.currency || "SAR",
      }))
    );
  }, [registration]);

  const update = (i: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({
      step: "bank",
      bankAccounts: rows.filter((r) => r.bankName.trim() && r.accountName.trim()),
    });
    setPendingAction(null);
  };

  const goNext = () => {
    const newErrors = rows.map((r) => {
      const err: Record<string, boolean> = {};
      if (!r.country.trim()) err.country = true;
      if (!r.bankName.trim()) err.bankName = true;
      if (!r.accountName.trim()) err.accountName = true;
      return err;
    });

    if (newErrors.some((err) => Object.keys(err).length > 0)) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    advanceTo("products", {
      bankAccounts: rows.filter((r) => r.bankName.trim() && r.accountName.trim()),
    });
  };

  const actions = (
    <>
      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="h-10 px-6 min-w-[120px] text-xs sm:w-auto sm:text-xs"
        disabled={saving}
        pending={pendingAction === "save"}
        onClick={() => void saveLater()}
      >
        Draft
      </InteractiveHoverButton>
      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="h-10 px-6 min-w-[120px] text-xs sm:w-auto sm:text-xs"
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
          <div key={i} className="grid gap-4 border-b border-zinc-100 pb-8 md:grid-cols-2 md:gap-5 animate-fade-in">
            <div className="md:col-span-2 flex items-center justify-between pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
                Bank Account {String(i + 1).padStart(2, "0")}
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

            <EnquireField label="Country" required>
              <SearchableSelect
                options={COUNTRY_OPTIONS}
                value={r.country}
                onChange={(val) => {
                  update(i, "country", val);
                  if (err.country) {
                    setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, country: false } : e)));
                  }
                }}
                placeholder="Select a country..."
                className={err.country ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500" : ""}
              />
            </EnquireField>
            <EnquireField label="Currency">
              <input
                className={enquireInputClass}
                value={r.currency}
                onChange={(e) => update(i, "currency", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Bank name" required>
              <input
                className={enquireInputClass}
                value={r.bankName}
                onChange={(e) => {
                  update(i, "bankName", e.target.value);
                  if (err.bankName) {
                    setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, bankName: false } : e)));
                  }
                }}
                aria-invalid={err.bankName}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Branch">
              <input
                className={enquireInputClass}
                value={r.branchName}
                onChange={(e) => update(i, "branchName", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Account name" required>
              <input
                className={enquireInputClass}
                value={r.accountName}
                onChange={(e) => {
                  update(i, "accountName", e.target.value);
                  if (err.accountName) {
                    setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, accountName: false } : e)));
                  }
                }}
                aria-invalid={err.accountName}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Account number">
              <input
                className={enquireInputClass}
                value={r.accountNumber}
                onChange={(e) => update(i, "accountNumber", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="IBAN">
              <input
                className={enquireInputClass}
                value={r.iban}
                onChange={(e) => update(i, "iban", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
            <EnquireField label="Routing / sort code">
              <input
                className={enquireInputClass}
                value={r.routingNumber}
                onChange={(e) => update(i, "routingNumber", e.target.value)}
                placeholder=" "
              />
            </EnquireField>
          </div>
        );
      })}

      <div className="flex justify-center pb-8 pt-4">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, empty()])}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold tracking-wide text-zinc-700 transition-all hover:bg-zinc-50 hover:text-brand-blue hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          ADD BANK ACCOUNT
        </button>
      </div>
    </div>
  );
}
