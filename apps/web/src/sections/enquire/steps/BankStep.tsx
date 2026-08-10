"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { COUNTRIES } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
} from "@/sections/enquire/EnquireField";

type Row = {
  country: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  routingNumber: string;
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
  currency: "SAR",
});

export function BankStep() {
  useRequireSession("bank");
  const router = useRouter();
  const { registration, saveDraft, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

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
        currency: b.currency || "SAR",
      }))
    );
  }, [registration]);

  const update = (i: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({
      step: next,
      bankAccounts: rows.filter((r) => r.bankName.trim() && r.accountName.trim()),
    });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-base text-zinc-600">Loading…</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
        Optional for prospective registration. Provide bank details if you are ready for
        spend-authorized review later.
      </p>

      {rows.map((r, i) => (
        <div key={i} className="grid gap-6 border-b border-zinc-100 pb-8 md:grid-cols-2">
          <EnquireField label="Country" required>
            <select
              className={enquireSelectClass}
              value={r.country}
              onChange={(e) => update(i, "country", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </EnquireField>
          <EnquireField label="Currency">
            <input
              className={enquireInputClass}
              value={r.currency}
              onChange={(e) => update(i, "currency", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Bank name" required>
            <input
              className={enquireInputClass}
              value={r.bankName}
              onChange={(e) => update(i, "bankName", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Branch">
            <input
              className={enquireInputClass}
              value={r.branchName}
              onChange={(e) => update(i, "branchName", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Account name" required>
            <input
              className={enquireInputClass}
              value={r.accountName}
              onChange={(e) => update(i, "accountName", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Account number">
            <input
              className={enquireInputClass}
              value={r.accountNumber}
              onChange={(e) => update(i, "accountNumber", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="IBAN">
            <input
              className={enquireInputClass}
              value={r.iban}
              onChange={(e) => update(i, "iban", e.target.value)}
            />
          </EnquireField>
          <EnquireField label="Routing / sort code">
            <input
              className={enquireInputClass}
              value={r.routingNumber}
              onChange={(e) => update(i, "routingNumber", e.target.value)}
            />
          </EnquireField>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center text-left text-xs font-bold tracking-wider text-zinc-600 uppercase transition-colors hover:text-red-600 md:col-span-2"
            onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}

      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="sm:w-auto"
        fullWidth
        disabled={saving}
        onClick={() => setRows((prev) => [...prev, empty()])}
      >
        Add Bank Account
      </InteractiveHoverButton>

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          onClick={() => router.push("/enquire/classifications")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={saving && pendingAction === "bank"}
          onClick={() => {
            setPendingAction("bank");
            void persist("bank");
          }}
        >
          Save for Later
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={saving && pendingAction === "products"}
          onClick={() => {
            setPendingAction("products");
            void persist("products");
          }}
        >
          Next: Products & Services
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
