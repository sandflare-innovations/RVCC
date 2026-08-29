import { generateTempPassword, hashPassword } from "../../lib/password";

import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  sendApprovedEmail,
  sendAwardEmail,
  sendOtpEmail,
  sendRejectedEmail,
  sendRequirementPostedEmail,
  sendSubmittedEmail,
  smtpConfigured,
} from "../mail/mail";
import { createVendorSession } from "../vendor/auth";
import {
  type Sql,
  cuid,
  ensureDraftForEmail,
  hashSha256,
  loadBySession,
  loadRegistration,
  makeReferenceNumber,
  timingSafeEqualHex,
} from "./db";
import {
  otpRequestSchema,
  otpVerifySchema,
  draftPatchSchema,
} from "@rvcc/schemas";
import { issueEmailGate, readEmailGate } from "./email-gate";

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_PER_HOUR = 5;

type DecisionRecipient = { to: string; loginEmail?: string; tempPassword?: string };

/**
 * Sends approval/rejection mail on behalf of the admin panel.
 *
 * Mail-only by design: the decision itself is already committed to Postgres by
 * the Next.js admin route, so this handler touches no data. It is reachable
 * only with the shared API secret, which never leaves the server side.
 */
/**
 * Sends requirement mail on behalf of the unified API.
 *
 * SMTP credentials live only on this Worker, so every other Worker that needs
 * mail asks this one — the same arrangement as handleNotifyDecision below.
 *
 * Reports per-recipient outcomes rather than a single pass/fail: one bad
 * address must not hide the fact that the others were delivered.
 */
export async function handleNotifyRequirement(env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    kind?: "POSTED" | "AWARDED";
    recipients?: string[];
    project?: string;
    scopeOfWork?: string;
    referenceNumber?: string;
    closesAt?: string;
    portalUrl?: string;
  };

  const kind = body.kind;
  if (kind !== "POSTED" && kind !== "AWARDED") {
    return json(env, request, { error: "kind must be POSTED or AWARDED" }, 400);
  }

  const recipients = (body.recipients ?? []).filter(
    (r) => typeof r === "string" && r.includes("@")
  );
  if (recipients.length === 0) {
    return json(env, request, { error: "At least one recipient is required" }, 400);
  }
  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  const sent: string[] = [];
  const failed: { to: string; error: string }[] = [];

  for (const to of recipients) {
    try {
      if (kind === "POSTED") {
        await sendRequirementPostedEmail(env, to, {
          project: String(body.project ?? ""),
          scopeOfWork: String(body.scopeOfWork ?? ""),
          referenceNumber: String(body.referenceNumber ?? ""),
          closesAt: String(body.closesAt ?? ""),
          portalUrl: String(body.portalUrl ?? ""),
        });
      } else {
        await sendAwardEmail(env, to, {
          project: String(body.project ?? ""),
          referenceNumber: String(body.referenceNumber ?? ""),
          portalUrl: String(body.portalUrl ?? ""),
        });
      }
      sent.push(to);
    } catch (err) {
      failed.push({ to, error: (err as Error).message });
    }
  }

  return json(env, request, { ok: true, sent, failed });
}

export async function handleNotifyDecision(env: Env, request: Request): Promise<Response> {
  const body = (await request.json()) as {
    decision?: "APPROVED" | "REJECTED";
    legalName?: string;
    referenceNumber?: string;
    portalUrl?: string;
    reason?: string;
    recipients?: DecisionRecipient[];
  };

  const decision = body.decision;
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return json(env, request, { error: "decision must be APPROVED or REJECTED" }, 400);
  }

  const recipients = (body.recipients ?? []).filter((r) => r?.to?.includes("@"));
  if (recipients.length === 0) {
    return json(env, request, { error: "At least one recipient is required" }, 400);
  }

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  const legalName = body.legalName ?? "";
  const referenceNumber = body.referenceNumber ?? "";

  // Report per-recipient so a single bad address does not hide the rest.
  const sent: string[] = [];
  const failed: { to: string; error: string }[] = [];

  for (const r of recipients) {
    try {
      if (decision === "APPROVED") {
        await sendApprovedEmail(env, r.to, {
          legalName,
          referenceNumber,
          portalUrl: body.portalUrl ?? "",
          loginEmail: r.loginEmail,
          tempPassword: r.tempPassword,
        });
      } else {
        await sendRejectedEmail(env, r.to, {
          legalName,
          referenceNumber,
          reason: body.reason ?? "No reason supplied.",
        });
      }
      sent.push(r.to);
    } catch (err) {
      console.error("[notify/decision]", r.to, err);
      failed.push({ to: r.to, error: err instanceof Error ? err.message : "send failed" });
    }
  }

  return json(env, request, { ok: failed.length === 0, sent, failed }, failed.length ? 207 : 200);
}

function sessionFrom(request: Request): string | null {
  return request.headers.get("X-Enquire-Session");
}

/** Email-gate token (post-OTP) or legacy DB sessionToken. */
export async function resolveEnquireRegistration(sql: Sql, env: Env, request: Request) {
  const token = sessionFrom(request);
  if (!token) return null;

  const byDb = await loadBySession(sql, token);
  if (byDb) return byDb;

  const email = readEmailGate(env, token);
  if (!email) return null;
  return ensureDraftForEmail(sql, email);
}

export async function handleOtpRequest(sql: Sql, env: Env, request: Request): Promise<Response> {
  const raw = await request.json().catch(() => ({}));
  const parsed = otpRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: "Valid email is required" }, 400);
  }
  const email = parsed.data.email;

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM "OtpChallenge"
    WHERE "ownerType" = 'REGISTRATION' AND "ownerId" = ${email}
      AND action = 'REGISTRATION_VERIFY'
      AND "createdAt" > NOW() - INTERVAL '1 hour'
  `;
  if (Number(count) >= OTP_MAX_PER_HOUR) {
    return json(env, request, { error: "Too many access code requests. Try again later." }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await sql`
    INSERT INTO "OtpChallenge" (id, "ownerType", "ownerId", action, "codeHash", "expiresAt", "createdAt")
    VALUES (${cuid()}, 'REGISTRATION', ${email}, 'REGISTRATION_VERIFY', ${codeHash}, ${expiresAt}, NOW())
  `;

  // OTP only — registration rows are created on final submit (browser holds drafts).
  // Await delivery: Workers cancel fire-and-forget work when the response is sent.
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

export async function handleOtpVerify(sql: Sql, env: Env, request: Request): Promise<Response> {
  const raw = await request.json().catch(() => ({}));
  const parsed = otpVerifySchema.safeParse(raw);
  if (!parsed.success) {
    return json(env, request, { error: "Email and 6-digit code are required" }, 400);
  }
  const { email, code } = parsed.data;

  const codeHash = await hashSha256(code);
  const [otp] = await sql`
    SELECT * FROM "OtpChallenge"
    WHERE "ownerType" = 'REGISTRATION' AND "ownerId" = ${email}
      AND action = 'REGISTRATION_VERIFY'
      AND "consumedAt" IS NULL
      AND "expiresAt" > NOW()
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (!otp || !timingSafeEqualHex(String(otp.codeHash), codeHash)) {
    return json(env, request, { error: "Invalid or expired access code" }, 401);
  }

  await sql`UPDATE "OtpChallenge" SET "consumedAt" = NOW() WHERE id = ${otp.id}`;

  // Active vendor with released portal access → open portal.
  const [vendor] = await sql`
    SELECT id, "mustChangePassword", "isActive", "portalAccess"
    FROM "VendorUser"
    WHERE lower(email) = ${email}
    LIMIT 1
  `;
  if (vendor && vendor.isActive && (vendor.portalAccess as string) === "RELEASED") {
    const userAgent = request.headers.get("user-agent") ?? "";
    const vendorToken = await createVendorSession(sql, String(vendor.id), userAgent);
    return json(env, request, {
      ok: true,
      outcome: "vendor",
      vendorToken,
      mustChangePassword: Boolean(vendor.mustChangePassword),
    });
  }

  const [latest] = await sql`
    SELECT id, status, "referenceNumber", "currentStep", "registrationComplete"
    FROM "SupplierRegistration"
    WHERE lower(email) = ${email}
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;

  if (latest?.status === "REJECTED") {
    return json(env, request, {
      ok: true,
      outcome: "rejected",
      message:
        "This registration was not approved. Contact RVCC procurement if you believe this is an error.",
      referenceNumber: latest.referenceNumber ?? null,
    });
  }

  const complete =
    Boolean(latest?.registrationComplete) ||
    latest?.status === "SUBMITTED" ||
    latest?.status === "APPROVED" ||
    (vendor && vendor.isActive);

  if (complete || (vendor && (vendor.portalAccess as string) === "HELD")) {
    const sessionToken = issueEmailGate(env, email);
    let registration = null;
    if (latest?.id) {
      registration = await loadRegistration(sql, String(latest.id));
    }
    return json(env, request, {
      ok: true,
      outcome: "held",
      sessionToken,
      message:
        "Account registered successfully. Vendor portal access is on hold until RVCC releases it.",
      referenceNumber: latest?.referenceNumber ?? null,
      status: latest?.status ?? "SUBMITTED",
      registration,
    });
  }

  // Incomplete — registration wizard (browser draft only).
  const sessionToken = issueEmailGate(env, email);
  return json(env, request, {
    ok: true,
    outcome: "register",
    sessionToken,
    currentStep: "company",
  });
}

export async function handleDraftGet(sql: Sql, env: Env, request: Request): Promise<Response> {
  const registration = await resolveEnquireRegistration(sql, env, request);
  if (!registration) return json(env, request, { error: "Not authenticated" }, 401);
  return json(env, request, { registration });
}

export async function handleDraftPatch(sql: Sql, env: Env, request: Request): Promise<Response> {
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
    const tax = JSON.stringify(c.taxIdentifiers ?? {});
    await sql`
      INSERT INTO "CompanyProfile" (
        id, "registrationId", "legalName", "dbaName", country, "taxIdentifiers",
        "organizationType", "supplierType", website, "yearEstablished", "dunsNumber", description
      ) VALUES (
        ${cuid()}, ${id}, ${String(c.legalName ?? "")}, ${String(c.dbaName ?? "")},
        ${String(c.country ?? "")}, ${tax}::jsonb,
        ${String(c.organizationType ?? "")}, ${String(c.supplierType ?? "")},
        ${String(c.website ?? "")}, ${String(c.yearEstablished ?? "")},
        ${String(c.dunsNumber ?? "")}, ${String(c.description ?? "")}
      )
      ON CONFLICT ("registrationId") DO UPDATE SET
        "legalName" = EXCLUDED."legalName",
        "dbaName" = EXCLUDED."dbaName",
        country = EXCLUDED.country,
        "taxIdentifiers" = EXCLUDED."taxIdentifiers",
        "organizationType" = EXCLUDED."organizationType",
        "supplierType" = EXCLUDED."supplierType",
        website = EXCLUDED.website,
        "yearEstablished" = EXCLUDED."yearEstablished",
        "dunsNumber" = EXCLUDED."dunsNumber",
        description = EXCLUDED.description
    `;
  }

  if (Array.isArray(data.contacts)) {
    await sql`DELETE FROM "SupplierContact" WHERE "registrationId" = ${id}`;
    let i = 0;
    for (const raw of data.contacts as Record<string, unknown>[]) {
      await sql`
        INSERT INTO "SupplierContact" (
          id, "registrationId", "firstName", "lastName", email, "jobTitle",
          phone, mobile, "isAdministrative", "requestUserAccount", "sortOrder"
        ) VALUES (
          ${cuid()}, ${id}, ${String(raw.firstName ?? "")}, ${String(raw.lastName ?? "")},
          ${String(raw.email ?? "")}, ${String(raw.jobTitle ?? "")},
          ${String(raw.phone ?? "")}, ${String(raw.mobile ?? "")},
          ${Boolean(raw.isAdministrative)}, ${Boolean(raw.requestUserAccount)}, ${i}
        )
      `;
      i++;
    }
  }

  if (Array.isArray(data.addresses)) {
    await sql`DELETE FROM "SupplierAddress" WHERE "registrationId" = ${id}`;
    let i = 0;
    for (const raw of data.addresses as Record<string, unknown>[]) {
      const purposes = Array.isArray(raw.purposes) ? (raw.purposes as string[]) : [];
      await sql`
        INSERT INTO "SupplierAddress" (
          id, "registrationId", label, line1, line2, city, region, "postalCode",
          country, phone, email, purposes, "sortOrder"
        ) VALUES (
          ${cuid()}, ${id}, ${String(raw.label ?? "")}, ${String(raw.line1 ?? "")},
          ${String(raw.line2 ?? "")}, ${String(raw.city ?? "")}, ${String(raw.region ?? "")},
          ${String(raw.postalCode ?? "")}, ${String(raw.country ?? "")},
          ${String(raw.phone ?? "")}, ${String(raw.email ?? "")},
          ${sql.array(purposes)}, ${i}
        )
      `;
      i++;
    }
  }

  if (Array.isArray(data.classifications)) {
    await sql`DELETE FROM "BusinessClassification" WHERE "registrationId" = ${id}`;
    let i = 0;
    for (const raw of data.classifications as Record<string, unknown>[]) {
      if (!String(raw.classification ?? "").trim()) continue;
      await sql`
        INSERT INTO "BusinessClassification" (
          id, "registrationId", classification, "certificateNumber", "certifyingAgency",
          "effectiveDate", "expirationDate", "sortOrder"
        ) VALUES (
          ${cuid()}, ${id}, ${String(raw.classification ?? "")},
          ${String(raw.certificateNumber ?? "")}, ${String(raw.certifyingAgency ?? "")},
          ${String(raw.effectiveDate ?? "")}, ${String(raw.expirationDate ?? "")}, ${i}
        )
      `;
      i++;
    }
  }

  if (Array.isArray(data.bankAccounts)) {
    await sql`DELETE FROM "BankAccount" WHERE "registrationId" = ${id}`;
    let i = 0;
    for (const raw of data.bankAccounts as Record<string, unknown>[]) {
      if (!String(raw.bankName ?? "").trim()) continue;
      await sql`
        INSERT INTO "BankAccount" (
          id, "registrationId", country, "bankName", "branchName", "accountName",
          "accountNumber", iban, "routingNumber", currency, "sortOrder"
        ) VALUES (
          ${cuid()}, ${id}, ${String(raw.country ?? "")}, ${String(raw.bankName ?? "")},
          ${String(raw.branchName ?? "")}, ${String(raw.accountName ?? "")},
          ${String(raw.accountNumber ?? "")}, ${String(raw.iban ?? "")},
          ${String(raw.routingNumber ?? "")}, ${String(raw.currency ?? "SAR")}, ${i}
        )
      `;
      i++;
    }
  }

  if (Array.isArray(data.productCategories)) {
    const cats = data.productCategories as string[];
    await sql`
      UPDATE "SupplierRegistration"
      SET "productCategories" = ${sql.array(cats)}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;
  }

  if (Array.isArray(data.questionnaire)) {
    for (const raw of data.questionnaire as { questionKey: string; answer: string }[]) {
      await sql`
        INSERT INTO "QuestionnaireAnswer" (id, "registrationId", "questionKey", answer)
        VALUES (${cuid()}, ${id}, ${raw.questionKey}, ${raw.answer ?? ""})
        ON CONFLICT ("registrationId", "questionKey")
        DO UPDATE SET answer = EXCLUDED.answer
      `;
    }
  }

  if (typeof data.step === "string" && data.step !== "verify") {
    await sql`
      UPDATE "SupplierRegistration"
      SET "currentStep" = ${data.step}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;
  }

  const registration = await loadRegistration(sql, id);
  return json(env, request, { ok: true, registration });
}

export async function handleSubmit(sql: Sql, env: Env, request: Request): Promise<Response> {
  const gateEmail = readEmailGate(env, sessionFrom(request));
  if (!gateEmail) {
    return json(env, request, { error: "Not authenticated — verify your email again." }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : gateEmail;
  if (email !== gateEmail) {
    return json(env, request, { error: "Email does not match verified session." }, 403);
  }

  // If they already submitted, do not create another.
  const [existing] = await sql`
    SELECT id, status, "referenceNumber" FROM "SupplierRegistration"
    WHERE lower(email) = ${email}
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;
  if (existing?.status === "SUBMITTED" || existing?.status === "APPROVED") {
    return json(env, request, {
      ok: true,
      referenceNumber: existing.referenceNumber,
      alreadySubmitted: true,
    });
  }

  const draft =
    existing?.status === "DRAFT" && existing.id
      ? await loadRegistration(sql, String(existing.id))
      : null;

  const company = (
    body.company && typeof body.company === "object"
      ? body.company
      : draft?.company && typeof draft.company === "object"
        ? draft.company
        : {}
  ) as Record<string, unknown>;
  const contacts = Array.isArray(body.contacts)
    ? (body.contacts as Record<string, unknown>[])
    : Array.isArray(draft?.contacts)
      ? (draft.contacts as Record<string, unknown>[])
      : [];
  const addresses = Array.isArray(body.addresses)
    ? (body.addresses as Record<string, unknown>[])
    : Array.isArray(draft?.addresses)
      ? (draft.addresses as Record<string, unknown>[])
      : [];
  const classifications = Array.isArray(body.classifications)
    ? (body.classifications as Record<string, unknown>[])
    : Array.isArray(draft?.classifications)
      ? (draft.classifications as Record<string, unknown>[])
      : [];
  const bankAccounts = Array.isArray(body.bankAccounts)
    ? (body.bankAccounts as Record<string, unknown>[])
    : Array.isArray(draft?.bankAccounts)
      ? (draft.bankAccounts as Record<string, unknown>[])
      : [];
  const productCategories = Array.isArray(body.productCategories)
    ? (body.productCategories as string[])
    : Array.isArray(draft?.productCategories)
      ? (draft.productCategories as string[])
      : [];
  const questionnaire = Array.isArray(body.questionnaire)
    ? (body.questionnaire as Record<string, unknown>[])
    : Array.isArray(draft?.questionnaire)
      ? (draft.questionnaire as Record<string, unknown>[])
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
    const [clash] = await sql`
      SELECT id FROM "SupplierRegistration" WHERE "referenceNumber" = ${referenceNumber} LIMIT 1
    `;
    if (!clash) break;
    referenceNumber = makeReferenceNumber();
  }

  const id = draft?.id ? String(draft.id) : cuid();

  if (draft?.id) {
    await sql`
      UPDATE "SupplierRegistration"
      SET status = 'SUBMITTED',
          "registrationComplete" = true,
          "productCategories" = ${sql.array(productCategories)},
          "referenceNumber" = ${referenceNumber},
          "currentStep" = 'done',
          "submittedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    await sql`DELETE FROM "CompanyProfile" WHERE "registrationId" = ${id}`;
    await sql`DELETE FROM "SupplierContact" WHERE "registrationId" = ${id}`;
    await sql`DELETE FROM "SupplierAddress" WHERE "registrationId" = ${id}`;
    await sql`DELETE FROM "BusinessClassification" WHERE "registrationId" = ${id}`;
    await sql`DELETE FROM "BankAccount" WHERE "registrationId" = ${id}`;
    await sql`DELETE FROM "QuestionnaireAnswer" WHERE "registrationId" = ${id}`;
  } else {
    await sql`
      INSERT INTO "SupplierRegistration"
        (id, email, status, "businessRelationship", "currentStep", "productCategories",
         "referenceNumber", "registrationComplete", "submittedAt", "createdAt", "updatedAt")
      VALUES
        (${id}, ${email}, 'SUBMITTED', 'PROSPECTIVE', 'done', ${sql.array(productCategories)},
         ${referenceNumber}, true, NOW(), NOW(), NOW())
    `;
  }

  const tax = JSON.stringify(company.taxIdentifiers ?? {});
  await sql`
    INSERT INTO "CompanyProfile" (
      id, "registrationId", "legalName", "dbaName", country, "taxIdentifiers",
      "organizationType", "supplierType", website, "yearEstablished", "dunsNumber", description
    ) VALUES (
      ${cuid()}, ${id}, ${String(company.legalName ?? "")}, ${String(company.dbaName ?? "")},
      ${String(company.country ?? "")}, ${tax}::jsonb,
      ${String(company.organizationType ?? "")}, ${String(company.supplierType ?? "")},
      ${String(company.website ?? "")}, ${String(company.yearEstablished ?? "")},
      ${String(company.dunsNumber ?? "")}, ${String(company.description ?? "")}
    )
  `;

  let i = 0;
  for (const raw of contacts) {
    await sql`
      INSERT INTO "SupplierContact" (
        id, "registrationId", "firstName", "lastName", email, "jobTitle",
        phone, mobile, "isAdministrative", "requestUserAccount", "sortOrder"
      ) VALUES (
        ${cuid()}, ${id}, ${String(raw.firstName ?? "")}, ${String(raw.lastName ?? "")},
        ${String(raw.email ?? "")}, ${String(raw.jobTitle ?? "")},
        ${String(raw.phone ?? "")}, ${String(raw.mobile ?? "")},
        ${Boolean(raw.isAdministrative)}, ${Boolean(raw.requestUserAccount)}, ${i}
      )
    `;
    i++;
  }

  i = 0;
  for (const raw of addresses) {
    const purposes = Array.isArray(raw.purposes) ? (raw.purposes as string[]) : [];
    await sql`
      INSERT INTO "SupplierAddress" (
        id, "registrationId", label, line1, line2, city, region, "postalCode",
        country, phone, email, purposes, "sortOrder"
      ) VALUES (
        ${cuid()}, ${id}, ${String(raw.label ?? "")}, ${String(raw.line1 ?? "")},
        ${String(raw.line2 ?? "")}, ${String(raw.city ?? "")}, ${String(raw.region ?? "")},
        ${String(raw.postalCode ?? "")}, ${String(raw.country ?? "")},
        ${String(raw.phone ?? "")}, ${String(raw.email ?? "")},
        ${sql.array(purposes)}, ${i}
      )
    `;
    i++;
  }

  i = 0;
  for (const raw of classifications) {
    await sql`
      INSERT INTO "BusinessClassification" (
        id, "registrationId", classification, "certificateNumber", "certifyingAgency",
        "effectiveDate", "expirationDate", "sortOrder"
      ) VALUES (
        ${cuid()}, ${id}, ${String(raw.classification ?? "")}, ${String(raw.certificateNumber ?? "")},
        ${String(raw.certifyingAgency ?? "")}, ${String(raw.effectiveDate ?? "")},
        ${String(raw.expirationDate ?? "")}, ${i}
      )
    `;
    i++;
  }

  i = 0;
  for (const raw of bankAccounts) {
    await sql`
      INSERT INTO "BankAccount" (
        id, "registrationId", country, "bankName", "branchName", "accountName",
        "accountNumber", iban, "routingNumber", currency, "sortOrder"
      ) VALUES (
        ${cuid()}, ${id}, ${String(raw.country ?? "")}, ${String(raw.bankName ?? "")},
        ${String(raw.branchName ?? "")}, ${String(raw.accountName ?? "")},
        ${String(raw.accountNumber ?? "")}, ${String(raw.iban ?? "")},
        ${String(raw.routingNumber ?? "")}, ${String(raw.currency ?? "SAR")}, ${i}
      )
    `;
    i++;
  }

  for (const raw of questionnaire) {
    const key = String(raw.questionKey ?? "");
    if (!key) continue;
    await sql`
      INSERT INTO "QuestionnaireAnswer" (id, "registrationId", "questionKey", answer)
      VALUES (${cuid()}, ${id}, ${key}, ${String(raw.answer ?? "")})
    `;
  }

  // Held portal account — cannot use vendor pages until admin Release.
  const legalName = String(company.legalName ?? "");
  const [existingVendor] = await sql`
    SELECT id FROM "VendorUser" WHERE lower(email) = ${email} LIMIT 1
  `;
  if (!existingVendor) {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await sql`
      INSERT INTO "VendorUser"
        (id, email, name, "passwordHash", "mustChangePassword", "isActive", "portalAccess",
         "registrationId", "failedAttempts", "createdAt", "updatedAt")
      VALUES
        (${cuid()}, ${email}, ${legalName}, ${passwordHash}, true, true, 'HELD',
         ${id}, 0, NOW(), NOW())
    `;
  } else {
    await sql`
      UPDATE "VendorUser"
      SET "registrationId" = COALESCE("registrationId", ${id}),
          "updatedAt" = NOW()
      WHERE id = ${existingVendor.id}
    `;
  }

  if (smtpConfigured(env)) {
    try {
      await sendSubmittedEmail(env, email, { referenceNumber, legalName });
    } catch (err) {
      console.error("[enquire] submit mail failed", err);
    }
  }

  return json(env, request, {
    ok: true,
    referenceNumber,
    registrationId: id,
    outcome: "held",
  });
}
