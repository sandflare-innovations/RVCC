import { notFound } from "next/navigation";

import { ENQUIRE_STEPS, type EnquireStep } from "@/lib/enquire-constants";
import { EnquireStepClient } from "@/sections/enquire/EnquireStepClient";

type Props = { params: Promise<{ step: string }> };

export default async function RegisterStepPage({ params }: Props) {
  const { step } = await params;
  if (!ENQUIRE_STEPS.includes(step as EnquireStep)) {
    notFound();
  }
  return <EnquireStepClient step={step as EnquireStep} />;
}
