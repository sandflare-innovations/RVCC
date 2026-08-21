"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import countries from "world-countries";

import { SearchableSelect } from "@/components/ui/searchable-select";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ADDRESS_PURPOSES, COUNTRIES } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
} from "@/sections/enquire/EnquireField";
import {
  enquireActionLinkClass,
  enquireMutedClass,
  enquireOptionLabelClass,
  enquireSectionTitleClass,
} from "@/sections/enquire/enquire-typography";

import { cn } from "@lib/utils";

const COUNTRY_OPTIONS = countries
  .map((c) => ({
    value: c.name.common,
    label: c.name.common,
    flag: `fi fi-${c.cca2.toLowerCase()}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

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
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressForm[]>([empty()]);
  const [errors, setErrors] = useState<Record<string, boolean>[]>([]);
  
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

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

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "addresses", addresses });
    setPendingAction(null);
  };

  const goNext = () => {
    const newErrors = addresses.map((a) => {
      const err: Record<string, boolean> = {};
      if (!a.label.trim()) err.label = true;
      if (!a.country.trim()) err.country = true;
      if (!a.line1.trim()) err.line1 = true;
      if (!a.line2.trim()) err.line2 = true;
      if (!a.city.trim()) err.city = true;
      if (!a.region.trim()) err.region = true;
      if (!a.postalCode.trim()) err.postalCode = true;
      if (!a.phone.trim()) err.phone = true;
      if (!a.purposes.length) err.purposes = true;
      return err;
    });

    if (newErrors.some((err) => Object.keys(err).length > 0)) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    advanceTo("classifications", { addresses });
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
    <div className="space-y-10">
      {headerNode && createPortal(actions, headerNode)}
      {addresses.map((a, i) => {
        const err = errors[i] || {};
        return (
          <div key={i} className="space-y-6 border-b border-zinc-100 pb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={enquireSectionTitleClass}>Address {String(i + 1).padStart(2, "0")}</h3>
              {addresses.length > 1 && (
                <button
                  type="button"
                  className={enquireActionLinkClass}
                  onClick={() => setAddresses((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <EnquireField label="Label" required>
                <input
                  className={enquireInputClass}
                  value={a.label}
                  onChange={(e) => {
                    update(i, "label", e.target.value);
                    if (err.label) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, label: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.label}
                />
              </EnquireField>
              <EnquireField label="Country" required>
                <SearchableSelect
                  options={COUNTRY_OPTIONS}
                  value={a.country}
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
              <EnquireField label="Address line 1" required className="md:col-span-2">
                <input
                  className={enquireInputClass}
                  value={a.line1}
                  onChange={(e) => {
                    update(i, "line1", e.target.value);
                    if (err.line1) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, line1: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.line1}
                />
              </EnquireField>
              <EnquireField label="Address line 2" required className="md:col-span-2">
                <input
                  className={enquireInputClass}
                  value={a.line2}
                  onChange={(e) => {
                    update(i, "line2", e.target.value);
                    if (err.line2) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, line2: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.line2}
                />
              </EnquireField>
              <EnquireField label="City" required>
                <input
                  className={enquireInputClass}
                  value={a.city}
                  onChange={(e) => {
                    update(i, "city", e.target.value);
                    if (err.city) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, city: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.city}
                />
              </EnquireField>
              <EnquireField label="Region / Emirate" required>
                <input
                  className={enquireInputClass}
                  value={a.region}
                  onChange={(e) => {
                    update(i, "region", e.target.value);
                    if (err.region) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, region: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.region}
                />
              </EnquireField>
              <EnquireField label="Postal code" required>
                <input
                  className={enquireInputClass}
                  value={a.postalCode}
                  onChange={(e) => {
                    update(i, "postalCode", e.target.value);
                    if (err.postalCode) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, postalCode: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.postalCode}
                />
              </EnquireField>
              <EnquireField label="Phone" required>
                <input
                  className={enquireInputClass}
                  value={a.phone}
                  onChange={(e) => {
                    update(i, "phone", e.target.value);
                    if (err.phone) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, phone: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.phone}
                />
              </EnquireField>
            </div>
          <div className={cn("mt-6", err.purposes && "border border-red-500 rounded p-2")}>
            <p className={cn("mb-3", enquireSectionTitleClass)}>Address purpose <span className="text-red-500">*</span></p>
            <div className={cn("flex flex-wrap gap-8 py-4", enquireOptionLabelClass)}>
              {ADDRESS_PURPOSES.map((p) => (
                <label key={p} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="appearance-none h-5 w-5 rounded-full border-2 border-zinc-300 bg-white checked:bg-brand-blue checked:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:w-1.5 checked:after:h-2.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45 checked:after:left-[6px] checked:after:top-[2px] transition-all"
                    checked={a.purposes.includes(p)}
                    onChange={() => {
                      togglePurpose(i, p);
                      if (err.purposes) {
                        setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, purposes: false } : e)));
                      }
                    }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>
        );
      })}

      <div className="flex justify-center pb-8 pt-4">
        <button
          type="button"
          onClick={() => setAddresses((prev) => [...prev, empty()])}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold tracking-wide text-zinc-700 transition-all hover:bg-zinc-50 hover:text-brand-blue hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          ADD ADDRESS
        </button>
      </div>
    </div>
  );
}
