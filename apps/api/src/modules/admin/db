import type { Sql } from "../../lib/sql";

export { createSql, cuid, hashSha256, type Sql } from "../../lib/sql";

export type RegistrationDetail = Record<string, unknown> & {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  company: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  classifications: Array<Record<string, unknown>>;
  bankAccounts: Array<Record<string, unknown>>;
  questionnaire: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
  vendorUsers: Array<Record<string, unknown>>;
  reviewedBy: { name: string; email: string } | null;
};

/** Full registration graph used by GET /registrations/:id and review. */
export async function loadRegistration(sql: Sql, id: string): Promise<RegistrationDetail | null> {
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
  const vendorUsers = await sql`
    SELECT id, email, name, "isActive", "mustChangePassword", "createdAt"
    FROM "VendorUser" WHERE "registrationId" = ${id}
  `;

  let reviewedBy: { name: string; email: string } | null = null;
  if (reg.reviewedById) {
    const [admin] = await sql`
      SELECT name, email FROM "AdminUser" WHERE id = ${reg.reviewedById as string} LIMIT 1
    `;
    if (admin) reviewedBy = { name: admin.name as string, email: admin.email as string };
  }

  return {
    ...(reg as Record<string, unknown>),
    id: reg.id as string,
    email: reg.email as string,
    status: reg.status as string,
    referenceNumber: (reg.referenceNumber as string | null) ?? null,
    company: (company as Record<string, unknown>) || null,
    contacts: contacts as unknown as Array<Record<string, unknown>>,
    addresses: addresses as unknown as Array<Record<string, unknown>>,
    classifications: classifications as unknown as Array<Record<string, unknown>>,
    bankAccounts: bankAccounts as unknown as Array<Record<string, unknown>>,
    questionnaire: questionnaire as unknown as Array<Record<string, unknown>>,
    attachments: attachments as unknown as Array<Record<string, unknown>>,
    vendorUsers: vendorUsers as unknown as Array<Record<string, unknown>>,
    reviewedBy,
  };
}
