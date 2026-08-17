import { hashPassword, verifyPassword } from "../../lib/password";

import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  attemptVendorLogin,
  createVendorSession,
  getVendorFromSession,
  revokeAllVendorSessions,
  revokeVendorSession,
  vendorSessionFrom,
} from "./auth";
import { type Sql, cuid } from "./db";
import { getOneForVendor, listOpenForVendor } from "./requirements";

export async function handleLogin(sql: Sql, env: Env, request: Request): Promise<Response> {
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
  });
}

export async function handleLogout(sql: Sql, env: Env, request: Request): Promise<Response> {
  await revokeVendorSession(sql, vendorSessionFrom(request));
  return json(env, request, { ok: true });
}

export async function handleMe(sql: Sql, env: Env, request: Request): Promise<Response> {
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

export async function handlePassword(sql: Sql, env: Env, request: Request): Promise<Response> {
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

  const [record] = await sql`
    SELECT id, "passwordHash" FROM "VendorUser" WHERE id = ${vendor.id} LIMIT 1
  `;
  if (!record) return json(env, request, { error: "Account not found." }, 404);

  if (!(await verifyPassword(currentPassword, String(record.passwordHash)))) {
    return json(env, request, { error: "Current password is incorrect." }, 401);
  }

  if (await verifyPassword(newPassword, String(record.passwordHash))) {
    return json(env, request, { error: "New password must differ from the current one." }, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await sql`
    UPDATE "VendorUser"
    SET "passwordHash" = ${passwordHash},
        "mustChangePassword" = false,
        "updatedAt" = NOW()
    WHERE id = ${vendor.id}
  `;

  /*
   * Sign out every other device. If the temporary password leaked in transit,
   * changing it must actually evict whoever else used it.
   */
  await revokeAllVendorSessions(sql, vendor.id, vendorSessionFrom(request));

  return json(env, request, { ok: true });
}

/**
 * Portal home payload: the vendor's SupplierRegistration with company summary
 * fields needed by the dashboard (no contacts/addresses dump).
 */
export async function handleDashboard(sql: Sql, env: Env, request: Request): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const vendorPayload = {
    id: vendor.id,
    email: vendor.email,
    name: vendor.name,
    mustChangePassword: vendor.mustChangePassword,
    registrationId: vendor.registrationId,
  };

  if (!vendor.registrationId) {
    return json(env, request, { vendor: vendorPayload, registration: null });
  }

  const [registration] = await sql`
    SELECT
      r.id,
      r.status,
      r."referenceNumber",
      r."reviewNote",
      r."productCategories",
      r."submittedAt",
      r."reviewedAt",
      r.email,
      r."businessRelationship",
      c.id AS "companyId",
      c."legalName" AS "companyLegalName",
      c."dbaName" AS "companyDbaName",
      c.country AS "companyCountry",
      c."organizationType" AS "companyOrganizationType",
      c.website AS "companyWebsite"
    FROM "SupplierRegistration" r
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE r.id = ${vendor.registrationId}
    LIMIT 1
  `;

  if (!registration) {
    return json(env, request, { vendor: vendorPayload, registration: null });
  }

  return json(env, request, {
    vendor: vendorPayload,
    registration: {
      id: registration.id,
      status: registration.status,
      referenceNumber: registration.referenceNumber,
      reviewNote: registration.reviewNote,
      productCategories: registration.productCategories ?? [],
      submittedAt: registration.submittedAt,
      reviewedAt: registration.reviewedAt,
      email: registration.email,
      businessRelationship: registration.businessRelationship,
      company: registration.companyId
        ? {
            legalName: String(registration.companyLegalName ?? ""),
            dbaName: String(registration.companyDbaName ?? ""),
            country: String(registration.companyCountry ?? ""),
            organizationType: String(registration.companyOrganizationType ?? ""),
            website: String(registration.companyWebsite ?? ""),
          }
        : null,
    },
  });
}

// ── Requirements and quotes ─────────────────────────────────────────────────

export async function handleRequirementsList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  return json(env, request, await listOpenForVendor(sql, vendor.id));
}

export async function handleRequirementGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const [row] = await getOneForVendor(sql, id, vendor.id);
  // Not invited reads as not found: confirming a requirement exists would leak
  // that RVCC is running one.
  if (!row) return json(env, request, { error: "Requirement not found." }, 404);

  return json(env, request, row);
}

export async function handleQuoteSave(
  sql: Sql,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const body = (await request.json().catch(() => ({}))) as {
    newPrice?: string | null;
    remarks?: string;
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

  // Re-check the deadline in the same request that writes. The countdown on
  // screen is display only; the browser clock is never trusted.
  const [requirement] = await sql`
    SELECT r.id FROM "Requirement" r
    JOIN "RequirementInvite" i ON i."requirementId" = r.id AND i."vendorUserId" = ${vendor.id}
    WHERE r.id = ${requirementId} AND r.status = 'OPEN' AND r."closesAt" > NOW()
    LIMIT 1
  `;
  if (!requirement) {
    return json(
      env,
      request,
      { error: "This requirement is closed or not available to you." },
      409
    );
  }

  // The unique constraint makes this an upsert, so a double-clicked submit
  // cannot create two quotes.
  const [saved] = await sql`
    INSERT INTO "Quote"
      (id, "requirementId", "vendorUserId", "newPrice", remarks, status, "submittedAt", "createdAt", "updatedAt")
    VALUES
      (${cuid()}, ${requirementId}, ${vendor.id}, ${price || null}, ${String(body.remarks ?? "")},
       ${submit ? "SUBMITTED" : "DRAFT"}, ${submit ? new Date() : null}, NOW(), NOW())
    ON CONFLICT ("requirementId", "vendorUserId") DO UPDATE SET
      "newPrice"    = EXCLUDED."newPrice",
      remarks       = EXCLUDED.remarks,
      status        = EXCLUDED.status,
      "submittedAt" = COALESCE(EXCLUDED."submittedAt", "Quote"."submittedAt"),
      "updatedAt"   = NOW()
    RETURNING id, status, "newPrice", remarks, "submittedAt"
  `;

  return json(env, request, { ok: true, quote: saved });
}
