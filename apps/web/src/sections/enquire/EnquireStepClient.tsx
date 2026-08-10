"use client";

import { Suspense } from "react";

import type { EnquireStep } from "@/lib/enquire-constants";
import { EnquireShell } from "@/sections/enquire/EnquireShell";
import { AddressesStep } from "@/sections/enquire/steps/AddressesStep";
import { BankStep } from "@/sections/enquire/steps/BankStep";
import { ClassificationsStep } from "@/sections/enquire/steps/ClassificationsStep";
import { CompanyStep } from "@/sections/enquire/steps/CompanyStep";
import { ContactsStep } from "@/sections/enquire/steps/ContactsStep";
import { DoneStep } from "@/sections/enquire/steps/DoneStep";
import { ProductsStep } from "@/sections/enquire/steps/ProductsStep";
import { QuestionnaireStep } from "@/sections/enquire/steps/QuestionnaireStep";
import { ReviewStep } from "@/sections/enquire/steps/ReviewStep";
import { VerifyStep } from "@/sections/enquire/steps/VerifyStep";

const META: Record<EnquireStep, { title: string; subtitle: string }> = {
  verify: {
    title: "Verify Email",
    subtitle: "Secure access to RVCC supplier registration with a one-time code.",
  },
  company: {
    title: "Company Details",
    subtitle: "Tell us about your organization, tax identifiers, and supplier profile.",
  },
  contacts: {
    title: "Contacts",
    subtitle: "People who will engage with RVCC procurement and project teams.",
  },
  addresses: {
    title: "Addresses",
    subtitle: "Ordering, remit-to, and RFQ locations for your business activities.",
  },
  classifications: {
    title: "Classifications",
    subtitle: "Optional diversity, SME, and certification classifications.",
  },
  bank: {
    title: "Bank Accounts",
    subtitle: "Payment destinations for future spend-authorized transactions.",
  },
  products: {
    title: "Products & Services",
    subtitle: "Categories of goods and services you can supply to RVCC.",
  },
  questionnaire: {
    title: "Questionnaire",
    subtitle: "Additional onboarding questions for RVCC procurement review.",
  },
  review: {
    title: "Review & Submit",
    subtitle: "Confirm your information and submit your registration request.",
  },
  done: {
    title: "Complete",
    subtitle: "Your supplier registration request has been received.",
  },
};

function StepBody({ step }: { step: EnquireStep }) {
  switch (step) {
    case "verify":
      return <VerifyStep />;
    case "company":
      return <CompanyStep />;
    case "contacts":
      return <ContactsStep />;
    case "addresses":
      return <AddressesStep />;
    case "classifications":
      return <ClassificationsStep />;
    case "bank":
      return <BankStep />;
    case "products":
      return <ProductsStep />;
    case "questionnaire":
      return <QuestionnaireStep />;
    case "review":
      return <ReviewStep />;
    case "done":
      return (
        <Suspense fallback={<p className="text-base text-zinc-600">Loading…</p>}>
          <DoneStep />
        </Suspense>
      );
    default:
      return null;
  }
}

export function EnquireStepClient({ step }: { step: EnquireStep }) {
  const meta = META[step];
  return (
    <EnquireShell step={step} title={meta.title} subtitle={meta.subtitle}>
      <StepBody step={step} />
    </EnquireShell>
  );
}
