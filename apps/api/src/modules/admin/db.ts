import { prisma } from "../../lib/prisma";

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
export async function loadRegistration(
  _sql: unknown,
  id: string
): Promise<RegistrationDetail | null> {
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
      vendorUsers: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
        },
      },
      reviewedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!reg) return null;

  return {
    ...reg,
    id: reg.id,
    email: reg.email,
    status: reg.status,
    referenceNumber: reg.referenceNumber ?? null,
    company: reg.company || null,
    contacts: reg.contacts as unknown as Array<Record<string, unknown>>,
    addresses: reg.addresses as unknown as Array<Record<string, unknown>>,
    classifications: reg.classifications as unknown as Array<Record<string, unknown>>,
    bankAccounts: reg.bankAccounts as unknown as Array<Record<string, unknown>>,
    questionnaire: reg.questionnaire as unknown as Array<Record<string, unknown>>,
    attachments: reg.attachments as unknown as Array<Record<string, unknown>>,
    vendorUsers: reg.vendorUsers as unknown as Array<Record<string, unknown>>,
    reviewedBy: reg.reviewedBy ? { name: reg.reviewedBy.name, email: reg.reviewedBy.email } : null,
  };
}
