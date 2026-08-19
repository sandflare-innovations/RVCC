import { generateTempPassword, hashPassword } from "../../lib/password";

import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  attemptAdminLogin,
  createAdminSession,
  requireAdmin,
  revokeAdminSession,
  writeAudit,
} from "./auth";
import { describeAward } from "./award";
import { getIsolateCache } from "../../lib/isolate-cache";
import { createReadSql } from "../../lib/sql";
import { type Sql, cuid, loadRegistration } from "./db";
import { notifyDecision, sendRequirementMail } from "./notify";
import {
  type CreateRequirementInput,
  makeReferenceNumber,
  normaliseRequirementInput,
} from "./requirement-input";
import { type CreateVendorInput, normaliseVendorInput } from "./vendor-input";

const REVIEWABLE = new Set(["SUBMITTED"]);
const VALID_REG_STATUS = new Set(["SUBMITTED", "APPROVED", "REJECTED", "DRAFT", "ALL"]);

/** lowercase, strip non-alphanumeric, spaces to hyphens, max 80 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function handleLogin(sql: Sql, env: Env, request: Request): Promise<Response> {
  const body = (await readJson(request)) as { email?: string; password?: string } | null;
  if (!body) return json(env, request, { error: "Invalid request" }, 400);

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email.includes("@") || !password) {
    return json(env, request, { error: "Email and password are required" }, 400);
  }

  const result = await attemptAdminLogin(sql, email, password);

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
    return json(env, request, { error: "Incorrect email or password." }, 401);
  }

  const token = await createAdminSession(
    sql,
    result.adminId,
    request.headers.get("user-agent") ?? ""
  );
  await writeAudit(sql, {
    adminId: result.adminId,
    action: "admin.login",
    entityType: "AdminUser",
    entityId: result.adminId,
  });

  return json(env, request, { ok: true, token });
}

export async function handleLogout(sql: Sql, env: Env, request: Request): Promise<Response> {
  await revokeAdminSession(sql, request.headers.get("X-Admin-Session"));
  return json(env, request, { ok: true });
}

export async function handleMe(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;
  return json(env, request, {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
}

// ── Registrations ───────────────────────────────────────────────────────────

export async function handleRegistrationsList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const statusRaw = (url.searchParams.get("status") || "SUBMITTED").trim();
  const status = VALID_REG_STATUS.has(statusRaw) ? statusRaw : "SUBMITTED";
  const q = (url.searchParams.get("q") || "").trim();
  const like = `%${q}%`;

  const rows = await sql`
    SELECT
      r.id,
      r.email,
      r.status,
      r."referenceNumber",
      r."submittedAt",
      r."createdAt",
      r."updatedAt",
      r."reviewedAt",
      r."reviewNote",
      r."productCategories",
      c."legalName" AS "companyLegalName",
      c.country AS "companyCountry",
      c."dbaName" AS "companyDbaName"
    FROM "SupplierRegistration" r
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE
      (${status} = 'ALL' OR r.status = ${status})
      AND (
        ${q} = ''
        OR r.email ILIKE ${like}
        OR COALESCE(r."referenceNumber", '') ILIKE ${like}
        OR COALESCE(c."legalName", '') ILIKE ${like}
      )
    ORDER BY r."submittedAt" DESC NULLS LAST, r."updatedAt" DESC
    LIMIT 100
  `;

  return json(
    env,
    request,
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      referenceNumber: r.referenceNumber,
      submittedAt: r.submittedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      reviewedAt: r.reviewedAt,
      reviewNote: r.reviewNote,
      productCategories: r.productCategories,
      company: r.companyLegalName
        ? {
            legalName: r.companyLegalName,
            dbaName: r.companyDbaName,
            country: r.companyCountry,
          }
        : null,
    }))
  );
}

export async function handleRegistrationGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const registration = await loadRegistration(sql, id);
  if (!registration) return json(env, request, { error: "Registration not found." }, 404);
  return json(env, request, registration);
}

export async function handleRegistrationReview(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { action?: string; note?: string } | null;
  if (!body) return json(env, request, { error: "Invalid request" }, 400);

  const action = body.action;
  if (action !== "APPROVE" && action !== "REJECT") {
    return json(env, request, { error: "Invalid action" }, 400);
  }
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  if (action === "REJECT" && !note) {
    return json(env, request, { error: "A reason is required to reject." }, 400);
  }

  const registration = await loadRegistration(sql, id);
  if (!registration) return json(env, request, { error: "Registration not found." }, 404);

  if (!REVIEWABLE.has(registration.status)) {
    return json(
      env,
      request,
      {
        error: `This registration is ${registration.status.toLowerCase()} and is no longer awaiting review.`,
      },
      409
    );
  }

  const now = new Date();
  const legalName = String(
    (registration.company as { legalName?: string } | null)?.legalName ?? ""
  );
  const reference = registration.referenceNumber ?? "";
  const contacts = registration.contacts.map((c) => ({
    email: String(c.email ?? ""),
    firstName: String(c.firstName ?? ""),
    lastName: String(c.lastName ?? ""),
    requestUserAccount: Boolean(c.requestUserAccount),
  }));

  if (action === "REJECT") {
    await sql`
      UPDATE "SupplierRegistration"
      SET status = 'REJECTED',
          "reviewedAt" = ${now},
          "reviewedById" = ${admin.id},
          "reviewNote" = ${note},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    await writeAudit(sql, {
      adminId: admin.id,
      action: "registration.rejected",
      entityType: "SupplierRegistration",
      entityId: id,
      metadata: { note },
    });

    const notified = await notifyDecision(env, {
      decision: "REJECTED",
      legalName,
      referenceNumber: reference,
      reason: note ?? "",
      recipients: [{ to: registration.email }],
    });

    return json(env, request, { ok: true, status: "REJECTED", notified });
  }

  const requested = contacts.filter((c) => c.requestUserAccount && c.email);
  const targets = requested.length
    ? requested.map((c) => ({
        email: c.email,
        name: `${c.firstName} ${c.lastName}`.trim(),
      }))
    : [{ email: registration.email, name: "" }];

  const created: { email: string; tempPassword: string }[] = [];

  for (const t of targets) {
    const email = t.email.trim().toLowerCase();
    if (!email) continue;

    const [existing] = await sql`SELECT id FROM "VendorUser" WHERE email = ${email} LIMIT 1`;
    if (existing) continue;

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await sql`
      INSERT INTO "VendorUser"
        (id, email, name, "passwordHash", "mustChangePassword", "isActive", "portalAccess", "registrationId",
         "failedAttempts", "createdAt", "updatedAt")
      VALUES
        (${cuid()}, ${email}, ${t.name}, ${passwordHash}, true, true, 'HELD', ${id},
         0, NOW(), NOW())
    `;
    created.push({ email, tempPassword });
  }

  await sql`
    UPDATE "SupplierRegistration"
    SET status = 'APPROVED',
        "businessRelationship" = 'SPEND_AUTHORIZED',
        "reviewedAt" = ${now},
        "reviewedById" = ${admin.id},
        "reviewNote" = ${note},
        "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  await writeAudit(sql, {
    adminId: admin.id,
    action: "registration.approved",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: { note, accountsCreated: created.map((c) => c.email) },
  });

  const notified = await notifyDecision(env, {
    decision: "APPROVED",
    legalName,
    referenceNumber: reference,
    recipients: created.length
      ? created.map((c) => ({ to: c.email, loginEmail: c.email, tempPassword: c.tempPassword }))
      : [{ to: registration.email }],
  });

  return json(env, request, {
    ok: true,
    status: "APPROVED",
    notified,
    credentials: created,
  });
}

export async function handleRegistrationDelete(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const [registration] = await sql`
    SELECT
      r.id,
      r.email,
      r.status,
      r."referenceNumber",
      c."legalName" AS "legalName",
      (SELECT COUNT(*)::int FROM "SupplierContact" WHERE "registrationId" = r.id) AS "contacts",
      (SELECT COUNT(*)::int FROM "SupplierAddress" WHERE "registrationId" = r.id) AS "addresses",
      (SELECT COUNT(*)::int FROM "BankAccount" WHERE "registrationId" = r.id) AS "bankAccounts",
      (SELECT COUNT(*)::int FROM "VendorUser" WHERE "registrationId" = r.id) AS "vendorUsers"
    FROM "SupplierRegistration" r
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE r.id = ${id}
    LIMIT 1
  `;

  if (!registration) return json(env, request, { error: "Registration not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "registration.deleted",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: {
      email: registration.email,
      referenceNumber: registration.referenceNumber,
      legalName: registration.legalName ?? null,
      status: registration.status,
      cascaded: {
        contacts: registration.contacts,
        addresses: registration.addresses,
        bankAccounts: registration.bankAccounts,
        vendorUsers: registration.vendorUsers,
      },
    },
  });

  await sql`DELETE FROM "SupplierRegistration" WHERE id = ${id}`;
  return json(env, request, { ok: true });
}

// ── Vendors ─────────────────────────────────────────────────────────────────

export async function handleVendorsList(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") || "ACTIVE").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const like = `%${q}%`;

  const rows = await sql`
    SELECT
      v.id,
      v.email,
      v.name,
      v."isActive",
      v."portalAccess",
      v."mustChangePassword",
      v."lastLoginAt",
      v."createdAt",
      v."lockedUntil",
      v."registrationId",
      r."referenceNumber",
      r.status AS "registrationStatus",
      r."registrationComplete",
      c."legalName" AS "companyLegalName",
      (
        SELECT COUNT(*)::int FROM "VendorSession" s
        WHERE s."vendorId" = v.id
          AND s."revokedAt" IS NULL
          AND s."expiresAt" > NOW()
      ) AS "activeSessions"
    FROM "VendorUser" v
    -- LEFT JOIN, not JOIN: admin-created vendors have no registration, and an
    -- inner join would silently hide them from this list entirely.
    LEFT JOIN "SupplierRegistration" r ON r.id = v."registrationId"
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE
      (${filter} = 'ALL'
        OR (${filter} = 'ACTIVE' AND v."isActive" = true AND v."portalAccess" = 'RELEASED')
        OR (${filter} = 'DISABLED' AND (v."isActive" = false OR v."portalAccess" = 'HELD'))
        OR (${filter} = 'HELD' AND v."portalAccess" = 'HELD')
        OR (${filter} = 'RELEASED' AND v."portalAccess" = 'RELEASED')
        OR (${filter} = 'PENDING' AND v."mustChangePassword" = true))
      AND (
        ${q} = ''
        OR v.email ILIKE ${like}
        OR COALESCE(v.name, '') ILIKE ${like}
        OR COALESCE(c."legalName", '') ILIKE ${like}
      )
    ORDER BY v."createdAt" DESC
    LIMIT 100
  `;

  return json(
    env,
    request,
    rows.map((v) => ({
      id: v.id,
      email: v.email,
      name: v.name,
      isActive: v.isActive,
      portalAccess: v.portalAccess === "RELEASED" ? "RELEASED" : "HELD",
      mustChangePassword: v.mustChangePassword,
      lastLoginAt: v.lastLoginAt,
      createdAt: v.createdAt,
      lockedUntil: v.lockedUntil,
      activeSessions: v.activeSessions,
      registrationId: v.registrationId,
      companyName: v.companyLegalName || "—",
      referenceNumber: v.referenceNumber,
      registrationStatus: v.registrationStatus,
      registrationComplete: Boolean(v.registrationComplete) || v.registrationId == null,
      // Null for admin-created vendors; consumers must not assume an object.
      registration: v.registrationId
        ? {
            id: v.registrationId,
            referenceNumber: v.referenceNumber,
            status: v.registrationStatus,
            company: v.companyLegalName ? { legalName: v.companyLegalName } : null,
          }
        : null,
    }))
  );
}

export async function handleVendorPatch(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    isActive?: unknown;
    portalAccess?: unknown;
    notifyEmail?: unknown;
  } | null;
  if (!body) return json(env, request, { error: "Invalid body" }, 400);

  const [vendor] = await sql`
    SELECT v.id, v.email, v.name, v."mustChangePassword", v."portalAccess",
           c."legalName" AS "legalName"
    FROM "VendorUser" v
    LEFT JOIN "SupplierRegistration" r ON r.id = v."registrationId"
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE v.id = ${id}
    LIMIT 1
  `;
  if (!vendor) return json(env, request, { error: "Account not found." }, 404);

  // Portal Hold / Release (preferred path for User Management).
  if (body.portalAccess === "HELD" || body.portalAccess === "RELEASED") {
    const portalAccess = body.portalAccess as "HELD" | "RELEASED";
    const notifyEmail = Boolean(body.notifyEmail);

    await sql`
      UPDATE "VendorUser"
      SET "portalAccess" = ${portalAccess},
          "isActive" = true,
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    if (portalAccess === "HELD") {
      await sql`
        UPDATE "VendorSession"
        SET "revokedAt" = NOW()
        WHERE "vendorId" = ${id} AND "revokedAt" IS NULL
      `;
    }

    let notified = false;
    let tempPassword: string | undefined;
    if (portalAccess === "RELEASED" && notifyEmail) {
      const portalBase = (env.VENDOR_PORTAL_URL || "").replace(/\/$/, "");
      const portalUrl = `${portalBase || "https://portal.rvcc.local"}/login`;
      if (vendor.mustChangePassword) {
        tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        await sql`
          UPDATE "VendorUser"
          SET "passwordHash" = ${passwordHash}, "mustChangePassword" = true, "updatedAt" = NOW()
          WHERE id = ${id}
        `;
        await sql`
          UPDATE "VendorSession"
          SET "revokedAt" = NOW()
          WHERE "vendorId" = ${id} AND "revokedAt" IS NULL
        `;
      }
      try {
        const { sendAccessReleasedEmail } = await import("../mail/mail");
        await sendAccessReleasedEmail(env, String(vendor.email), {
          legalName: String(vendor.legalName || vendor.name || ""),
          portalUrl,
          loginEmail: String(vendor.email),
          tempPassword,
        });
        notified = true;
      } catch (err) {
        console.error("[vendor.release mail]", err);
      }
    }

    await writeAudit(sql, {
      adminId: admin.id,
      action: portalAccess === "RELEASED" ? "vendor.portal_released" : "vendor.portal_held",
      entityType: "VendorUser",
      entityId: id,
      metadata: { email: vendor.email, notifyEmail, notified },
    });

    return json(env, request, {
      ok: true,
      portalAccess,
      notified,
      tempPassword: notifyEmail ? tempPassword : undefined,
    });
  }

  // Legacy enable/disable — maps onto isActive and also forces HELD when disabled.
  if (typeof body.isActive !== "boolean") {
    return json(env, request, { error: "portalAccess or isActive is required" }, 400);
  }

  const { isActive } = body;
  await sql`
    UPDATE "VendorUser"
    SET "isActive" = ${isActive},
        "portalAccess" = ${isActive ? "RELEASED" : "HELD"},
        "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  if (!isActive) {
    await sql`
      UPDATE "VendorSession"
      SET "revokedAt" = NOW()
      WHERE "vendorId" = ${id} AND "revokedAt" IS NULL
    `;
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: isActive ? "vendor.enabled" : "vendor.disabled",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: vendor.email },
  });

  return json(env, request, { ok: true, isActive });
}

export async function handleRequirementsList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await sql`
    SELECT
      r.id, r."referenceNumber", r."scopeOfWork", r.project, r."sellingPrice",
      r.currency, r."closesAt", r.status, r."createdAt",
      (SELECT COUNT(*)::int FROM "RequirementInvite" i WHERE i."requirementId" = r.id) AS invited,
      (SELECT COUNT(*)::int FROM "Quote" q
        WHERE q."requirementId" = r.id AND q.status = 'SUBMITTED') AS submitted
    FROM "Requirement" r
    ORDER BY
      CASE WHEN r.status = 'OPEN' AND r."closesAt" > NOW() THEN 0 ELSE 1 END,
      r."closesAt" ASC
    LIMIT 100
  `;

  return json(env, request, rows);
}

export async function handleRequirementAward(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { quoteId?: string } | null;
  const quoteId = String(body?.quoteId ?? "");
  if (!quoteId) return json(env, request, { error: "Choose a quote to award." }, 400);

  const [requirement] = await sql`
    SELECT id, project, "referenceNumber", currency, status
    FROM "Requirement" WHERE id = ${id} LIMIT 1
  `;
  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);
  if (requirement.status === "CANCELLED") {
    return json(env, request, { error: "This requirement was cancelled." }, 409);
  }

  const quotes = await sql`
    SELECT q.id, q."newPrice", q."vendorUserId", v.email AS "vendorEmail"
    FROM "Quote" q
    JOIN "VendorUser" v ON v.id = q."vendorUserId"
    WHERE q."requirementId" = ${id} AND q.status = 'SUBMITTED'
  `;

  let described;
  try {
    described = describeAward(
      quotes.map((q) => ({
        id: String(q.id),
        newPrice: String(q.newPrice),
        vendorEmail: String(q.vendorEmail),
      })),
      quoteId
    );
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const winnerRow = quotes.find((q) => String(q.id) === quoteId)!;

  await sql.begin(async (tx) => {
    // Awarding closes the requirement early if it was still open. AWARDED is a
    // stored decision the clock cannot express, unlike "closed".
    await tx`
      UPDATE "Requirement"
      SET "awardedQuoteId" = ${quoteId},
          "awardedAt" = NOW(),
          "awardedByAdminId" = ${admin.id},
          status = 'AWARDED',
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // The winner is told. Losing suppliers are deliberately not notified —
    // that is a commercial decision for RVCC, not one this code should make.
    await tx`
      INSERT INTO "Notification" (id, "vendorUserId", type, title, body, "linkPath", "createdAt")
      VALUES (
        ${cuid()}, ${winnerRow.vendorUserId}, 'QUOTE_AWARDED',
        ${"You won " + String(requirement.project)},
        ${"RVCC awarded this work to your quote."},
        ${"/requirements/" + id},
        NOW()
      )
    `;

    // Every admin sees the decision, including staff who did not make it.
    const admins = await tx`SELECT id FROM "AdminUser" WHERE "isActive" = true`;
    for (const a of admins) {
      await tx`
        INSERT INTO "Notification" (id, "adminId", type, title, body, "linkPath", "createdAt")
        VALUES (
          ${cuid()}, ${a.id}, 'QUOTE_AWARDED',
          ${String(requirement.project) + " awarded"},
          ${"Awarded to " + described.winner.vendorEmail + " at " + described.winningPrice + " " + String(requirement.currency)},
          ${"/requirements/" + id},
          NOW()
        )
      `;
    }
  });

  // Same ordering as posting: the award is already committed, so mail failure
  // is reported, never fatal.
  await sendRequirementMail(env, {
    kind: "AWARDED",
    recipients: [described.winner.vendorEmail],
    project: String(requirement.project),
    referenceNumber: String(requirement.referenceNumber ?? ""),
    portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${id}`,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "requirement.awarded",
    entityType: "Requirement",
    entityId: id,
    metadata: {
      quoteId,
      winner: described.winner.vendorEmail,
      winningPrice: described.winningPrice,
      losingPrices: described.losingPrices,
    },
  });

  return json(env, request, { ok: true, winner: described.winner.vendorEmail });
}

export async function handleRequirementGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const [requirement] = await sql`
    SELECT
      r.id, r."referenceNumber", r."scopeOfWork", r.project, r."sellingPrice", r.currency,
      r."closesAt", r.status, r."createdAt", r."awardedAt", r."awardedQuoteId",
      a.email AS "awardedByEmail"
    FROM "Requirement" r
    LEFT JOIN "AdminUser" a ON a.id = r."awardedByAdminId"
    WHERE r.id = ${id}
    LIMIT 1
  `;
  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);

  // Only SUBMITTED quotes appear: an unsubmitted draft is not a quote.
  const quotes = await sql`
    SELECT
      q.id, q."newPrice", q.remarks, q."submittedAt",
      v.email AS "participantEmail",
      v.name AS "participantName"
    FROM "Quote" q
    JOIN "VendorUser" v ON v.id = q."vendorUserId"
    WHERE q."requirementId" = ${id} AND q.status = 'SUBMITTED'
  `;

  const invites = await sql`
    SELECT
      i.id,
      v.email,
      i."emailStatus"
    FROM "RequirementInvite" i
    JOIN "VendorUser" v ON v.id = i."vendorUserId"
    WHERE i."requirementId" = ${id}
    ORDER BY i."createdAt" ASC
  `;

  return json(env, request, {
    requirement: {
      id: requirement.id,
      referenceNumber: requirement.referenceNumber,
      scopeOfWork: requirement.scopeOfWork,
      project: requirement.project,
      sellingPrice: requirement.sellingPrice,
      currency: requirement.currency,
      closesAt: requirement.closesAt,
      status: requirement.status,
      createdAt: requirement.createdAt,
      awardedAt: requirement.awardedAt,
      awardedQuoteId: requirement.awardedQuoteId,
      awardedByAdmin: requirement.awardedByEmail
        ? { email: String(requirement.awardedByEmail) }
        : null,
    },
    quotes: quotes.map((q) => ({
      id: q.id,
      newPrice: q.newPrice,
      remarks: q.remarks,
      submittedAt: q.submittedAt,
      vendorUser: {
        email: String(q.participantEmail),
        name: q.participantName == null ? null : String(q.participantName),
      },
    })),
    invites: invites.map((i) => ({
      id: i.id,
      emailStatus: i.emailStatus,
      vendorUser: { email: String(i.email) },
    })),
  });
}

export async function handleRequirementCreate(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  // readJson consumes the body, so it is called once and both the validated
  // fields and the post flag come out of the same parsed object.
  const body = (await readJson(request)) as CreateRequirementInput & { post?: boolean };

  let input;
  try {
    input = normaliseRequirementInput(body);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  /** Defaults to posting; { post: false } saves a draft instead. */
  const post = body?.post !== false;
  const id = cuid();
  let referenceNumber: string | null = null;

  await sql.begin(async (tx) => {
    if (post) {
      // Sequence is per UTC day, matching the REQ-YYYYMMDD-NNNN format.
      const [{ count }] = await tx`
        SELECT COUNT(*)::int AS count FROM "Requirement"
        WHERE "referenceNumber" IS NOT NULL
          AND "createdAt" >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
      `;
      referenceNumber = makeReferenceNumber(new Date(), Number(count) + 1);
    }

    await tx`
      INSERT INTO "Requirement"
        (id, "referenceNumber", "scopeOfWork", project, "sellingPrice", currency,
         "closesAt", status, "createdByAdminId", "createdAt", "updatedAt")
      VALUES
        (${id}, ${referenceNumber}, ${input.scopeOfWork}, ${input.project},
         ${input.sellingPrice}, ${input.currency}, ${input.closesAt},
         ${post ? "OPEN" : "DRAFT"}, ${admin.id}, NOW(), NOW())
    `;

    for (const vendorUserId of input.vendorUserIds) {
      await tx`
        INSERT INTO "RequirementInvite" (id, "requirementId", "vendorUserId", "createdAt")
        VALUES (${cuid()}, ${id}, ${vendorUserId}, NOW())
        ON CONFLICT DO NOTHING
      `;
    }
  });

  // Mail only after the requirement is committed. A slow or failing SMTP
  // server must never roll back a saved requirement, and one bad address must
  // not stop the others — each invite records its own outcome.
  if (post && input.vendorUserIds.length > 0) {
    const invited = await sql`
      SELECT v.id, v.email FROM "VendorUser" v
      WHERE v.id = ANY(${sql.array(input.vendorUserIds)})
    `;

    const outcome = await sendRequirementMail(env, {
      kind: "POSTED",
      recipients: invited.map((v) => String(v.email)),
      project: input.project,
      scopeOfWork: input.scopeOfWork,
      referenceNumber: referenceNumber ?? "",
      closesAt: input.closesAt.toISOString(),
      portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${id}`,
    });

    if (outcome.attempted) {
      for (const v of invited) {
        const email = String(v.email);
        const failure = outcome.failed.find((f) => f.to === email);
        await sql`
          UPDATE "RequirementInvite"
          SET "emailStatus" = ${failure ? "FAILED" : "SENT"},
              "emailError" = ${failure ? failure.error : null},
              "emailedAt" = ${failure ? null : new Date()}
          WHERE "requirementId" = ${id} AND "vendorUserId" = ${String(v.id)}
        `;
      }
    }
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: post ? "requirement.posted" : "requirement.created",
    entityType: "Requirement",
    entityId: id,
    metadata: {
      project: input.project,
      closesAt: input.closesAt.toISOString(),
      invited: input.vendorUserIds.length,
    },
  });

  return json(env, request, { ok: true, requirement: { id, referenceNumber } }, 201);
}

/**
 * Creates a supplier login directly, for companies RVCC already works with and
 * who never used the public registration wizard.
 *
 * The temporary password is returned once, in this response, and is never
 * stored in plaintext, emailed, or written to the audit metadata.
 */
export async function handleVendorCreate(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let input;
  try {
    input = normaliseVendorInput((await readJson(request)) as CreateVendorInput);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const [existing] = await sql`
    SELECT id FROM "VendorUser" WHERE email = ${input.email} LIMIT 1
  `;
  if (existing) {
    return json(env, request, { error: "An account already exists for that email." }, 409);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const id = cuid();

  // registrationId is left NULL: this supplier never used the public wizard.
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO "VendorUser"
        (id, email, name, "passwordHash", "mustChangePassword", "isActive", "portalAccess",
         "failedAttempts", "createdAt", "updatedAt")
      VALUES
        (${id}, ${input.email}, ${input.name}, ${passwordHash}, true, true, 'RELEASED',
         0, NOW(), NOW())
    `;

    for (const industryId of input.industryIds) {
      // Implicit m-n join table Prisma generates for Industry <-> VendorUser:
      // "A" is Industry (alphabetically first), "B" is VendorUser.
      await tx`
        INSERT INTO "_IndustryToVendorUser" ("A", "B")
        VALUES (${industryId}, ${id})
        ON CONFLICT DO NOTHING
      `;
    }
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.created",
    entityType: "VendorUser",
    entityId: id,
    // Never the password.
    metadata: { email: input.email, industryIds: input.industryIds },
  });

  return json(
    env,
    request,
    { ok: true, vendor: { id, email: input.email, name: input.name }, tempPassword },
    201
  );
}

export async function handleVendorResetPassword(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const [vendor] = await sql`SELECT id, email FROM "VendorUser" WHERE id = ${id} LIMIT 1`;
  if (!vendor) return json(env, request, { error: "Account not found." }, 404);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await sql`
    UPDATE "VendorUser"
    SET "passwordHash" = ${passwordHash},
        "mustChangePassword" = true,
        "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  await sql`
    UPDATE "VendorSession"
    SET "revokedAt" = NOW()
    WHERE "vendorId" = ${id} AND "revokedAt" IS NULL
  `;

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.password_reset",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: vendor.email },
  });

  return json(env, request, { ok: true, email: vendor.email, tempPassword });
}

// ── Careers ─────────────────────────────────────────────────────────────────

type JobBody = {
  title?: string;
  slug?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  isRemote?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

function parseJobCreate(
  body: JobBody
): { ok: true; data: Required<JobBody> } | { ok: false; error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 2) return { ok: false, error: "Title is required." };
  const department = typeof body.department === "string" ? body.department.trim() : "";
  if (!department) return { ok: false, error: "Department is required." };
  const location = typeof body.location === "string" ? body.location.trim() : "";
  if (!location) return { ok: false, error: "Location is required." };
  const employmentType = typeof body.employmentType === "string" ? body.employmentType.trim() : "";
  if (!employmentType) return { ok: false, error: "Employment type is required." };
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) return { ok: false, error: "Description is required." };

  return {
    ok: true,
    data: {
      title,
      slug: typeof body.slug === "string" ? body.slug.trim() : "",
      department,
      location,
      employmentType,
      description,
      requirements: Array.isArray(body.requirements)
        ? body.requirements.map((s) => String(s).trim()).filter(Boolean)
        : [],
      benefits: Array.isArray(body.benefits)
        ? body.benefits.map((s) => String(s).trim()).filter(Boolean)
        : [],
      isRemote: Boolean(body.isRemote),
      isPublished: Boolean(body.isPublished),
      sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder as number) : 0,
    },
  };
}

export async function handleCareersList(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await sql`
    SELECT * FROM "JobPosting"
    ORDER BY "sortOrder" ASC, "postedAt" DESC
  `;
  return json(env, request, rows);
}

export async function handleCareerGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const [job] = await sql`SELECT * FROM "JobPosting" WHERE id = ${id} LIMIT 1`;
  if (!job) return json(env, request, { error: "Posting not found." }, 404);
  return json(env, request, job);
}

export async function handleCareerCreate(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as JobBody | null;
  if (!body) return json(env, request, { error: "Invalid request" }, 400);

  const parsed = parseJobCreate(body);
  if (!parsed.ok) return json(env, request, { error: parsed.error }, 400);

  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  if (!slug) return json(env, request, { error: "Could not derive a slug." }, 400);

  const [clash] = await sql`SELECT id FROM "JobPosting" WHERE slug = ${slug} LIMIT 1`;
  if (clash) {
    return json(env, request, { error: `The slug “${slug}” is already in use.` }, 409);
  }

  const id = cuid();
  await sql`
    INSERT INTO "JobPosting"
      (id, slug, title, department, location, "employmentType", description,
       requirements, benefits, "isRemote", "isPublished", "sortOrder",
       "createdById", "postedAt", "createdAt", "updatedAt")
    VALUES
      (${id}, ${slug}, ${data.title}, ${data.department}, ${data.location},
       ${data.employmentType}, ${data.description},
       ${sql.array(data.requirements)}, ${sql.array(data.benefits)},
       ${data.isRemote}, ${data.isPublished}, ${data.sortOrder},
       ${admin.id}, NOW(), NOW(), NOW())
  `;

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career.created",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug, title: data.title, published: data.isPublished },
  });

  return json(env, request, { ok: true, id, slug });
}

export async function handleCareerPatch(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as JobBody | null;
  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid request" }, 400);
  }

  const [existing] = await sql`SELECT * FROM "JobPosting" WHERE id = ${id} LIMIT 1`;
  if (!existing) return json(env, request, { error: "Posting not found." }, 404);

  const title = body.title !== undefined ? String(body.title).trim() : (existing.title as string);
  const department =
    body.department !== undefined
      ? String(body.department).trim()
      : (existing.department as string);
  const location =
    body.location !== undefined ? String(body.location).trim() : (existing.location as string);
  const employmentType =
    body.employmentType !== undefined
      ? String(body.employmentType).trim()
      : (existing.employmentType as string);
  const description =
    body.description !== undefined
      ? String(body.description).trim()
      : (existing.description as string);
  const requirements =
    body.requirements !== undefined
      ? body.requirements.map((s) => String(s).trim()).filter(Boolean)
      : (existing.requirements as string[]);
  const benefits =
    body.benefits !== undefined
      ? body.benefits.map((s) => String(s).trim()).filter(Boolean)
      : (existing.benefits as string[]);
  const isRemote =
    body.isRemote !== undefined ? Boolean(body.isRemote) : Boolean(existing.isRemote);
  const isPublished =
    body.isPublished !== undefined ? Boolean(body.isPublished) : Boolean(existing.isPublished);
  const sortOrder =
    body.sortOrder !== undefined && Number.isFinite(body.sortOrder)
      ? Math.trunc(body.sortOrder)
      : Number(existing.sortOrder);

  let slug = existing.slug as string;
  if (body.slug !== undefined || body.title !== undefined) {
    const next = slugify((typeof body.slug === "string" ? body.slug.trim() : "") || title);
    if (!next) return json(env, request, { error: "Could not derive a slug." }, 400);
    const [clash] = await sql`SELECT id FROM "JobPosting" WHERE slug = ${next} LIMIT 1`;
    if (clash && clash.id !== id) {
      return json(env, request, { error: `The slug “${next}” is already in use.` }, 409);
    }
    slug = next;
  }

  await sql`
    UPDATE "JobPosting"
    SET slug = ${slug},
        title = ${title},
        department = ${department},
        location = ${location},
        "employmentType" = ${employmentType},
        description = ${description},
        requirements = ${sql.array(requirements)},
        benefits = ${sql.array(benefits)},
        "isRemote" = ${isRemote},
        "isPublished" = ${isPublished},
        "sortOrder" = ${sortOrder},
        "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career.updated",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug, published: isPublished },
  });

  return json(env, request, { ok: true, slug });
}

export async function handleCareerDelete(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const [existing] = await sql`
    SELECT id, slug, title FROM "JobPosting" WHERE id = ${id} LIMIT 1
  `;
  if (!existing) return json(env, request, { error: "Posting not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career.deleted",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug: existing.slug, title: existing.title },
  });

  await sql`DELETE FROM "JobPosting" WHERE id = ${id}`;
  return json(env, request, { ok: true });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function handleDashboard(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const payload = await getIsolateCache("admin:dashboard", 15_000, async () => {
    const readSql = createReadSql(env);
    const statusRows = await readSql`
    SELECT status, COUNT(*)::int AS count
    FROM "SupplierRegistration"
    GROUP BY status
  `;
  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status as string] = Number(row.count);
  }

    const [{ vendors }] = await readSql`
    SELECT COUNT(*)::int AS vendors FROM "VendorUser" WHERE "isActive" = true
  `;
    const [{ publishedJobs }] = await readSql`
    SELECT COUNT(*)::int AS "publishedJobs" FROM "JobPosting" WHERE "isPublished" = true
  `;
    const [{ totalJobs }] = await readSql`
    SELECT COUNT(*)::int AS "totalJobs" FROM "JobPosting"
  `;

  let openCount = 0;
  let closingSoon = 0;
  let awaitingAward = 0;
  let performance: { email: string; invited: number; submitted: number; won: number }[] = [];

  try {
    const [openRow] = await readSql`
      SELECT COUNT(*)::int AS "openCount"
      FROM "Requirement"
      WHERE status = 'OPEN' AND "closesAt" > NOW()
    `;
    const [soonRow] = await readSql`
      SELECT COUNT(*)::int AS "closingSoon"
      FROM "Requirement"
      WHERE status = 'OPEN'
        AND "closesAt" > NOW()
        AND "closesAt" <= NOW() + INTERVAL '48 hours'
    `;
    const [awardRow] = await readSql`
      SELECT COUNT(*)::int AS "awaitingAward"
      FROM "Requirement"
      WHERE status = 'OPEN' AND "closesAt" <= NOW()
    `;
    openCount = Number(openRow?.openCount ?? 0);
    closingSoon = Number(soonRow?.closingSoon ?? 0);
    awaitingAward = Number(awardRow?.awaitingAward ?? 0);

    // Ninety-day supplier performance window (same as former Prisma dashboard).
    const performanceRows = await readSql`
      SELECT
        v.email,
        (
          SELECT COUNT(*)::int FROM "RequirementInvite" i
          WHERE i."vendorUserId" = v.id AND i."createdAt" >= NOW() - INTERVAL '90 days'
        ) AS invited,
        (
          SELECT COUNT(*)::int FROM "Quote" q
          WHERE q."vendorUserId" = v.id
            AND q.status = 'SUBMITTED'
            AND q."submittedAt" >= NOW() - INTERVAL '90 days'
        ) AS submitted,
        (
          SELECT COUNT(*)::int FROM "Quote" q
          JOIN "Requirement" r ON r."awardedQuoteId" = q.id
          WHERE q."vendorUserId" = v.id AND q.status = 'SUBMITTED'
        ) AS won
      FROM "VendorUser" v
      WHERE v."isActive" = true
      ORDER BY v.email ASC
      LIMIT 100
    `;
    performance = performanceRows.map((p) => ({
      email: String(p.email),
      invited: Number(p.invited),
      submitted: Number(p.submitted),
      won: Number(p.won),
    }));
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const msg = (e.message || "").toLowerCase();
    const missing =
      e.code === "42P01" ||
      e.code === "42703" ||
      (msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column")));
    if (!missing) throw err;
    console.error("[admin] dashboard sourcing schema missing", err);
  }

    return {
      pendingRegistrations: byStatus.SUBMITTED ?? 0,
      activeVendors: Number(vendors),
      vendors: Number(vendors),
      publishedJobs: Number(publishedJobs),
      totalJobs: Number(totalJobs),
      openCount,
      closingSoon,
      awaitingAward,
      byStatus,
      performance,
    };
  });

  return json(env, request, payload, 200, {
    "Cache-Control": "private, max-age=15",
  });
}

export async function handleIndustriesList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await sql`
    SELECT id, name FROM "Industry"
    WHERE "isActive" = true
    ORDER BY name ASC
  `;
  return json(
    env,
    request,
    rows.map((r) => ({ id: String(r.id), name: String(r.name) }))
  );
}
