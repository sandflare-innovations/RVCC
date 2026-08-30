import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Enterprise Soft-Delete & Filtering Extension
 * Converts .delete() and .deleteMany() to soft-delete updates.
 * Automatically filters out records where deletedAt is NOT null on reads.
 */
export const prisma = basePrisma.$extends({
  name: "soft-delete-extension",
  query: {
    $allModels: {
      async delete({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
        if ("deletedAt" in ((basePrisma as any)[model]?.fields ?? {})) {
          return ((basePrisma as any)[model] as any).update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },

      async deleteMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
        if ("deletedAt" in ((basePrisma as any)[model]?.fields ?? {})) {
          return ((basePrisma as any)[model] as any).updateMany({
            where: args?.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },

      async findUnique({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
        if ("deletedAt" in ((basePrisma as any)[model]?.fields ?? {})) {
          const result = await query(args);
          if (result && Boolean((result as any).deletedAt)) {
            return null;
          }
          return result;
        }
        return query(args);
      },

      async findFirst({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
        if ("deletedAt" in ((basePrisma as any)[model]?.fields ?? {})) {
          args.where = { ...(args.where || {}), deletedAt: null };
        }
        return query(args);
      },

      async findMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
        if ("deletedAt" in ((basePrisma as any)[model]?.fields ?? {})) {
          args.where = { ...(args.where || {}), deletedAt: null };
        }
        return query(args);
      },
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;
