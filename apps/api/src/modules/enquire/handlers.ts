import { z } from "@rvcc/schemas";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { hashPassword } from "../../lib/password";
import { sendOtpEmail, sendSubmittedEmail, smtpConfigured } from "../mail/mail";
import { createVendorSession } from "../vendor/auth";
import {
  cuid,
  ensureDraftForEmail,
  hashSha256,
  loadBySession,
  loadRegistration,
  makeReferenceNumber,
  timingSafeEqualHex,
} from "./db";
import { issueEmailGate, readEmailGate } from "./email-gate";
import { prisma } from "../../lib/prisma";
import type { Currency, Prisma, RegistrationStatus } from "@prisma/client";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const OTP_MAX_PER_HOUR = 10;

const otpRequestSchema = z.object({
  email: z.string().email(),
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

const draftPatchSchema = z.object({
  step: z.string().optional(),
  company: z.record(z.unknown()).optional(),
  contacts: z.array(z.record(z.unknown())).optional(),
  addresses: z.array(z.record(z.unknown())).optional(),
  classifications: z.array(z.record(z.unknown())).optional(),
  bankAccounts: z.array(z.record(z.unknown())).optional(),
  productCategories: z.array(z.string()).optional(),
  questionnaire: z
    .array(z.object({ questionKey: z.string(), answer: z.string() }))
    .optional(),
});

function sessionFrom(request: Request): string | null {
  return request.headers.get("X-Registration-Session");
}

export async function resolveEnquireRegistration(
  sql: unknown,
  env: Env,
  request: Request
): Promise<any | null> {
  const token = sessionFrom(request);
  if (!token) return null;

  const legacy = await loadBySession(sql, token);
  if (legacy) return legacy;

  const email = readEmailGate(env, token);
  if (!email) return null;

  return ensureDraftForEmail(sql, email);
}

export async function handleOtpRequest(_sql: unknown, env: Env, request: Request): Promise<Response> {
  const raw = await request.json().catch(() => ({}));
  const parsed = otpRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: "Valid email is required" }, 400);
  }
  const email = parsed.data.email.trim().toLowerCase();

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  // Ensure a vendor record exists for this email so VendorOtp FK is strictly satisfied
  let vendor = await prisma.vendorUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!vendor) {
    const newVendorId = cuid();
    const placeholderHash = await hashPassword(cuid());
    vendor = await prisma.vendorUser.create({
      data: {
        id: newVendorId,
        email,
        name: "",
        passwordHash: placeholderHash,
        portalAccess: "HELD",
        isActive: true,
      },
      select: { id: true },
    });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.vendorOtp.count({
    where: {
      vendorId: vendor.id,
      action: "REGISTRATION_VERIFY",
      createdAt: { gt: oneHourAgo },
    },
  });

  if (count >= OTP_MAX_PER_HOUR) {
    return json(env, request, { error: "Too many access code requests. Try again later." }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.vendorOtp.create({
    data: {
      id: cuid(),
      vendorId: vendor.id,
      action: "REGISTRATION_VERIFY",
      codeHash,
      attempts: 0,
      expiresAt,
    },
  });

  try {
    await sendOtpEmail(env, email, code, 15);
  } catch (err) {
    console.error("[enquire] OTP mail failed", err);
    return json(env, request, { error: "Unable to send access code." }, 500);
  }

  return json(env, request, {
    ok: true,
    expiresInMinutes: 15,
  });
}

export async function handleOtpVerify(sql: unknown, env: Env, request: Request): Promise<Response> {
  const raw = await request.json().catch(() => ({}));
  const parsed = otpVerifySchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: "Email and 6-digit code are required" }, 400);
  }
  const { email: rawEmail, code } = parsed.data;
  const email = rawEmail.trim().toLowerCase();

  const vendorRecord = await prisma.vendorUser.findUnique({
    where: { email },
    select: { id: true, mustChangePassword: true, isActive: true, portalAccess: true },
  });

  if (!vendorRecord) {
    return json(env, request, { error: "Invalid or expired access code" }, 401);
  }

  const codeHash = await hashSha256(code);
  const otp = await prisma.vendorOtp.findFirst({
    where: {
      vendorId: vendorRecord.id,
      action: "REGISTRATION_VERIFY",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  const storedHash = otp ? otp.codeHash : "";
  if (!otp || !timingSafeEqualHex(storedHash, codeHash)) {
    return json(env, request, { error: "Invalid or expired access code" }, 401);
  }

  await prisma.vendorOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  // Active vendor with released portal access → open portal.
  if (vendorRecord.isActive && vendorRecord.portalAccess === "RELEASED") {
    const userAgent = request.headers.get("user-agent") ?? "";
    const vendorToken = await createVendorSession(sql, vendorRecord.id, userAgent);
    return json(env, request, {
      ok: true,
      outcome: "vendor",
      vendorToken,
      mustChangePassword: Boolean(vendorRecord.mustChangePassword),
    });
  }

  const latest = await prisma.supplierRegistration.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true, referenceNumber: true, currentStep: true, registrationComplete: true },
  });

  if (latest?.status === "REJECTED") {
    return json(env, request, {
      ok: true,
      outcome: "rejected",
      message: "A previous registration with this email was rejected. Contact RVCC support for assistance.",
    });
  }

  if (latest && latest.status === "APPROVED" && latest.registrationComplete) {
    return json(env, request, {
      ok: true,
      outcome: "approved_held",
      referenceNumber: latest.referenceNumber,
      message:
        "Your registration is approved. Portal access is being prepared by RVCC and will be released shortly.",
    });
  }

  if (latest && (latest.status === "PENDING" || (latest.status as string) === "SUBMITTED") && latest.registrationComplete) {
    return json(env, request, {
      ok: true,
      outcome: "submitted",
      referenceNumber: latest.referenceNumber,
      message: "Your registration is under review by the RVCC compliance team.",
    });
  }

  const gateToken = issueEmailGate(env, email);
  return json(env, request, {
    ok: true,
    outcome: "wizard",
    token: gateToken,
    sessionToken: gateToken,
    step: latest?.currentStep || "company",
  });
}

export async function handleDraftGet(sql: unknown, env: Env, request: Request): Promise<Response> {
  const registration = await resolveEnquireRegistration(sql, env, request);
  if (!registration) return json(env, request, { error: "Not authenticated" }, 401);
  return json(env, request, { registration });
}

export async function handleDraftPatch(sql: unknown, env: Env, request: Request): Promise<Response> {
  const existing = await resolveEnquireRegistration(sql, env, request);
  if (!existing) return json(env, request, { error: "Not authenticated" }, 401);
  if (existing.status !== "DRAFT") {
    return json(env, request, { error: "Registration already submitted" }, 400);
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = draftPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const id = existing.id as string;

  if (data.company && typeof data.company === "object") {
    const c = data.company as Record<string, unknown>;
    const taxIdentifiers = (c.taxIdentifiers ?? {}) as Prisma.InputJsonValue;

    await prisma.companyProfile.upsert({
      where: { registrationId: id },
      update: {
        legalName: String(c.legalName ?? ""),
        dbaName: String(c.dbaName ?? ""),
        country: String(c.country ?? ""),
        taxIdentifiers,
        organizationType: String(c.organizationType ?? ""),
        supplierType: String(c.supplierType ?? ""),
        website: String(c.website ?? ""),
        yearEstablished: String(c.yearEstablished ?? ""),
        dunsNumber: String(c.dunsNumber ?? ""),
        description: String(c.description ?? ""),
      },
      create: {
        id: cuid(),
        registrationId: id,
        legalName: String(c.legalName ?? ""),
        dbaName: String(c.dbaName ?? ""),
        country: String(c.country ?? ""),
        taxIdentifiers,
        organizationType: String(c.organizationType ?? ""),
        supplierType: String(c.supplierType ?? ""),
        website: String(c.website ?? ""),
        yearEstablished: String(c.yearEstablished ?? ""),
        dunsNumber: String(c.dunsNumber ?? ""),
        description: String(c.description ?? ""),
      },
    });
  }

  if (Array.isArray(data.contacts)) {
    await prisma.supplierContact.deleteMany({ where: { registrationId: id } });
    const contactsData = (data.contacts as Record<string, unknown>[]).map((rawContact, i) => ({
      id: cuid(),
      registrationId: id,
      firstName: String(rawContact.firstName ?? ""),
      lastName: String(rawContact.lastName ?? ""),
      email: String(rawContact.email ?? ""),
      jobTitle: String(rawContact.jobTitle ?? ""),
      phone: String(rawContact.phone ?? ""),
      mobile: String(rawContact.mobile ?? ""),
      isAdministrative: Boolean(rawContact.isAdministrative),
      requestUserAccount: Boolean(rawContact.requestUserAccount),
      sortOrder: i,
    }));
    if (contactsData.length) {
      await prisma.supplierContact.createMany({ data: contactsData });
    }
  }

  if (Array.isArray(data.addresses)) {
    await prisma.supplierAddress.deleteMany({ where: { registrationId: id } });
    const addressesData = (data.addresses as Record<string, unknown>[]).map((rawAddress, i) => ({
      id: cuid(),
      registrationId: id,
      label: String(rawAddress.label ?? ""),
      line1: String(rawAddress.line1 ?? ""),
      line2: String(rawAddress.line2 ?? ""),
      city: String(rawAddress.city ?? ""),
      region: String(rawAddress.region ?? ""),
      postalCode: String(rawAddress.postalCode ?? ""),
      country: String(rawAddress.country ?? ""),
      phone: String(rawAddress.phone ?? ""),
      email: String(rawAddress.email ?? ""),
      purposes: Array.isArray(rawAddress.purposes) ? (rawAddress.purposes as string[]) : [],
      sortOrder: i,
    }));
    if (addressesData.length) {
      await prisma.supplierAddress.createMany({ data: addressesData });
    }
  }

  if (Array.isArray(data.classifications)) {
    await prisma.businessClassification.deleteMany({ where: { registrationId: id } });
    const classData = (data.classifications as Record<string, unknown>[])
      .filter((raw) => String(raw.classification ?? "").trim())
      .map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        classification: String(raw.classification ?? ""),
        certificateNumber: String(raw.certificateNumber ?? ""),
        certifyingAgency: String(raw.certifyingAgency ?? ""),
        effectiveDate: String(raw.effectiveDate ?? ""),
        expirationDate: String(raw.expirationDate ?? ""),
        sortOrder: i,
      }));
    if (classData.length) {
      await prisma.businessClassification.createMany({ data: classData });
    }
  }

  if (Array.isArray(data.bankAccounts)) {
    await prisma.bankAccount.deleteMany({ where: { registrationId: id } });
    const bankData = (data.bankAccounts as Record<string, unknown>[])
      .filter((raw) => String(raw.bankName ?? "").trim())
      .map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        country: String(raw.country ?? ""),
        bankName: String(raw.bankName ?? ""),
        branchName: String(raw.branchName ?? ""),
        accountName: String(raw.accountName ?? ""),
        accountNumber: String(raw.accountNumber ?? ""),
        iban: String(raw.iban ?? ""),
        routingNumber: String(raw.routingNumber ?? ""),
        currency: ((raw.currency as string) || "SAR") as Currency,
        sortOrder: i,
      }));
    if (bankData.length) {
      await prisma.bankAccount.createMany({ data: bankData });
    }
  }

  if (Array.isArray(data.productCategories)) {
    await prisma.supplierRegistration.update({
      where: { id },
      data: { productCategories: data.productCategories },
    });
  }

  if (Array.isArray(data.questionnaire)) {
    for (const raw of data.questionnaire) {
      await prisma.questionnaireAnswer.upsert({
        where: {
          registrationId_questionKey: {
            registrationId: id,
            questionKey: raw.questionKey,
          },
        },
        update: { answer: raw.answer ?? "" },
        create: {
          id: cuid(),
          registrationId: id,
          questionKey: raw.questionKey,
          answer: raw.answer ?? "",
        },
      });
    }
  }

  if (typeof data.step === "string" && data.step !== "verify") {
    await prisma.supplierRegistration.update({
      where: { id },
      data: { currentStep: data.step },
    });
  }

  const registration = await loadRegistration(sql, id);
  return json(env, request, { ok: true, registration });
}

export async function handleSubmit(_sql: unknown, env: Env, request: Request): Promise<Response> {
  const gateEmail = readEmailGate(env, sessionFrom(request));
  if (!gateEmail) {
    return json(env, request, { error: "Not authenticated — verify your email again." }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : gateEmail;
  if (email !== gateEmail) {
    return json(env, request, { error: "Email does not match verified session." }, 403);
  }

  const draft = await prisma.supplierRegistration.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: "DRAFT",
    },
    orderBy: { updatedAt: "desc" },
  });

  const company = (body.company as Record<string, unknown>) || {};
  const contacts = Array.isArray(body.contacts) ? (body.contacts as Record<string, unknown>[]) : [];
  const addresses = Array.isArray(body.addresses) ? (body.addresses as Record<string, unknown>[]) : [];
  const classifications = Array.isArray(body.classifications)
    ? (body.classifications as Record<string, unknown>[])
    : [];
  const bankAccounts = Array.isArray(body.bankAccounts)
    ? (body.bankAccounts as Record<string, unknown>[])
    : [];
  const productCategories = Array.isArray(body.productCategories)
    ? (body.productCategories as string[])
    : [];
  const questionnaire = Array.isArray(body.questionnaire)
    ? (body.questionnaire as { questionKey: string; answer: string }[])
    : [];

  const errors: string[] = [];
  if (!String(company.legalName ?? "").trim()) errors.push("Company legal name is required");
  if (!String(company.country ?? "").trim()) errors.push("Company country is required");
  if (!contacts.length) errors.push("At least one contact is required");
  if (!addresses.length) errors.push("At least one address is required");
  if (!productCategories.length) errors.push("Select at least one product or service category");
  if (errors.length) {
    return json(env, request, { error: "Incomplete registration", errors }, 400);
  }

  let referenceNumber = makeReferenceNumber();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.supplierRegistration.findUnique({
      where: { referenceNumber },
      select: { id: true },
    });
    if (!clash) break;
    referenceNumber = makeReferenceNumber();
  }

  const id = draft?.id ? draft.id : cuid();

  if (draft?.id) {
    await prisma.supplierRegistration.update({
      where: { id },
      data: {
        status: "PENDING" as RegistrationStatus,
        registrationComplete: true,
        productCategories,
        referenceNumber,
        currentStep: "done",
        submittedAt: new Date(),
      },
    });
    await prisma.companyProfile.deleteMany({ where: { registrationId: id } });
    await prisma.supplierContact.deleteMany({ where: { registrationId: id } });
    await prisma.supplierAddress.deleteMany({ where: { registrationId: id } });
    await prisma.businessClassification.deleteMany({ where: { registrationId: id } });
    await prisma.bankAccount.deleteMany({ where: { registrationId: id } });
    await prisma.questionnaireAnswer.deleteMany({ where: { registrationId: id } });
  } else {
    await prisma.supplierRegistration.create({
      data: {
        id,
        email,
        status: "PENDING" as RegistrationStatus,
        businessRelationship: "PROSPECTIVE",
        currentStep: "done",
        productCategories,
        referenceNumber,
        registrationComplete: true,
        submittedAt: new Date(),
      },
    });
  }

  const tax = (company.taxIdentifiers ?? {}) as Prisma.InputJsonValue;
  await prisma.companyProfile.create({
    data: {
      id: cuid(),
      registrationId: id,
      legalName: String(company.legalName ?? ""),
      dbaName: String(company.dbaName ?? ""),
      country: String(company.country ?? ""),
      taxIdentifiers: tax,
      organizationType: String(company.organizationType ?? ""),
      supplierType: String(company.supplierType ?? ""),
      website: String(company.website ?? ""),
      yearEstablished: String(company.yearEstablished ?? ""),
      dunsNumber: String(company.dunsNumber ?? ""),
      description: String(company.description ?? ""),
    },
  });

  if (contacts.length) {
    await prisma.supplierContact.createMany({
      data: contacts.map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        firstName: String(raw.firstName ?? ""),
        lastName: String(raw.lastName ?? ""),
        email: String(raw.email ?? ""),
        jobTitle: String(raw.jobTitle ?? ""),
        phone: String(raw.phone ?? ""),
        mobile: String(raw.mobile ?? ""),
        isAdministrative: Boolean(raw.isAdministrative),
        requestUserAccount: Boolean(raw.requestUserAccount),
        sortOrder: i,
      })),
    });
  }

  if (addresses.length) {
    await prisma.supplierAddress.createMany({
      data: addresses.map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        label: String(raw.label ?? ""),
        line1: String(raw.line1 ?? ""),
        line2: String(raw.line2 ?? ""),
        city: String(raw.city ?? ""),
        region: String(raw.region ?? ""),
        postalCode: String(raw.postalCode ?? ""),
        country: String(raw.country ?? ""),
        phone: String(raw.phone ?? ""),
        email: String(raw.email ?? ""),
        purposes: Array.isArray(raw.purposes) ? (raw.purposes as string[]) : [],
        sortOrder: i,
      })),
    });
  }

  const validClassifications = classifications.filter((raw) => String(raw.classification ?? "").trim());
  if (validClassifications.length) {
    await prisma.businessClassification.createMany({
      data: validClassifications.map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        classification: String(raw.classification ?? ""),
        certificateNumber: String(raw.certificateNumber ?? ""),
        certifyingAgency: String(raw.certifyingAgency ?? ""),
        effectiveDate: String(raw.effectiveDate ?? ""),
        expirationDate: String(raw.expirationDate ?? ""),
        sortOrder: i,
      })),
    });
  }

  const validBankAccounts = bankAccounts.filter((raw) => String(raw.bankName ?? "").trim());
  if (validBankAccounts.length) {
    await prisma.bankAccount.createMany({
      data: validBankAccounts.map((raw, i) => ({
        id: cuid(),
        registrationId: id,
        country: String(raw.country ?? ""),
        bankName: String(raw.bankName ?? ""),
        branchName: String(raw.branchName ?? ""),
        accountName: String(raw.accountName ?? ""),
        accountNumber: String(raw.accountNumber ?? ""),
        iban: String(raw.iban ?? ""),
        routingNumber: String(raw.routingNumber ?? ""),
        currency: ((raw.currency as string) || "SAR") as Currency,
        sortOrder: i,
      })),
    });
  }

  const validQuestions = questionnaire.filter((raw) => String(raw.questionKey ?? "").trim());
  if (validQuestions.length) {
    await prisma.questionnaireAnswer.createMany({
      data: validQuestions.map((raw) => ({
        id: cuid(),
        registrationId: id,
        questionKey: String(raw.questionKey),
        answer: String(raw.answer ?? ""),
      })),
    });
  }

  // Held portal account — cannot use vendor pages until admin Release.
  const legalName = String(company.legalName ?? "");
  const existingVendor = await prisma.vendorUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingVendor) {
    await prisma.vendorUser.update({
      where: { id: existingVendor.id },
      data: {
        registrationId: id,
        portalAccess: "HELD",
      },
    });
  } else {
    const placeholderHash = await hashPassword(cuid());
    await prisma.vendorUser.create({
      data: {
        id: cuid(),
        email,
        name: legalName,
        passwordHash: placeholderHash,
        mustChangePassword: true,
        isActive: true,
        portalAccess: "HELD",
        registrationId: id,
      },
    });
  }

  let notified = false;
  try {
    await sendSubmittedEmail(env, email, {
      legalName,
      referenceNumber,
    });
    notified = true;
  } catch (err) {
    console.error("[enquire] submit confirmation email failed", err);
  }

  return json(
    env,
    request,
    {
      ok: true,
      referenceNumber,
      registrationId: id,
      notified,
    },
    201
  );
}
