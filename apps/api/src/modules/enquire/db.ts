import { cuid } from "../../lib/sql";
import { prisma } from "../../lib/prisma";

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

export async function loadRegistration(_sql: unknown, id: string) {
  const reg = await prisma.supplierRegistration.findUnique({
    where: { id },
    include: {
      company: true,
      contacts: { orderBy: { sortOrder: "asc" } },
      addresses: { orderBy: { sortOrder: "asc" } },
      classifications: { orderBy: { sortOrder: "asc" } },
      bankAccounts: { orderBy: { sortOrder: "asc" } },
      questionnaire: true,
      attachments: true,
    },
  });

  if (!reg) return null;

  return {
    ...reg,
    id: reg.id,
    email: reg.email,
    status: reg.status,
    referenceNumber: reg.referenceNumber ?? null,
    productCategories: reg.productCategories ?? [],
    company: reg.company || null,
    contacts: reg.contacts as unknown as Array<Record<string, unknown>>,
    addresses: reg.addresses as unknown as Array<Record<string, unknown>>,
    classifications: reg.classifications as unknown as Array<Record<string, unknown>>,
    bankAccounts: reg.bankAccounts as unknown as Array<Record<string, unknown>>,
    questionnaire: reg.questionnaire as unknown as Array<Record<string, unknown>>,
    attachments: reg.attachments as unknown as Array<Record<string, unknown>>,
  };
}

export async function loadBySession(sql: unknown, sessionToken: string) {
  const reg = await prisma.supplierRegistration.findFirst({
    where: {
      sessionToken,
      status: { in: ["DRAFT", "PENDING"] as any },
    },
  });

  if (!reg) return null;
  return loadRegistration(sql, reg.id);
}

/** Create or return the in-progress draft for a verified email (email-gate sessions). */
export async function ensureDraftForEmail(sql: unknown, email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.supplierRegistration.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
      status: "DRAFT",
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) return loadRegistration(sql, existing.id);

  const id = cuid();
  await prisma.supplierRegistration.create({
    data: {
      id,
      email: normalized,
      status: "DRAFT",
      businessRelationship: "PROSPECTIVE",
      currentStep: "company",
      company: {
        create: {
          id: cuid(),
        },
      },
      contacts: {
        create: {
          id: cuid(),
          email: normalized,
          isAdministrative: true,
          sortOrder: 0,
        },
      },
    },
  });

  return loadRegistration(sql, id);
}
