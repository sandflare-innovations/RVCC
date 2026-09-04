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

// ── Sister Concern Companies Admin Handlers ───────────────────────────────────

export async function handleAdminCompaniesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const companies = await (prisma as any).sisterCompany.findMany({
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return json(env, request, {
    companies: companies.map((c: any) => ({
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

export async function handleAdminCompanyGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const company = await (prisma as any).sisterCompany.findFirst({
    where: { id, deletedAt: null },
  });
  if (!company) return json(env, request, { error: "Company not found." }, 404);

  return json(env, request, {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      industry: company.industry,
      websiteUrl: company.websiteUrl,
      sortOrder: company.sortOrder,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminCompanyCreate(
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
  const industry = String(body.industry ?? "Sister Concern").trim() || "Sister Concern";
  const websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;

  if (!name) return json(env, request, { error: "Company name is required." }, 400);
  if (!logoUrl) return json(env, request, { error: "Company logo is required." }, 400);

  const highestSort = await (prisma as any).sisterCompany.findFirst({
    where: { deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder =
    typeof body.sortOrder === "number" ? body.sortOrder : (highestSort?.sortOrder ?? -1) + 1;

  const company = await (prisma as any).sisterCompany.create({
    data: {
      id: cuid(),
      name,
      logoUrl,
      industry,
      websiteUrl,
      sortOrder,
      isActive: body.isActive ?? true,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "sister_company.created",
    entityType: "SisterCompany",
    entityId: company.id,
    metadata: { name: company.name },
  });

  return json(env, request, { ok: true, company }, 201);
}

export async function handleAdminCompanyUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await (prisma as any).sisterCompany.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return json(env, request, { error: "Company not found." }, 404);

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
    if (!n) return json(env, request, { error: "Company name cannot be empty." }, 400);
    data.name = n;
  }
  if (body.logoUrl !== undefined) {
    const l = String(body.logoUrl).trim();
    if (!l) return json(env, request, { error: "Company logo URL cannot be empty." }, 400);
    data.logoUrl = l;
  }
  if (body.industry !== undefined) {
    data.industry = String(body.industry).trim() || "Sister Concern";
  }
  if (body.websiteUrl !== undefined) {
    data.websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;
  }
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await (prisma as any).sisterCompany.update({
    where: { id },
    data,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "sister_company.updated",
    entityType: "SisterCompany",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, company: updated });
}

export async function handleAdminCompanyDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await (prisma as any).sisterCompany.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) return json(env, request, { error: "Company not found." }, 404);

  await (prisma as any).sisterCompany.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "sister_company.deleted",
    entityType: "SisterCompany",
    entityId: id,
    metadata: { name: existing.name },
  });

  return json(env, request, { ok: true });
}

export async function handleAdminCompaniesReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { companyIds?: string[] } | null;
  const companyIds = body?.companyIds;
  if (!Array.isArray(companyIds) || companyIds.length === 0) {
    return json(env, request, { error: "companyIds array required" }, 400);
  }

  const updates = companyIds.map((id, index) =>
    (prisma as any).sisterCompany.update({
      where: { id },
      data: { sortOrder: index },
    })
  );
  await prisma.$transaction(updates);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "sister_companies.reordered",
    entityType: "SisterCompany",
    entityId: "order",
    metadata: { count: companyIds.length },
  });

  return json(env, request, { ok: true });
}
