import { hashPassword, verifyPassword } from "../../lib/password";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  attemptVendorLogin,
  createVendorSession,
  getVendorFromSession,
  revokeVendorSession,
} from "./auth";
import { cuid } from "./db";
import { getOneForVendor, listOpenForVendor } from "./requirements";
import { prisma } from "../../lib/prisma";
import { broadcastBidUpdate } from "../bidding/live-bids";

function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

export async function handleLogin(sql: unknown, env: Env, request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid request" }, 400);
  }

  const email =
    typeof body === "object" && body && "email" in body
      ? String((body as { email?: unknown }).email ?? "")
      : "";
  const password =
    typeof body === "object" && body && "password" in body
      ? String((body as { password?: unknown }).password ?? "")
      : "";

  if (!email.includes("@") || !password) {
    return json(env, request, { error: "Email and password are required" }, 400);
  }

  const result = await attemptVendorLogin(sql, email, password);

  if (!result.ok) {
    if (result.reason === "locked") {
      const mins = Math.ceil((result.retryAfterMs ?? 0) / 60000);
      return json(
        env,
        request,
        {
          error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
        },
        429
      );
    }
    if (result.reason === "disabled") {
      return json(env, request, { error: "This account has been disabled." }, 403);
    }
    if (result.reason === "held") {
      return json(
        env,
        request,
        {
          error:
            "Account registered successfully, but vendor portal access is on hold. Wait for RVCC to release access.",
          outcome: "held",
        },
        403
      );
    }
    return json(env, request, { error: "Incorrect email or password." }, 401);
  }

  const token = await createVendorSession(
    sql,
    result.vendorId,
    request.headers.get("user-agent") ?? ""
  );

  return json(env, request, {
    ok: true,
    token,
    mustChangePassword: result.mustChangePassword,
    vendor: result.vendor,
  });
}

export async function handleLogout(sql: unknown, env: Env, request: Request): Promise<Response> {
  await revokeVendorSession(sql, vendorSessionFrom(request));
  return json(env, request, { ok: true });
}

export async function handleMe(sql: unknown, env: Env, request: Request): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);
  return json(env, request, {
    id: vendor.id,
    email: vendor.email,
    name: vendor.name,
    mustChangePassword: vendor.mustChangePassword,
    registrationId: vendor.registrationId,
    portalAccess: vendor.portalAccess,
    registrationComplete: vendor.registrationComplete,
  });
}

export async function handlePassword(sql: unknown, env: Env, request: Request): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid request" }, 400);
  }

  const currentPassword =
    typeof body === "object" && body && "currentPassword" in body
      ? String((body as { currentPassword?: unknown }).currentPassword ?? "")
      : "";
  const newPassword =
    typeof body === "object" && body && "newPassword" in body
      ? String((body as { newPassword?: unknown }).newPassword ?? "")
      : "";

  if (!currentPassword) {
    return json(env, request, { error: "Current password is required." }, 400);
  }
  if (newPassword.length < 12) {
    return json(env, request, { error: "New password must be at least 12 characters." }, 400);
  }

  const record = await prisma.vendorUser.findUnique({
    where: { id: vendor.id },
    select: { id: true, passwordHash: true },
  });
  if (!record) return json(env, request, { error: "Account not found." }, 404);

  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    return json(env, request, { error: "Current password is incorrect." }, 401);
  }

  if (await verifyPassword(newPassword, record.passwordHash)) {
    return json(env, request, { error: "New password must differ from the current one." }, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.vendorUser.update({
    where: { id: vendor.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  const currentToken = vendorSessionFrom(request);
  if (currentToken) {
    await prisma.vendorSession.updateMany({
      where: {
        vendorId: vendor.id,
        tokenHash: { not: currentToken },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  return json(env, request, { ok: true });
}

/**
 * Portal home payload: the vendor's SupplierRegistration with company summary
 * fields needed by the dashboard (no contacts/addresses dump).
 */
export async function handleDashboard(sql: unknown, env: Env, request: Request): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const vendorPayload = {
    id: vendor.id,
    email: vendor.email,
    name: vendor.name,
    mustChangePassword: vendor.mustChangePassword,
    registrationId: vendor.registrationId,
  };

  const requirements = await listOpenForVendor(sql, vendor.id);

  if (!vendor.registrationId) {
    return json(env, request, { vendor: vendorPayload, registration: null, requirements });
  }

  const registration = await prisma.supplierRegistration.findUnique({
    where: { id: vendor.registrationId },
    include: { company: true },
  });

  let companyData = null;
  if (registration?.company) {
    const tax = (registration.company.taxIdentifiers as Record<string, any>) || {};
    companyData = {
      id: registration.company.id,
      legalName: registration.company.legalName,
      dbaName: registration.company.dbaName,
      country: registration.company.country,
      website: registration.company.website,
      taxIdNumber: String(tax.taxIdNumber || ""),
      vatNumber: String(tax.vatNumber || ""),
      crNumber: String(tax.crNumber || ""),
      yearEstablished: registration.company.yearEstablished,
      dunsNumber: registration.company.dunsNumber,
    };
  }

  const registrationPayload = registration
    ? {
        id: registration.id,
        status: registration.status,
        referenceNumber: registration.referenceNumber,
        reviewNote: registration.reviewNote,
        productCategories: registration.productCategories,
        submittedAt: registration.submittedAt ? registration.submittedAt.toISOString() : null,
        reviewedAt: registration.reviewedAt ? registration.reviewedAt.toISOString() : null,
        email: registration.email,
        businessRelationship: registration.businessRelationship,
        company: companyData,
      }
    : null;

  return json(env, request, {
    vendor: vendorPayload,
    registration: registrationPayload,
    requirements,
  });
}

export async function handleRequirementsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const rows = await listOpenForVendor(sql, vendor.id);
  return json(env, request, { requirements: rows });
}

export async function handleRequirementGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const [row] = await getOneForVendor(sql, id, vendor.id);
  if (!row) {
    return json(env, request, { error: "Requirement not found." }, 404);
  }
  return json(env, request, { requirement: row });
}

export async function handleQuoteSave(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const body = (await request.json().catch(() => ({}))) as {
    newPrice?: string | null;
    remarks?: string;
    quoteFileUrl?: string;
    submit?: boolean;
  };

  const submit = body.submit === true;
  const price = body.newPrice == null ? "" : String(body.newPrice).trim();

  if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
    return json(
      env,
      request,
      { error: "Enter a price as a number with at most two decimals." },
      400
    );
  }
  if (submit && (!price || Number(price) <= 0)) {
    return json(env, request, { error: "Enter a price before submitting." }, 400);
  }

  // Re-check the deadline
  const requirement = await prisma.requirement.findFirst({
    where: {
      id: requirementId,
      status: "OPEN",
      closesAt: { gt: new Date() },
      invites: {
        some: { vendorUserId: vendor.id },
      },
    },
    select: { id: true },
  });

  if (!requirement) {
    return json(
      env,
      request,
      { error: "This requirement is closed or not available to you." },
      409
    );
  }

  const saved = await prisma.quote.upsert({
    where: {
      requirementId_vendorUserId: {
        requirementId,
        vendorUserId: vendor.id,
      },
    },
    update: {
      newPrice: price ? Number(price) : null,
      remarks: String(body.remarks ?? ""),
      status: submit ? "SUBMITTED" : "DRAFT",
      submittedAt: submit ? new Date() : undefined,
    },
    create: {
      id: cuid(),
      requirementId,
      vendorUserId: vendor.id,
      newPrice: price ? Number(price) : null,
      remarks: String(body.remarks ?? ""),
      status: submit ? "SUBMITTED" : "DRAFT",
      submittedAt: submit ? new Date() : null,
    },
    select: {
      id: true,
      status: true,
      newPrice: true,
      remarks: true,
      submittedAt: true,
    },
  });

  // Broadcast live ranking update to all connected Admin and Vendor SSE streams
  void broadcastBidUpdate(requirementId);

  return json(env, request, {
    ok: true,
    quote: {
      ...saved,
      quoteFileUrl: null,
      newPrice: saved.newPrice ? String(saved.newPrice) : null,
      submittedAt: saved.submittedAt ? saved.submittedAt.toISOString() : null,
    },
  });
}
