import type { Sql } from "../../lib/sql";
import { cuid } from "../../lib/sql";

export { createSql, cuid, hashSha256, type Sql } from "../../lib/sql";

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function makeReferenceNumber(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `REG-${y}${m}${day}-${rand}`;
}

export async function loadRegistration(sql: Sql, id: string) {
  const [reg] = await sql`
    SELECT * FROM "SupplierRegistration" WHERE id = ${id} LIMIT 1
  `;
  if (!reg) return null;

  const [company] =
    await sql`SELECT * FROM "CompanyProfile" WHERE "registrationId" = ${id} LIMIT 1`;
  const contacts =
    await sql`SELECT * FROM "SupplierContact" WHERE "registrationId" = ${id} ORDER BY "sortOrder" ASC`;
  const addresses =
    await sql`SELECT * FROM "SupplierAddress" WHERE "registrationId" = ${id} ORDER BY "sortOrder" ASC`;
  const classifications =
    await sql`SELECT * FROM "BusinessClassification" WHERE "registrationId" = ${id} ORDER BY "sortOrder" ASC`;
  const bankAccounts =
    await sql`SELECT * FROM "BankAccount" WHERE "registrationId" = ${id} ORDER BY "sortOrder" ASC`;
  const questionnaire =
    await sql`SELECT * FROM "QuestionnaireAnswer" WHERE "registrationId" = ${id}`;
  const attachments =
    await sql`SELECT * FROM "RegistrationAttachment" WHERE "registrationId" = ${id}`;

  return {
    ...(reg as Record<string, unknown>),
    id: reg.id as string,
    email: reg.email as string,
    status: reg.status as string,
    referenceNumber: (reg.referenceNumber as string | null) ?? null,
    productCategories: (reg.productCategories as string[] | null) ?? [],
    company: (company as { legalName?: string; country?: string } | null) || null,
    contacts: contacts as unknown as Array<Record<string, unknown>>,
    addresses: addresses as unknown as Array<Record<string, unknown>>,
    classifications: classifications as unknown as Array<Record<string, unknown>>,
    bankAccounts: bankAccounts as unknown as Array<Record<string, unknown>>,
    questionnaire: questionnaire as unknown as Array<Record<string, unknown>>,
    attachments: attachments as unknown as Array<Record<string, unknown>>,
  };
}

export async function loadBySession(sql: Sql, sessionToken: string) {
  const [reg] = await sql`
    SELECT * FROM "SupplierRegistration"
    WHERE "sessionToken" = ${sessionToken}
      AND status IN ('DRAFT', 'SUBMITTED')
    LIMIT 1
  `;
  if (!reg) return null;
  return loadRegistration(sql, reg.id as string);
}

/** Create or return the in-progress draft for a verified email (email-gate sessions). */
export async function ensureDraftForEmail(sql: Sql, email: string) {
  const normalized = email.trim().toLowerCase();
  const [existing] = await sql`
    SELECT id FROM "SupplierRegistration"
    WHERE lower(email) = ${normalized} AND status = 'DRAFT'
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;
  if (existing) return loadRegistration(sql, String(existing.id));

  const id = cuid();
  await sql`
    INSERT INTO "SupplierRegistration"
      (id, email, status, "businessRelationship", "currentStep", "createdAt", "updatedAt")
    VALUES
      (${id}, ${normalized}, 'DRAFT', 'PROSPECTIVE', 'company', NOW(), NOW())
  `;
  await sql`
    INSERT INTO "CompanyProfile" (id, "registrationId")
    VALUES (${cuid()}, ${id})
  `;
  await sql`
    INSERT INTO "SupplierContact"
      (id, "registrationId", email, "isAdministrative", "sortOrder")
    VALUES (${cuid()}, ${id}, ${normalized}, true, 0)
  `;
  return loadRegistration(sql, id);
}
