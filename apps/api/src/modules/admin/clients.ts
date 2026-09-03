import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { requireAdmin, writeAudit } from "./auth";
import { cuid } from "./db";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Client Partners Admin Handlers ──────────────────────────────────────────

export async function handleAdminClientsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const clients = await prisma.clientPartner.findMany({
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return json(env, request, {
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      industry: c.industry,
      websiteUrl: c.websiteUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminClientGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const client = await prisma.clientPartner.findFirst({
    where: { id, deletedAt: null },
  });
  if (!client) return json(env, request, { error: "Client not found." }, 404);

  return json(env, request, {
    client: {
      id: client.id,
      name: client.name,
      logoUrl: client.logoUrl,
      industry: client.industry,
      websiteUrl: client.websiteUrl,
      sortOrder: client.sortOrder,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminClientCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    name?: string;
    logoUrl?: string;
    industry?: string;
    websiteUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const name = String(body.name ?? "").trim();
  const logoUrl = String(body.logoUrl ?? "").trim();
  const industry = String(body.industry ?? "General").trim() || "General";
  const websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;

  if (!name) return json(env, request, { error: "Client name is required." }, 400);
  if (!logoUrl) return json(env, request, { error: "Logo URL is required." }, 400);

  const highestSort = await prisma.clientPartner.findFirst({
    where: { deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : (highestSort?.sortOrder ?? -1) + 1;

  const client = await prisma.clientPartner.create({
    data: {
      id: cuid(),
      name,
      logoUrl,
      industry,
      websiteUrl,
      sortOrder,
      isActive: body.isActive !== false,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "client.created",
    entityType: "ClientPartner",
    entityId: client.id,
    metadata: { name: client.name },
  });

  return json(env, request, { ok: true, client }, 201);
}

export async function handleAdminClientUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await prisma.clientPartner.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return json(env, request, { error: "Client not found." }, 404);

  const body = (await readJson(request)) as {
    name?: string;
    logoUrl?: string;
    industry?: string;
    websiteUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const n = String(body.name).trim();
    if (!n) return json(env, request, { error: "Client name cannot be empty." }, 400);
    data.name = n;
  }
  if (body.logoUrl !== undefined) {
    const l = String(body.logoUrl).trim();
    if (!l) return json(env, request, { error: "Logo URL cannot be empty." }, 400);
    data.logoUrl = l;
  }
  if (body.industry !== undefined) {
    data.industry = String(body.industry).trim() || "General";
  }
  if (body.websiteUrl !== undefined) {
    data.websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;
  }
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.clientPartner.update({
    where: { id },
    data,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "client.updated",
    entityType: "ClientPartner",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, client: updated });
}

export async function handleAdminClientDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await prisma.clientPartner.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) return json(env, request, { error: "Client not found." }, 404);

  await prisma.clientPartner.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "client.deleted",
    entityType: "ClientPartner",
    entityId: id,
    metadata: { name: existing.name },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminClientsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { clientIds?: string[] } | null;
  if (!body || !Array.isArray(body.clientIds)) {
    return json(env, request, { error: "clientIds array is required." }, 400);
  }

  const { clientIds } = body;
  await prisma.$transaction(
    clientIds.map((id, index) =>
      prisma.clientPartner.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    action: "clients.reordered",
    entityType: "ClientPartner",
    entityId: "order",
    metadata: { count: clientIds.length },
  });

  return json(env, request, { ok: true });
}
