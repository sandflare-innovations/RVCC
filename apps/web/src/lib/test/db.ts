import { PrismaClient } from "@prisma/client";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("TEST_DATABASE_URL is not set. Create apps/web/.env.test first.");
}

export const testPrisma = new PrismaClient({ datasources: { db: { url } } });

/** Clears admin tables between tests. Sessions cascade from users. */
export async function resetAdminTables(): Promise<void> {
  await testPrisma.$executeRawUnsafe('TRUNCATE "AdminSession", "AdminUser" CASCADE');
}
