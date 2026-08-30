import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createBaseClient() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function buildExtendedClient(basePrisma: ReturnType<typeof createBaseClient>) {
  return basePrisma.$extends({
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
}

type ExtendedClient = ReturnType<typeof buildExtendedClient>;

let currentClient: ExtendedClient | null = null;
let currentUrl: string | null = null;

function getPrismaInstance(): ExtendedClient {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
  if (currentClient && currentUrl === connectionString) {
    return currentClient;
  }
  currentUrl = connectionString;
  const basePrisma = createBaseClient();
  currentClient = buildExtendedClient(basePrisma);
  return currentClient;
}

export const prisma: ExtendedClient = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrismaInstance();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
}) as ExtendedClient;

export type ExtendedPrismaClient = ExtendedClient;


