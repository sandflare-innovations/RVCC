"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-zinc-100 pb-8">
      <h3 className="text-brand-blue text-[10px] font-black tracking-[0.3em] uppercase">{title}</h3>
      <div className="space-y-1 text-sm text-zinc-700">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-zinc-400">{label}: </span>
      {value}
    </p>
  );
}

export function ReviewStep() {
  useRequireSession("review");
  const router = useRouter();
  const { registration, loading, setError } = useEnquire();
  const [busy, setBusy] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setLocalErrors([]);
    try {
      const res = await fetch("/api/enquire/submit", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalErrors(data.errors || [data.error || "Submit failed"]);
        setError(data.error || "Submit failed");
        return;
      }
      router.push(`/enquire/done?ref=${encodeURIComponent(data.referenceNumber || "")}`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !registration) return <p className="text-sm text-zinc-400">Loading…</p>;

  const catLabels = registration.productCategories
    .map((id) => ENQUIRE_CATEGORIES.find((c) => c.id === id)?.label || id)
    .join(", ");

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
        Review your registration before submitting. RVCC procurement will receive this request for
        collaborative review.
      </p>

      {localErrors.length > 0 && (
        <ul className="list-inside list-disc border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <Block title="Company">
        <Line label="Legal name" value={registration.company?.legalName} />
        <Line label="DBA" value={registration.company?.dbaName} />
        <Line label="Country" value={registration.company?.country} />
        <Line label="Organization" value={registration.company?.organizationType} />
        <Line label="Supplier type" value={registration.company?.supplierType} />
      </Block>

      <Block title="Contacts">
        {registration.contacts.map((c) => (
          <p key={c.id}>
            {c.firstName} {c.lastName} — {c.email}
            {c.isAdministrative ? " (Admin)" : ""}
          </p>
        ))}
      </Block>

      <Block title="Addresses">
        {registration.addresses.map((a) => (
          <p key={a.id}>
            {a.line1}, {a.city}, {a.country}
            {a.purposes?.length ? ` [${a.purposes.join(", ")}]` : ""}
          </p>
        ))}
      </Block>

      {registration.classifications.length > 0 && (
        <Block title="Classifications">
          {registration.classifications.map((c) => (
            <p key={c.id}>{c.classification}</p>
          ))}
        </Block>
      )}

      {registration.bankAccounts.length > 0 && (
        <Block title="Bank accounts">
          {registration.bankAccounts.map((b) => (
            <p key={b.id}>
              {b.bankName} — {b.accountName} ({b.currency})
            </p>
          ))}
        </Block>
      )}

      <Block title="Products & services">
        <p>{catLabels || "—"}</p>
      </Block>

      <Block title="Questionnaire">
        {ENQUIRE_QUESTIONNAIRE.map((q) => {
          const ans = registration.questionnaire.find((a) => a.questionKey === q.key)?.answer;
          return <Line key={q.key} label={q.label} value={ans || "—"} />;
        })}
      </Block>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => router.push("/enquire/questionnaire")}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void submit()}
        >
          {busy ? "Submitting…" : "Submit Registration"}
        </Button>
      </div>
    </div>
  );
}
