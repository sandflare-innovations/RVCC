import { PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient({
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
      async delete({ model, args, query }) {
        if ("deletedAt" in (basePrisma as any)[model]?.fields) {
          return ((basePrisma as any)[model] as any).update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },

      async deleteMany({ model, args, query }) {
        if ("deletedAt" in (basePrisma as any)[model]?.fields) {
          return ((basePrisma as any)[model] as any).updateMany({
            where: args?.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },

      async findUnique({ model, args, query }) {
        if ("deletedAt" in (basePrisma as any)[model]?.fields) {
          const result = await query(args);
          if (result && (result as any).deletedAt !== null) {
            return null;
          }
          return result;
        }
        return query(args);
      },

      async findFirst({ model, args, query }) {
        if ("deletedAt" in (basePrisma as any)[model]?.fields) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },

      async findMany({ model, args, query }) {
        if ("deletedAt" in (basePrisma as any)[model]?.fields) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;
