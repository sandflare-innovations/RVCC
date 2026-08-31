"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRouter } from "next/navigation";
import { LuPlus as Plus } from "react-icons/lu";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";
import {
  enquireActionLinkClass,
  enquireOptionLabelClass,
  enquireSectionTitleClass,
} from "@/sections/enquire/enquire-typography";

import { cn } from "@lib/utils";

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
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactForm[]>([empty()]);
  const [errors, setErrors] = useState<Record<string, boolean>[]>([]);
  
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

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

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "contacts", contacts });
    setPendingAction(null);
  };

  const goNext = () => {
    const newErrors = contacts.map((c) => {
      const err: Record<string, boolean> = {};
      if (!c.firstName.trim()) err.firstName = true;
      if (!c.lastName.trim()) err.lastName = true;
      if (!c.email.trim()) err.email = true;
      if (!c.jobTitle.trim()) err.jobTitle = true;
      if (!c.phone.trim()) err.phone = true;
      if (!c.mobile.trim()) err.mobile = true;
      return err;
    });

    if (newErrors.some((err) => Object.keys(err).length > 0)) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    advanceTo("addresses", { contacts });
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
      {contacts.map((c, i) => {
        const err = errors[i] || {};
        return (
          <div key={i} className="space-y-6 border-b border-zinc-100 pb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={enquireSectionTitleClass}>Contact {String(i + 1).padStart(2, "0")}</h3>
              {contacts.length > 1 && (
                <button
                  type="button"
                  className={enquireActionLinkClass}
                  onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <EnquireField label="First name" required>
                <input
                  className={enquireInputClass}
                  value={c.firstName}
                  onChange={(e) => {
                    update(i, "firstName", e.target.value);
                    if (err.firstName) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, firstName: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.firstName}
                />
              </EnquireField>
              <EnquireField label="Last name" required>
                <input
                  className={enquireInputClass}
                  value={c.lastName}
                  onChange={(e) => {
                    update(i, "lastName", e.target.value);
                    if (err.lastName) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, lastName: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.lastName}
                />
              </EnquireField>
              <EnquireField label="Email" required>
                <input
                  className={enquireInputClass}
                  type="email"
                  value={c.email}
                  onChange={(e) => {
                    update(i, "email", e.target.value);
                    if (err.email) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, email: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.email}
                />
              </EnquireField>
              <EnquireField label="Job title" required>
                <input
                  className={enquireInputClass}
                  value={c.jobTitle}
                  onChange={(e) => {
                    update(i, "jobTitle", e.target.value);
                    if (err.jobTitle) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, jobTitle: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.jobTitle}
                />
              </EnquireField>
              <EnquireField label="Phone" required>
                <input
                  className={enquireInputClass}
                  value={c.phone}
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
              <EnquireField label="Mobile" required>
                <input
                  className={enquireInputClass}
                  value={c.mobile}
                  onChange={(e) => {
                    update(i, "mobile", e.target.value);
                    if (err.mobile) {
                      setErrors((prev) => prev.map((e, idx) => (idx === i ? { ...e, mobile: false } : e)));
                    }
                  }}
                  placeholder=" "
                  aria-invalid={err.mobile}
                />
              </EnquireField>
            </div>
          <div className={cn("flex flex-wrap justify-center gap-8 py-4", enquireOptionLabelClass)}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="appearance-none h-5 w-5 rounded-full border-2 border-zinc-300 bg-white checked:bg-brand-blue checked:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:w-1.5 checked:after:h-2.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45 checked:after:left-[6px] checked:after:top-[2px] transition-all"
                checked={c.isAdministrative}
                onChange={(e) => update(i, "isAdministrative", e.target.checked)}
              />
              Administrative contact
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="appearance-none h-5 w-5 rounded-full border-2 border-zinc-300 bg-white checked:bg-brand-blue checked:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:w-1.5 checked:after:h-2.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45 checked:after:left-[6px] checked:after:top-[2px] transition-all"
                checked={c.requestUserAccount}
                onChange={(e) => update(i, "requestUserAccount", e.target.checked)}
              />
              Request portal user account
            </label>
          </div>
          </div>
        );
      })}
      <div className="flex justify-center pb-8 pt-4">
        <button
          type="button"
          onClick={() => setContacts((prev) => [...prev, empty(registration?.email || "")])}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold tracking-wide text-zinc-700 transition-all hover:bg-zinc-50 hover:text-brand-blue hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          ADD CONTACT
        </button>
      </div>

    </div>
  );
}
