"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import type { EnquireStep } from "@/lib/enquire-constants";
import { EnquireShell } from "@/sections/enquire/EnquireShell";

const VerifyStep = dynamic(
  () => import("@/sections/enquire/steps/VerifyStep").then((m) => m.VerifyStep),
  { loading: () => null }
);
const CompanyStep = dynamic(
  () => import("@/sections/enquire/steps/CompanyStep").then((m) => m.CompanyStep),
  { loading: () => null }
);
const ContactsStep = dynamic(
  () => import("@/sections/enquire/steps/ContactsStep").then((m) => m.ContactsStep),
  { loading: () => null }
);
const AddressesStep = dynamic(
  () => import("@/sections/enquire/steps/AddressesStep").then((m) => m.AddressesStep),
  { loading: () => null }
);
const ClassificationsStep = dynamic(
  () =>
    import("@/sections/enquire/steps/ClassificationsStep").then((m) => m.ClassificationsStep),
  { loading: () => null }
);
const BankStep = dynamic(
  () => import("@/sections/enquire/steps/BankStep").then((m) => m.BankStep),
  { loading: () => null }
);
const ProductsStep = dynamic(
  () => import("@/sections/enquire/steps/ProductsStep").then((m) => m.ProductsStep),
  { loading: () => null }
);
const QuestionnaireStep = dynamic(
  () =>
    import("@/sections/enquire/steps/QuestionnaireStep").then((m) => m.QuestionnaireStep),
  { loading: () => null }
);
const AttachmentsStep = dynamic(
  () => import("@/sections/enquire/steps/AttachmentsStep").then((m) => m.AttachmentsStep),
  { loading: () => null }
);
const ReviewStep = dynamic(
  () => import("@/sections/enquire/steps/ReviewStep").then((m) => m.ReviewStep),
  { loading: () => null }
);
const DoneStep = dynamic(
  () => import("@/sections/enquire/steps/DoneStep").then((m) => m.DoneStep),
  { loading: () => null }
);

const META: Record<EnquireStep, { title: string; subtitle: string; details?: React.ReactNode }> = {
  verify: {
    title: "Verify Email",
    subtitle: "Secure access to RVCC supplier registration with a one-time code.",
  },
  company: {
    title: "Company Details",
    subtitle: "Tell us about your organization, tax identifiers, and supplier profile.",
    details: "Provide your legal company name, registration identifiers, and select the organization and supplier types that best fit your profile.",
  },
  contacts: {
    title: "Contacts",
    subtitle: "People who will engage with RVCC procurement and project teams.",
    details: "Add primary and secondary contacts who will engage with RVCC procurement and project teams. At least one contact must be provided.",
  },
  addresses: {
    title: "Addresses",
    subtitle: "Ordering, remit-to, and RFQ locations for your business activities.",
    details: "Provide ordering, remit-to, and RFQ locations for your business activities. At least one address is required.",
  },
  classifications: {
    title: "Classifications",
    subtitle: "Optional diversity, SME, and certification classifications.",
    details: "Optional. Add any diversity, SME, or certification classifications that apply to your business to assist in pre-qualification.",
  },
  bank: {
    title: "Bank Accounts",
    subtitle: "Payment destinations for future spend-authorized transactions.",
    details: "Optional for prospective registration. Provide bank details if you are ready for future spend-authorized transactions.",
  },
  products: {
    title: "Products & Services",
    subtitle: "Categories of goods and services you can supply to RVCC.",
    details: "Select all categories of goods and services you can supply to RVCC. You must select at least one category to continue.",
  },
  questionnaire: {
    title: "Questionnaire",
    subtitle: "Additional onboarding questions for RVCC procurement review.",
    details: "Answer the following onboarding questions. Your responses will be evaluated during the procurement review process.",
  },
  attachments: {
    title: "Documents",
    subtitle: "Upload certificates and supporting files for procurement review.",
    details: "Upload supporting documents for procurement review. Required items are marked with an asterisk. PDF, JPEG, and PNG up to 15 MB each.",
  },
  review: {
    title: "Review & Submit",
    subtitle: "Confirm your information and submit your registration request.",
    details: (
      <div className="space-y-3">
        <p>Confirm every section below. This is the exact package RVCC procurement will receive - ensure all data is accurate before final submission.</p>
        <p>This document is a read-only summary of your application. Use Edit on any section to change details — updates appear here automatically before you submit.</p>
      </div>
    ),
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
    case "attachments":
      return <AttachmentsStep />;
    case "review":
      return <ReviewStep />;
    case "done":
      return (
        <Suspense fallback={null}>
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
    <EnquireShell step={step} title={meta.title} subtitle={meta.subtitle} details={meta.details}>
      <StepBody step={step} />
    </EnquireShell>
  );
}
