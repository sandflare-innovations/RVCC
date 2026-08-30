import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let currentClient: any = null;
let currentUrl: string | null = null;

function getPrismaInstance() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
  if (currentClient && currentUrl === connectionString) {
    return currentClient;
  }
  currentUrl = connectionString;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const basePrisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  currentClient = basePrisma.$extends({
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

  return currentClient;
}

export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrismaInstance();
    const val = instance[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export type ExtendedPrismaClient = typeof prisma;

