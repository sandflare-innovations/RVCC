import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { draftPatchSchema } from "@/lib/enquire-schemas";
import { getRegistrationFromSession } from "@/lib/enquire-session";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export async function GET() {
  try {
    if (workerConfigured()) {
      const res = await enquireWorkerFetch("/draft", { method: "GET" });
      // No session yet (verify step) — not an error for the UI.
      if (res.status === 401) {
        return NextResponse.json({ registration: null });
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const registration = await getRegistrationFromSession();
    if (!registration) {
      return NextResponse.json({ registration: null });
    }
    return NextResponse.json({ registration });
  } catch (err) {
    console.error("[enquire/draft GET]", err);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = draftPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (workerConfigured()) {
      const res = await enquireWorkerFetch("/draft", {
        method: "PATCH",
        body: parsed.data,
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const registration = await getRegistrationFromSession();
    if (!registration) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (registration.status !== "DRAFT") {
      return NextResponse.json({ error: "Registration already submitted" }, { status: 400 });
    }

    const data = parsed.data;
    const id = registration.id;

    if (data.company) {
      await prisma.companyProfile.upsert({
        where: { registrationId: id },
        create: {
          registrationId: id,
          legalName: data.company.legalName ?? "",
          dbaName: data.company.dbaName ?? "",
          country: data.company.country ?? "",
          taxIdentifiers: data.company.taxIdentifiers ?? {},
          organizationType: data.company.organizationType ?? "",
          supplierType: data.company.supplierType ?? "",
          website: data.company.website ?? "",
          yearEstablished: data.company.yearEstablished ?? "",
          dunsNumber: data.company.dunsNumber ?? "",
          description: data.company.description ?? "",
        },
        update: {
          legalName: data.company.legalName ?? "",
          dbaName: data.company.dbaName ?? "",
          country: data.company.country ?? "",
          taxIdentifiers: data.company.taxIdentifiers ?? {},
          organizationType: data.company.organizationType ?? "",
          supplierType: data.company.supplierType ?? "",
          website: data.company.website ?? "",
          yearEstablished: data.company.yearEstablished ?? "",
          dunsNumber: data.company.dunsNumber ?? "",
          description: data.company.description ?? "",
        },
      });
    }

    if (data.contacts) {
      await prisma.supplierContact.deleteMany({ where: { registrationId: id } });
      if (data.contacts.length) {
        await prisma.supplierContact.createMany({
          data: data.contacts.map((c, i) => ({
            registrationId: id,
            firstName: c.firstName ?? "",
            lastName: c.lastName ?? "",
            email: c.email ?? "",
            jobTitle: c.jobTitle ?? "",
            phone: c.phone ?? "",
            mobile: c.mobile ?? "",
            isAdministrative: c.isAdministrative ?? false,
            requestUserAccount: c.requestUserAccount ?? false,
            sortOrder: i,
          })),
        });
      }
    }

    if (data.addresses) {
      await prisma.supplierAddress.deleteMany({ where: { registrationId: id } });
      if (data.addresses.length) {
        await prisma.supplierAddress.createMany({
          data: data.addresses.map((a, i) => ({
            registrationId: id,
            label: a.label ?? "",
            line1: a.line1 ?? "",
            line2: a.line2 ?? "",
            city: a.city ?? "",
            region: a.region ?? "",
            postalCode: a.postalCode ?? "",
            country: a.country ?? "",
            phone: a.phone ?? "",
            email: a.email ?? "",
            purposes: a.purposes ?? [],
            sortOrder: i,
          })),
        });
      }
    }

    if (data.classifications) {
      await prisma.businessClassification.deleteMany({ where: { registrationId: id } });
      const rows = data.classifications.filter((c) => c.classification?.trim());
      if (rows.length) {
        await prisma.businessClassification.createMany({
          data: rows.map((c, i) => ({
            registrationId: id,
            classification: c.classification ?? "",
            certificateNumber: c.certificateNumber ?? "",
            certifyingAgency: c.certifyingAgency ?? "",
            effectiveDate: c.effectiveDate ?? "",
            expirationDate: c.expirationDate ?? "",
            sortOrder: i,
          })),
        });
      }
    }

    if (data.bankAccounts) {
      await prisma.bankAccount.deleteMany({ where: { registrationId: id } });
      const rows = data.bankAccounts.filter((b) => b.bankName?.trim());
      if (rows.length) {
        await prisma.bankAccount.createMany({
          data: rows.map((b, i) => ({
            registrationId: id,
            country: b.country ?? "",
            bankName: b.bankName ?? "",
            branchName: b.branchName ?? "",
            accountName: b.accountName ?? "",
            accountNumber: b.accountNumber ?? "",
            iban: b.iban ?? "",
            routingNumber: b.routingNumber ?? "",
            currency: b.currency ?? "SAR",
            sortOrder: i,
          })),
        });
      }
    }

    if (data.productCategories) {
      await prisma.supplierRegistration.update({
        where: { id },
        data: { productCategories: data.productCategories },
      });
    }

    if (data.questionnaire) {
      for (const q of data.questionnaire) {
        await prisma.questionnaireAnswer.upsert({
          where: {
            registrationId_questionKey: {
              registrationId: id,
              questionKey: q.questionKey,
            },
          },
          create: {
            registrationId: id,
            questionKey: q.questionKey,
            answer: q.answer,
          },
          update: { answer: q.answer },
        });
      }
    }

    if (data.step && data.step !== "verify") {
      await prisma.supplierRegistration.update({
        where: { id },
        data: { currentStep: data.step },
      });
    }

    const updated = await getRegistrationFromSession();
    return NextResponse.json({ ok: true, registration: updated });
  } catch (err) {
    console.error("[enquire/draft PATCH]", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
