import postgres from "postgres";

import type { Env } from "./cors";

export type Sql = ReturnType<typeof postgres>;

export function createSql(env: Env): Sql {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing HYPERDRIVE or DATABASE_URL on enquire Worker");
  }
  return postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export function cuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashSha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

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

export type SupplierRegistrationRow = {
  id: string;
  email: string;
  status: string;
  referenceNumber?: string | null;
  currentStep?: string | null;
  productCategories?: string[] | null;
  sessionToken?: string | null;
  [key: string]: unknown;
};

export async function loadRegistration(sql: Sql, id: string) {
  const [reg] = await sql<SupplierRegistrationRow[]>`
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
    ...reg,
    company: company || null,
    contacts,
    addresses,
    classifications,
    bankAccounts,
    questionnaire,
    attachments,
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
