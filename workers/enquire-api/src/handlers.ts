import { type Env, json } from "./cors";
import {
  type Sql,
  cuid,
  hashSha256,
  loadBySession,
  loadRegistration,
  makeReferenceNumber,
  timingSafeEqualHex,
} from "./db";
import { sendOtpEmail, sendSubmittedEmail, smtpConfigured } from "./mail";

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_PER_HOUR = 5;

function sessionFrom(request: Request): string | null {
  return request.headers.get("X-Enquire-Session");
}

export async function handleOtpRequest(
  sql: Sql,
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return json(env, request, { error: "Valid email is required" }, 400);
  }

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM "RegistrationOtp"
    WHERE email = ${email} AND "createdAt" > NOW() - INTERVAL '1 hour'
  `;
  if (Number(count) >= OTP_MAX_PER_HOUR) {
    return json(env, request, { error: "Too many access code requests. Try again later." }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await sql`
    INSERT INTO "RegistrationOtp" (id, email, "codeHash", "expiresAt", "createdAt")
    VALUES (${cuid()}, ${email}, ${codeHash}, ${expiresAt}, NOW())
  `;

  let [registration] = await sql`
    SELECT * FROM "SupplierRegistration"
    WHERE email = ${email} AND status = 'DRAFT'
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;

  if (!registration) {
    const id = cuid();
    await sql`
      INSERT INTO "SupplierRegistration"
        (id, email, status, "businessRelationship", "currentStep", "productCategories", "createdAt", "updatedAt")
      VALUES
        (${id}, ${email}, 'DRAFT', 'PROSPECTIVE', 'verify', ${sql.array([])}, NOW(), NOW())
    `;
    await sql`
      INSERT INTO "CompanyProfile" (id, "registrationId")
      VALUES (${cuid()}, ${id})
    `;
    await sql`
      INSERT INTO "SupplierContact"
        (id, "registrationId", email, "isAdministrative", "sortOrder")
      VALUES (${cuid()}, ${id}, ${email}, true, 0)
    `;
    registration = { id, email };
  }

  // Send mail in background so Next.js / serverless platforms don't time out waiting on SMTP.
  ctx.waitUntil(
    sendOtpEmail(env, email, code, 15).catch((err) => {
      console.error("[enquire-api] OTP mail failed", err);
    })
  );

  // Never return the plaintext OTP — it only leaves via SMTP from this Worker.
  return json(env, request, {
    ok: true,
    registrationId: registration.id,
    expiresInMinutes: 15,
  });
}

export async function handleOtpVerify(sql: Sql, env: Env, request: Request): Promise<Response> {
  const body = (await request.json()) as { email?: string; code?: string };
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code || !/^\d{6}$/.test(code)) {
    return json(env, request, { error: "Email and 6-digit code are required" }, 400);
  }

  const codeHash = await hashSha256(code);
  const [otp] = await sql`
    SELECT * FROM "RegistrationOtp"
    WHERE email = ${email}
      AND "consumedAt" IS NULL
      AND "expiresAt" > NOW()
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (!otp || !timingSafeEqualHex(String(otp.codeHash), codeHash)) {
    return json(env, request, { error: "Invalid or expired access code" }, 401);
  }

  await sql`UPDATE "RegistrationOtp" SET "consumedAt" = NOW() WHERE id = ${otp.id}`;

  let [registration] = await sql`
    SELECT * FROM "SupplierRegistration"
    WHERE email = ${email} AND status = 'DRAFT'
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;

  if (!registration) {
    const id = cuid();
    await sql`
      INSERT INTO "SupplierRegistration"
        (id, email, status, "businessRelationship", "currentStep", "productCategories", "createdAt", "updatedAt")
      VALUES (${id}, ${email}, 'DRAFT', 'PROSPECTIVE', 'company', ${sql.array([])}, NOW(), NOW())
    `;
    await sql`INSERT INTO "CompanyProfile" (id, "registrationId") VALUES (${cuid()}, ${id})`;
    await sql`
      INSERT INTO "SupplierContact" (id, "registrationId", email, "isAdministrative", "sortOrder")
      VALUES (${cuid()}, ${id}, ${email}, true, 0)
    `;
    registration = { id, currentStep: "company" };
  }

  const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  const nextStep = registration.currentStep === "verify" ? "company" : registration.currentStep;

  await sql`
    UPDATE "SupplierRegistration"
    SET "sessionToken" = ${sessionToken},
        "currentStep" = ${nextStep},
        "updatedAt" = NOW()
    WHERE id = ${registration.id}
  `;

  return json(env, request, {
    ok: true,
    registrationId: registration.id,
    currentStep: nextStep,
    sessionToken,
  });
}

export async function handleDraftGet(sql: Sql, env: Env, request: Request): Promise<Response> {
  const session = sessionFrom(request);
  if (!session) return json(env, request, { error: "Not authenticated" }, 401);
  const registration = await loadBySession(sql, session);
  if (!registration) return json(env, request, { error: "Not authenticated" }, 401);
  return json(env, request, { registration });
}

export async function handleDraftPatch(sql: Sql, env: Env, request: Request): Promise<Response> {
  const session = sessionFrom(request);
  if (!session) return json(env, request, { error: "Not authenticated" }, 401);
  const existing = await loadBySession(sql, session);
  if (!existing) return json(env, request, { error: "Not authenticated" }, 401);
  if (existing.status !== "DRAFT") {
    return json(env, request, { error: "Registration already submitted" }, 400);
  }

  const data = (await request.json()) as Record<string, unknown>;
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

export async function handleSubmit(
  sql: Sql,
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const session = sessionFrom(request);
  if (!session) return json(env, request, { error: "Not authenticated" }, 401);
  const registration = await loadBySession(sql, session);
  if (!registration) return json(env, request, { error: "Not authenticated" }, 401);

  if (registration.status !== "DRAFT") {
    return json(env, request, {
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

  await sql`
    UPDATE "SupplierRegistration"
    SET status = 'SUBMITTED',
        "referenceNumber" = ${referenceNumber},
        "currentStep" = 'done',
        "submittedAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id = ${registration.id}
  `;

  if (smtpConfigured(env)) {
    const to = String(registration.email);
    const legalName = registration.company?.legalName || "";
    ctx.waitUntil(
      sendSubmittedEmail(env, to, { referenceNumber, legalName }).catch((err) => {
        console.error("[enquire-api] submit mail failed", err);
      })
    );
  }

  return json(env, request, {
    ok: true,
    referenceNumber,
    registrationId: registration.id,
  });
}
