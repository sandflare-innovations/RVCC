import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { withTransientRetry } from "./sql";

function isPrismaPostgres(url: string): boolean {
  return /db\.prisma\.io/i.test(url);
}

function poolMax(connectionString: string): number {
  const fromEnv = Number(process.env.DB_POOL_MAX);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  // Prisma Postgres proxies drop idle sockets; a large local pool causes ECONNRESET.
  if (isPrismaPostgres(connectionString)) return 3;
  return process.env.NODE_ENV === "production" ? 10 : 5;
}

function createBaseClient() {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
  const prismaHosted = isPrismaPostgres(connectionString);

  const pool = new Pool({
    connectionString,
    max: poolMax(connectionString),
    idleTimeoutMillis: prismaHosted ? 10_000 : 30_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: true,
  });

  pool.on("error", (err) => {
    console.error("[pg] idle client error", err.message);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function hasDeletedAt(basePrisma: any, model: string): boolean {
  const delegate =
    (basePrisma as any)[model] ||
    (basePrisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
  return "deletedAt" in (delegate?.fields ?? {});
}

function buildExtendedClient(basePrisma: ReturnType<typeof createBaseClient>) {
  const withSoftDelete = basePrisma.$extends({
    name: "soft-delete-extension",
    query: {
      $allModels: {
        async delete({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            const delegate =
              (basePrisma as any)[model] ||
              (basePrisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            return delegate.update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },

        async deleteMany({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            const delegate =
              (basePrisma as any)[model] ||
              (basePrisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            return delegate.updateMany({
              where: args?.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },

        async findUnique({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            const result = await query(args);
            if (result && Boolean((result as any).deletedAt)) {
              return null;
            }
            return result;
          }
          return query(args);
        },

        async findFirst({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            args = args ? { ...args } : {};
            if (args.where?.deletedAt === undefined) {
              args.where = { ...(args.where || {}), deletedAt: null };
            }
          }
          return query(args);
        },

        async findMany({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            args = args ? { ...args } : {};
            if (args.where?.deletedAt === undefined) {
              args.where = { ...(args.where || {}), deletedAt: null };
            }
          }
          return query(args);
        },

        async count({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            args = args ? { ...args } : {};
            if (args.where?.deletedAt === undefined) {
              args.where = { ...(args.where || {}), deletedAt: null };
            }
          }
          return query(args);
        },

        async groupBy({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            args = args ? { ...args } : {};
            if (args.where?.deletedAt === undefined) {
              args.where = { ...(args.where || {}), deletedAt: null };
            }
          }
          return query(args);
        },

        async aggregate({
          model,
          args,
          query,
        }: {
          model: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          if (hasDeletedAt(basePrisma, model)) {
            args = args ? { ...args } : {};
            if (args.where?.deletedAt === undefined) {
              args.where = { ...(args.where || {}), deletedAt: null };
            }
          }
          return query(args);
        },
      },
    },
  });

  return withSoftDelete.$extends({
    name: "transient-retry",
    query: {
      async $allOperations({ args, query }: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
        return withTransientRetry(() => query(args));
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof buildExtendedClient>;

let currentClient: ExtendedClient | null = null;
let currentUrl: string | null = null;

function getPrismaInstance(): ExtendedClient {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/rvcc";
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
