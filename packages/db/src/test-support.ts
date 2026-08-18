import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL_TEST;

if (!url) {
  throw new Error(
    "DATABASE_URL_TEST is not set. Point it at a local throwaway database — never at production."
  );
}

export const testPrisma = new PrismaClient({ datasources: { db: { url } } });

/**
 * Truncates every application table between tests.
 *
 * Table names come from the live catalogue rather than a hand-maintained list,
 * so a table added in a later migration is cleaned automatically instead of
 * leaking rows into the next test.
 */
export async function resetTestDatabase(): Promise<void> {
  const rows = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;
  if (rows.length === 0) return;

  const list = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
