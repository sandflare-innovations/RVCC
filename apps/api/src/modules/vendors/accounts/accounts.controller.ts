import type { Env } from "../../../config/env";
import { json, readJson } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import type { CreateVendorInput } from "../types/vendors.types";
import { VendorAccountsService } from "./accounts.service";

export async function handleVendorsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const filterRaw = url.searchParams.get("filter") || "RELEASED";
  const q = url.searchParams.get("q") || "";

  try {
    const list = await VendorAccountsService.listVendors(filterRaw, q);
    return json(env, request, list);
  } catch (err) {
    console.error("[admin vendors] list failed", err);
    return json(env, request, { error: "Database unavailable." }, 503);
  }
}

export async function handleVendorGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const vendor = await VendorAccountsService.getVendorById(id);
  if (!vendor) return json(env, request, { error: "Vendor not found." }, 404);
  return json(env, request, vendor);
}

export async function handleVendorCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let rawJson: any = {};
  try {
    rawJson = await readJson(request);
  } catch {
    return json(env, request, { error: "Invalid JSON" }, 400);
  }

  try {
    const result = await VendorAccountsService.createVendor(rawJson as CreateVendorInput, env);
    if ("conflict" in result && result.conflict) {
      return json(env, request, { error: "A vendor with this email already exists." }, 409);
    }

    await writeAudit(sql, {
      adminId: admin.id,
      action: "vendor.created",
      entityType: "VendorUser",
      entityId: result.vendorId!,
      metadata: { email: result.email, name: result.name },
    });

    return json(
      env,
      request,
      {
        ok: true,
        vendor: { id: result.vendorId, email: result.email, name: result.name },
      },
      201
    );
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleVendorPatch(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    isActive?: unknown;
    portalAccess?: unknown;
    name?: unknown;
    industryIds?: unknown;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const updated = await VendorAccountsService.patchVendor(id, {
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    portalAccess: typeof body.portalAccess === "string" ? body.portalAccess : undefined,
    name: typeof body.name === "string" ? body.name : undefined,
    industryIds: Array.isArray(body.industryIds) ? body.industryIds.map(String) : undefined,
  });

  if (!updated) return json(env, request, { error: "Vendor not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.updated",
    entityType: "VendorUser",
    entityId: id,
    metadata: {
      isActive: updated.isActive,
      portalAccess: updated.portalAccess,
      name: updated.name,
    },
  });

  return json(env, request, {
    ok: true,
    vendor: {
      id: updated.id,
      isActive: updated.isActive,
      portalAccess: updated.portalAccess,
      name: updated.name,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function handleVendorResetPassword(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const result = await VendorAccountsService.resetVendorPassword(id, env);
  if (result.notFound) return json(env, request, { error: "Vendor not found." }, 404);
  if (result.inactive) return json(env, request, { error: "Cannot reset password for disabled vendor." }, 400);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.password_reset_by_admin",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: result.email },
  });

  return json(env, request, { ok: true, email: result.email });
}

export async function handleVendorDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const deleted = await VendorAccountsService.deleteVendor(id);
  if (!deleted) return json(env, request, { error: "Vendor not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.deleted",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: deleted.email, name: deleted.name },
  });

  return json(env, request, { ok: true, deletedId: id });
}

