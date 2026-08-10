"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ADDRESS_PURPOSES, COUNTRIES } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
} from "@/sections/enquire/EnquireField";

type AddressForm = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  purposes: string[];
};

const empty = (): AddressForm => ({
  label: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "Saudi Arabia",
  phone: "",
  email: "",
  purposes: ["Ordering"],
});

export function AddressesStep() {
  useRequireSession("addresses");
  const router = useRouter();
  const { registration, saveDraft, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressForm[]>([empty()]);

  useEffect(() => {
    if (!registration?.addresses?.length) return;
    setAddresses(
      registration.addresses.map((a) => ({
        label: a.label,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
        country: a.country || "Saudi Arabia",
        phone: a.phone,
        email: a.email,
        purposes: a.purposes?.length ? a.purposes : ["Ordering"],
      }))
    );
  }, [registration]);

  const update = (i: number, key: keyof AddressForm, value: string | string[]) => {
    setAddresses((prev) => prev.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)));
  };

  const togglePurpose = (i: number, purpose: string) => {
    setAddresses((prev) =>
      prev.map((a, idx) => {
        if (idx !== i) return a;
        const has = a.purposes.includes(purpose);
        return {
          ...a,
          purposes: has ? a.purposes.filter((p) => p !== purpose) : [...a.purposes, purpose],
        };
      })
    );
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({ step: next, addresses });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-base text-zinc-600">Loading…</p>;

  return (
    <div className="space-y-10">
      {addresses.map((a, i) => (
        <div key={i} className="space-y-6 border-b border-zinc-100 pb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-[0.18em] text-zinc-600 uppercase">
              Address {String(i + 1).padStart(2, "0")}
            </h3>
            {addresses.length > 1 && (
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center text-xs font-bold tracking-wider text-zinc-600 uppercase transition-colors hover:text-red-600"
                onClick={() => setAddresses((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <EnquireField label="Label">
              <input
                className={enquireInputClass}
                value={a.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="HQ / Warehouse"
              />
            </EnquireField>
            <EnquireField label="Country" required>
              <select
                className={enquireSelectClass}
                value={a.country}
                onChange={(e) => update(i, "country", e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </EnquireField>
            <EnquireField label="Address line 1" required className="md:col-span-2">
              <input
                className={enquireInputClass}
                value={a.line1}
                onChange={(e) => update(i, "line1", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Address line 2" className="md:col-span-2">
              <input
                className={enquireInputClass}
                value={a.line2}
                onChange={(e) => update(i, "line2", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="City" required>
              <input
                className={enquireInputClass}
                value={a.city}
                onChange={(e) => update(i, "city", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Region / Emirate">
              <input
                className={enquireInputClass}
                value={a.region}
                onChange={(e) => update(i, "region", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Postal code">
              <input
                className={enquireInputClass}
                value={a.postalCode}
                onChange={(e) => update(i, "postalCode", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Phone">
              <input
                className={enquireInputClass}
                value={a.phone}
                onChange={(e) => update(i, "phone", e.target.value)}
              />
            </EnquireField>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.16em] text-zinc-600 uppercase">
              Address purpose
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
              {ADDRESS_PURPOSES.map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={a.purposes.includes(p)}
                    onChange={() => togglePurpose(i, p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}

      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="sm:w-auto"
        fullWidth
        disabled={saving}
        onClick={() => setAddresses((prev) => [...prev, empty()])}
      >
        Add Address
      </InteractiveHoverButton>

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          onClick={() => router.push("/enquire/contacts")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={saving && pendingAction === "addresses"}
          onClick={() => {
            setPendingAction("addresses");
            void persist("addresses");
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
          pending={saving && pendingAction === "classifications"}
          onClick={() => {
            setPendingAction("classifications");
            void persist("classifications");
          }}
        >
          Next: Classifications
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
