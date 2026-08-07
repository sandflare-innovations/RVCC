import { NextResponse } from "next/server";

import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { prisma } from "@/lib/db";
import { getRegistrationFromSession, makeReferenceNumber } from "@/lib/enquire-session";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export async function POST() {
  try {
    if (workerConfigured()) {
      // Worker persists + sends confirmation mail — no SMTP on Next.js.
      const res = await enquireWorkerFetch("/submit", { method: "POST" });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const registration = await getRegistrationFromSession();
    if (!registration) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (registration.status !== "DRAFT") {
      return NextResponse.json({
        ok: true,
        referenceNumber: registration.referenceNumber,
        alreadySubmitted: true,
      });
    }

    const errors: string[] = [];
    if (!registration.company?.legalName?.trim()) errors.push("Company legal name is required");
    if (!registration.company?.country?.trim()) errors.push("Company country is required");
    if (!registration.contacts?.length) errors.push("At least one contact is required");
    if (!registration.addresses?.length) errors.push("At least one address is required");
    if (!registration.productCategories?.length) {
      errors.push("Select at least one product or service category");
    }

    for (const q of ENQUIRE_QUESTIONNAIRE) {
      if (!q.required) continue;
      const ans = registration.questionnaire.find((a) => a.questionKey === q.key);
      if (!ans?.answer?.trim()) errors.push(`Questionnaire: ${q.label}`);
    }

    if (errors.length) {
      return NextResponse.json({ error: "Incomplete registration", errors }, { status: 400 });
    }

    let referenceNumber = makeReferenceNumber();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.supplierRegistration.findUnique({
        where: { referenceNumber },
      });
      if (!clash) break;
      referenceNumber = makeReferenceNumber();
    }

    const updated = await prisma.supplierRegistration.update({
      where: { id: registration.id },
      data: {
        status: "SUBMITTED",
        referenceNumber,
        currentStep: "done",
        submittedAt: new Date(),
      },
    });

    console.warn(
      `[enquire:mail] Local fallback submit ${updated.referenceNumber} — use Worker SMTP in production`
    );

    return NextResponse.json({
      ok: true,
      referenceNumber: updated.referenceNumber,
      registrationId: updated.id,
    });
  } catch (err) {
    console.error("[enquire/submit]", err);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
