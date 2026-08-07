"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  phone: string;
  mobile: string;
  isAdministrative: boolean;
  requestUserAccount: boolean;
};

const empty = (email = ""): ContactForm => ({
  firstName: "",
  lastName: "",
  email,
  jobTitle: "",
  phone: "",
  mobile: "",
  isAdministrative: true,
  requestUserAccount: false,
});

export function ContactsStep() {
  useRequireSession("contacts");
  const router = useRouter();
  const { registration, saveDraft, loading } = useEnquire();
  const [contacts, setContacts] = useState<ContactForm[]>([empty()]);

  useEffect(() => {
    if (!registration) return;
    if (registration.contacts?.length) {
      setContacts(
        registration.contacts.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email || registration.email,
          jobTitle: c.jobTitle,
          phone: c.phone,
          mobile: c.mobile,
          isAdministrative: c.isAdministrative,
          requestUserAccount: c.requestUserAccount,
        }))
      );
    } else {
      setContacts([empty(registration.email)]);
    }
  }, [registration]);

  const update = (i: number, key: keyof ContactForm, value: string | boolean) => {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({ step: next, contacts });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-10">
      {contacts.map((c, i) => (
        <div key={i} className="space-y-6 border-b border-zinc-100 pb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">
              Contact {String(i + 1).padStart(2, "0")}
            </h3>
            {contacts.length > 1 && (
              <button
                type="button"
                className="text-[10px] font-black tracking-widest text-zinc-400 uppercase hover:text-red-500"
                onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <EnquireField label="First name" required>
              <input
                className={enquireInputClass}
                value={c.firstName}
                onChange={(e) => update(i, "firstName", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Last name" required>
              <input
                className={enquireInputClass}
                value={c.lastName}
                onChange={(e) => update(i, "lastName", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Email" required>
              <input
                className={enquireInputClass}
                type="email"
                value={c.email}
                onChange={(e) => update(i, "email", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Job title">
              <input
                className={enquireInputClass}
                value={c.jobTitle}
                onChange={(e) => update(i, "jobTitle", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Phone">
              <input
                className={enquireInputClass}
                value={c.phone}
                onChange={(e) => update(i, "phone", e.target.value)}
              />
            </EnquireField>
            <EnquireField label="Mobile">
              <input
                className={enquireInputClass}
                value={c.mobile}
                onChange={(e) => update(i, "mobile", e.target.value)}
              />
            </EnquireField>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-zinc-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={c.isAdministrative}
                onChange={(e) => update(i, "isAdministrative", e.target.checked)}
              />
              Administrative contact
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={c.requestUserAccount}
                onChange={(e) => update(i, "requestUserAccount", e.target.checked)}
              />
              Request portal user account
            </label>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="brand-outline"
        className="h-12 rounded-none"
        onClick={() => setContacts((prev) => [...prev, empty(registration?.email || "")])}
      >
        Add Contact
      </Button>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => router.push("/enquire/company")}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => void persist("contacts")}
        >
          Save for Later
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void persist("addresses")}
        >
          Next: Addresses
        </Button>
      </div>
    </div>
  );
}
