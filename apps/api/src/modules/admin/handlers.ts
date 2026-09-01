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
import { cuid, loadRegistration } from "./db";
import { notifyDecision, sendRequirementMail } from "./notify";
import {
  type CreateRequirementInput,
  makeReferenceNumber,
  normaliseRequirementInput,
} from "./requirement-input";
import { type CreateVendorInput, normaliseVendorInput } from "./vendor-input";
import { prisma } from "../../lib/prisma";
import type { Prisma, RegistrationStatus, RequirementStatus } from "@prisma/client";

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

export async function handleLogin(sql: unknown, env: Env, request: Request): Promise<Response> {
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

  return json(env, request, { ok: true, token, admin: result.admin });
}

export async function handleLogout(sql: unknown, env: Env, request: Request): Promise<Response> {
  await revokeAdminSession(sql, request.headers.get("X-Admin-Session"));
  return json(env, request, { ok: true });
}

export async function handleMe(sql: unknown, env: Env, request: Request): Promise<Response> {
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
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const statusRaw = (url.searchParams.get("status") || "SUBMITTED").trim();
  const status = VALID_REG_STATUS.has(statusRaw) ? statusRaw : "SUBMITTED";
  const q = (url.searchParams.get("q") || "")
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 120);

  const where: Prisma.SupplierRegistrationWhereInput = {};
  if (status !== "ALL") {
    where.status = status as RegistrationStatus;
  }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { referenceNumber: { contains: q, mode: "insensitive" } },
      { company: { legalName: { contains: q, mode: "insensitive" } } },
    ];
  }

  try {
    const rows = await prisma.supplierRegistration.findMany({
      where,
      include: {
        company: {
          select: {
            legalName: true,
            country: true,
            dbaName: true,
          },
        },
      },
      orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      take: 500,
    });

    return json(
      env,
      request,
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        status: r.status,
        referenceNumber: r.referenceNumber,
        submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        reviewNote: r.reviewNote,
        productCategories: r.productCategories,
        company: r.company
          ? {
              legalName: r.company.legalName,
              dbaName: r.company.dbaName,
              country: r.company.country,
            }
          : null,
      }))
    );
  } catch (err) {
    console.error("[admin registrations] list failed", err);
    return json(env, request, { error: "Database unavailable." }, 503);
  }
}

export async function handleRegistrationGet(
  sql: unknown,
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
  sql: unknown,
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
  const contacts = registration.contacts.map((c: any) => ({
    email: String(c.email ?? ""),
    firstName: String(c.firstName ?? ""),
    lastName: String(c.lastName ?? ""),
    requestUserAccount: Boolean(c.requestUserAccount),
  }));

  if (action === "REJECT") {
    await prisma.supplierRegistration.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: now,
        reviewedById: admin.id,
        reviewNote: note,
      },
    });

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

  const requested = contacts.filter((c: any) => c.requestUserAccount && c.email);
  const targets = requested.length
    ? requested.map((c: any) => ({
        email: c.email,
        name: `${c.firstName} ${c.lastName}`.trim(),
      }))
    : [{ email: registration.email, name: "" }];

  const created: { email: string; tempPassword: string }[] = [];

  for (const t of targets) {
    const email = t.email.trim().toLowerCase();
    if (!email) continue;

    const existing = await prisma.vendorUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) continue;

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await prisma.vendorUser.create({
      data: {
        id: cuid(),
        email,
        name: t.name,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        portalAccess: "HELD",
        registrationId: id,
        failedAttempts: 0,
      },
    });
    created.push({ email, tempPassword });
  }

  await prisma.supplierRegistration.update({
    where: { id },
    data: {
      status: "APPROVED",
      businessRelationship: "SPEND_AUTHORIZED",
      reviewedAt: now,
      reviewedById: admin.id,
      reviewNote: note,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "registration.approved",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: { note, accountsCreated: created.map((c) => c.email) },
  });

  const portalBase = (env.VENDOR_PORTAL_URL || "").replace(/\/$/, "");
  const portalUrl = `${portalBase || "https://portal.rvcc.local"}/login`;

  const notified = await notifyDecision(env, {
    decision: "APPROVED",
    legalName,
    referenceNumber: reference,
    reason: note ?? "",
    recipients: created.length
      ? created.map((c) => ({
          to: c.email,
          credentials: {
            portalUrl,
            loginEmail: c.email,
            tempPassword: c.tempPassword,
          },
        }))
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
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const registration = await prisma.supplierRegistration.findUnique({
    where: { id },
    include: {
      company: { select: { legalName: true } },
      _count: {
        select: {
          contacts: true,
          addresses: true,
          bankAccounts: true,
          vendorUsers: true,
        },
      },
    },
  });

  if (!registration) return json(env, request, { error: "Registration not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "registration.deleted",
    entityType: "SupplierRegistration",
    entityId: id,
    metadata: {
      email: registration.email,
      referenceNumber: registration.referenceNumber,
      legalName: registration.company?.legalName ?? null,
      status: registration.status,
      cascaded: {
        contacts: registration._count.contacts,
        addresses: registration._count.addresses,
        bankAccounts: registration._count.bankAccounts,
        vendorUsers: registration._count.vendorUsers,
      },
    },
  });

  await prisma.companyProfile.deleteMany({ where: { registrationId: id } });
  await prisma.supplierContact.deleteMany({ where: { registrationId: id } });
  await prisma.supplierAddress.deleteMany({ where: { registrationId: id } });
  await prisma.businessClassification.deleteMany({ where: { registrationId: id } });
  await prisma.bankAccount.deleteMany({ where: { registrationId: id } });
  await prisma.questionnaireAnswer.deleteMany({ where: { registrationId: id } });
  await prisma.supplierRegistration.delete({ where: { id } });

  return json(env, request, { ok: true });
}

const VALID_VENDOR_FILTER = new Set(["ALL", "ACTIVE", "DISABLED", "HELD", "RELEASED", "PENDING"]);

// ── Vendors ─────────────────────────────────────────────────────────────────

export async function handleVendorsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const filterRaw = (url.searchParams.get("filter") || "RELEASED").trim().toUpperCase();
  const filter = VALID_VENDOR_FILTER.has(filterRaw) ? filterRaw : "RELEASED";
  const q = (url.searchParams.get("q") || "")
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 120);

  const where: Prisma.VendorUserWhereInput = {};

  if (filter === "ACTIVE") {
    where.isActive = true;
    where.portalAccess = "RELEASED";
  } else if (filter === "DISABLED") {
    where.OR = [{ isActive: false }, { portalAccess: "HELD" }];
  } else if (filter === "HELD") {
    where.portalAccess = "HELD";
  } else if (filter === "RELEASED") {
    where.portalAccess = "RELEASED";
  } else if (filter === "PENDING") {
    where.mustChangePassword = true;
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { registration: { company: { legalName: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  try {
    const rows = await prisma.vendorUser.findMany({
      where,
      include: {
        registration: {
          include: {
            company: {
              select: { legalName: true },
            },
          },
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return json(
      env,
      request,
      rows.map((v) => {
        const compName = v.registration?.company?.legalName || "—";
        const regStatus = v.registration?.status;
        const regRef = v.registration?.referenceNumber;
        const isRegComplete =
          Boolean(v.registration?.registrationComplete) || v.registrationId == null;

        return {
          id: v.id,
          email: v.email,
          name: v.name,
          isActive: v.isActive,
          portalAccess: v.portalAccess,
          mustChangePassword: v.mustChangePassword,
          lastLoginAt: v.lastLoginAt ? v.lastLoginAt.toISOString() : null,
          createdAt: v.createdAt.toISOString(),
          lockedUntil: v.lockedUntil ? v.lockedUntil.toISOString() : null,
          activeSessions: v.sessions.length,
          registrationId: v.registrationId,
          companyName: compName,
          referenceNumber: regRef,
          registrationStatus: regStatus,
          registrationComplete: isRegComplete,
          registration: v.registrationId
            ? {
                id: v.registrationId,
                referenceNumber: regRef,
                status: regStatus,
                company: compName !== "—" ? { legalName: compName } : null,
              }
            : null,
        };
      })
    );
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

  try {
    const vendor = await prisma.vendorUser.findUnique({
      where: { id },
      include: {
        registration: {
          include: {
            company: { select: { legalName: true } },
          },
        },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true },
        },
        quotes: {
          include: {
            requirement: {
              select: { id: true, project: true, referenceNumber: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        invites: {
          include: {
            requirement: {
              select: { id: true, project: true, referenceNumber: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) return json(env, request, { error: "Not Found" }, 404);

    const compName = vendor.registration?.company?.legalName || "—";
    const regStatus = vendor.registration?.status;
    const regRef = vendor.registration?.referenceNumber;

    return json(env, request, {
      vendor: {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        isActive: vendor.isActive,
        portalAccess: vendor.portalAccess,
        mustChangePassword: vendor.mustChangePassword,
        lastLoginAt: vendor.lastLoginAt ? vendor.lastLoginAt.toISOString() : null,
        createdAt: vendor.createdAt.toISOString(),
        lockedUntil: vendor.lockedUntil ? vendor.lockedUntil.toISOString() : null,
        activeSessions: vendor.sessions.length,
        registrationId: vendor.registrationId,
        companyName: compName,
        referenceNumber: regRef,
        registrationStatus: regStatus,
        registrationComplete:
          Boolean(vendor.registration?.registrationComplete) || vendor.registrationId == null,
        registration: vendor.registrationId
          ? {
              id: vendor.registrationId,
              referenceNumber: regRef,
              status: regStatus,
              company: compName !== "—" ? { legalName: compName } : null,
            }
          : null,
      },
      quotes: vendor.quotes.map((q) => ({
        id: q.id,
        newPrice: q.newPrice ? String(q.newPrice) : null,
        status: q.status,
        submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
        requirementProject: q.requirement.project,
        requirementRef: q.requirement.referenceNumber,
        requirementId: q.requirement.id,
      })),
      invites: vendor.invites.map((i) => ({
        id: i.id,
        emailStatus: i.emailStatus,
        emailedAt: i.emailedAt ? i.emailedAt.toISOString() : null,
        requirementProject: i.requirement.project,
        requirementRef: i.requirement.referenceNumber,
        requirementId: i.requirement.id,
      })),
    });
  } catch (err) {
    console.error("[admin vendor get failed]", err);
    return json(env, request, { error: "Database unavailable." }, 503);
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
    portalAccess?: unknown;
    isActive?: unknown;
    notifyEmail?: unknown;
  } | null;
  if (!body) return json(env, request, { error: "Invalid body" }, 400);

  const vendor = await prisma.vendorUser.findUnique({
    where: { id },
    include: {
      registration: {
        include: { company: { select: { legalName: true } } },
      },
    },
  });

  if (!vendor) return json(env, request, { error: "Account not found." }, 404);

  if (body.portalAccess === "HELD" || body.portalAccess === "RELEASED") {
    const portalAccess = body.portalAccess as "HELD" | "RELEASED";
    const notifyEmail = Boolean(body.notifyEmail);

    await prisma.vendorUser.update({
      where: { id },
      data: {
        portalAccess,
        isActive: true,
      },
    });

    if (portalAccess === "HELD") {
      await prisma.vendorSession.updateMany({
        where: { vendorId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    let notified = false;
    let tempPassword: string | undefined;
    if (portalAccess === "RELEASED" && notifyEmail) {
      const portalBase = (env.VENDOR_PORTAL_URL || "").replace(/\/$/, "");
      const portalUrl = `${portalBase || "https://portal.rvcc.local"}/login`;
      if (vendor.mustChangePassword) {
        tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        await prisma.vendorUser.update({
          where: { id },
          data: {
            passwordHash,
            mustChangePassword: true,
          },
        });
        await prisma.vendorSession.updateMany({
          where: { vendorId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      try {
        const { sendAccessReleasedEmail } = await import("../mail/mail");
        await sendAccessReleasedEmail(env, vendor.email, {
          legalName: vendor.registration?.company?.legalName || vendor.name || "",
          portalUrl,
          loginEmail: vendor.email,
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

  if (typeof body.isActive !== "boolean") {
    return json(env, request, { error: "portalAccess or isActive is required" }, 400);
  }

  const { isActive } = body;
  await prisma.vendorUser.update({
    where: { id },
    data: {
      isActive,
      portalAccess: isActive ? "RELEASED" : "HELD",
    },
  });

  if (!isActive) {
    await prisma.vendorSession.updateMany({
      where: { vendorId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: isActive ? "vendor.enabled" : "vendor.disabled",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: vendor.email, isActive },
  });

  return json(env, request, { ok: true, isActive });
}

export async function handleVendorResetPassword(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const vendor = await prisma.vendorUser.findUnique({
    where: { id },
    include: {
      registration: {
        include: { company: { select: { legalName: true } } },
      },
    },
  });

  if (!vendor) return json(env, request, { error: "Vendor not found." }, 404);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.vendorUser.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,
      failedAttempts: 0,
      lockedUntil: null,
      isActive: true,
      portalAccess: "RELEASED",
    },
  });

  await prisma.vendorSession.updateMany({
    where: { vendorId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.password_reset",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: vendor.email },
  });

  return json(env, request, {
    ok: true,
    email: vendor.email,
    tempPassword,
    message: "Password reset successfully.",
  });
}

// ── Requirements ────────────────────────────────────────────────────────────

export async function handleRequirementsList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const requirements = await prisma.requirement.findMany({
    include: {
      _count: { select: { invites: true, quotes: true } },
      quotes: {
        select: {
          id: true,
          newPrice: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json(
    env,
    request,
    requirements.map((r) => ({
      id: r.id,
      project: r.project,
      referenceNumber: r.referenceNumber,
      scopeOfWork: r.scopeOfWork,
      currency: r.currency,
      closesAt: r.closesAt.toISOString(),
      status: r.status,
      awardedQuoteId: r.awardedQuoteId,
      awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
      invitedCount: r._count.invites,
      quotesCount: r._count.quotes,
    }))
  );
}

export async function handleRequirementAward(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { quoteId?: string } | null;
  const quoteId = typeof body?.quoteId === "string" ? body.quoteId.trim() : "";
  if (!quoteId) return json(env, request, { error: "Choose a quote to award." }, 400);

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      quotes: {
        where: { status: "SUBMITTED" },
        include: { vendorUser: { select: { id: true, email: true } } },
      },
    },
  });

  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);
  if (requirement.status === "CANCELLED") {
    return json(env, request, { error: "This requirement was cancelled." }, 409);
  }

  let described;
  try {
    described = describeAward(
      requirement.quotes.map((q) => ({
        id: q.id,
        newPrice: q.newPrice ? String(q.newPrice) : "",
        vendorEmail: q.vendorUser.email,
      })),
      quoteId
    );
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const winnerRow = requirement.quotes.find((q) => q.id === quoteId)!;

  await prisma.requirement.update({
    where: { id },
    data: {
      awardedQuoteId: quoteId,
      awardedAt: new Date(),
      awardedByAdminId: admin.id,
      status: "AWARDED",
    },
  });

  await prisma.notification.create({
    data: {
      id: cuid(),
      vendorUserId: winnerRow.vendorUser.id,
      type: "QUOTE_AWARDED",
      title: "You won " + requirement.project,
      body: "RVCC awarded this work to your quote.",
      linkPath: "/requirements/" + id,
    },
  });

  const admins = await prisma.adminUser.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        id: cuid(),
        adminId: a.id,
        type: "QUOTE_AWARDED",
        title: requirement.project + " awarded",
        body:
          "Awarded to " +
          described.winner.vendorEmail +
          " at " +
          described.winningPrice +
          " " +
          requirement.currency,
        linkPath: "/requirements/" + id,
      })),
    });
  }

  await sendRequirementMail(env, {
    kind: "AWARDED",
    recipients: [described.winner.vendorEmail],
    project: requirement.project,
    referenceNumber: requirement.referenceNumber ?? "",
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
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      awardedByAdmin: { select: { email: true } },
      quotes: {
        include: {
          vendorUser: { select: { email: true, name: true } },
          revisions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      },
      invites: {
        include: {
          vendorUser: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);

  return json(env, request, {
    requirement: {
      id: requirement.id,
      referenceNumber: requirement.referenceNumber,
      scopeOfWork: requirement.scopeOfWork,
      project: requirement.project,
      sellingPrice: requirement.sellingPrice ? String(requirement.sellingPrice) : null,
      currency: requirement.currency,
      closesAt: requirement.closesAt.toISOString(),
      status: requirement.status,
      createdAt: requirement.createdAt.toISOString(),
      awardedAt: requirement.awardedAt ? requirement.awardedAt.toISOString() : null,
      awardedQuoteId: requirement.awardedQuoteId,
      awardedByEmail: requirement.awardedByAdmin?.email ?? null,
    },
    quotes: requirement.quotes.map((q) => ({
      id: q.id,
      newPrice: q.newPrice ? String(q.newPrice) : null,
      remarks: q.remarks,
      status: q.status,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      updatedAt: q.updatedAt.toISOString(),
      participantEmail: q.vendorUser.email,
      participantName: q.vendorUser.name,
      revisions: q.revisions.map((r) => ({
        id: r.id,
        price: r.price ? String(r.price) : null,
        amountSar: r.amountSar ? String(r.amountSar) : null,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      vendorUser: {
        email: q.vendorUser.email,
        name: q.vendorUser.name,
      },
    })),
    invites: requirement.invites.map((i) => ({
      id: i.id,
      email: i.vendorUser.email,
      emailStatus: i.emailStatus,
      vendorUser: {
        email: i.vendorUser.email,
      },
    })),
  });
}

export async function handleRequirementDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const requirement = await prisma.requirement.findUnique({
    where: { id },
  });
  if (!requirement) {
    return json(env, request, { error: "Requirement not found" }, 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.requirementInvite.deleteMany({ where: { requirementId: id } });
    await tx.quote.deleteMany({ where: { requirementId: id } });
    await tx.requirement.delete({ where: { id } });
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "requirement.delete",
    entityType: "Requirement",
    entityId: id,
    metadata: { referenceNumber: requirement.referenceNumber, project: requirement.project },
  });

  return json(env, request, { ok: true, message: "Requirement deleted successfully." });
}

export async function handleRequirementUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await prisma.requirement.findUnique({
    where: { id },
    include: { invites: true },
  });
  if (!existing) {
    return json(env, request, { error: "Requirement not found" }, 404);
  }

  let rawJson: any = {};
  try {
    rawJson = await readJson(request);
  } catch (err) {
    return json(env, request, { error: "Invalid JSON" }, 400);
  }

  let input;
  try {
    input = normaliseRequirementInput(rawJson as CreateRequirementInput);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const url = new URL(request.url);
  const post = url.searchParams.get("post") === "true" || rawJson.post === true;

  let nextStatus = existing.status;
  if (post && existing.status === "DRAFT") {
    nextStatus = "OPEN";
  }

  await prisma.$transaction(async (tx) => {
    await tx.requirement.update({
      where: { id },
      data: {
        project: input.project,
        scopeOfWork: input.scopeOfWork,
        currency: input.currency as any,
        sellingPrice: input.sellingPrice ? Number(input.sellingPrice) : null,
        closesAt: new Date(input.closesAt),
        status: nextStatus,
      },
    });

    if (input.vendorUserIds.length > 0) {
      const existingVendorIds = new Set(existing.invites.map((i) => i.vendorUserId));
      const newVendorIds = input.vendorUserIds.filter((vId) => !existingVendorIds.has(vId));
      if (newVendorIds.length > 0) {
        await tx.requirementInvite.createMany({
          data: newVendorIds.map((vId) => ({
            id: cuid(),
            requirementId: id,
            vendorUserId: vId,
          })),
        });
      }
    }
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "requirement.update",
    entityType: "Requirement",
    entityId: id,
    metadata: { project: input.project, closesAt: input.closesAt, status: nextStatus },
  });

  return json(env, request, { ok: true, message: "Requirement updated successfully." });
}

export async function handleRequirementCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let rawJson: any = {};
  try {
    rawJson = await readJson(request);
  } catch (err) {
    return json(env, request, { error: "Invalid JSON" }, 400);
  }

  let input;
  try {
    input = normaliseRequirementInput(rawJson as CreateRequirementInput);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const url = new URL(request.url);
  const post = url.searchParams.get("post") === "true" || rawJson.post === true;
  const id = cuid();
  const count = await prisma.requirement.count();
  const referenceNumber = makeReferenceNumber(new Date(), count + 1);

  await prisma.requirement.create({
    data: {
      id,
      referenceNumber,
      project: input.project,
      scopeOfWork: input.scopeOfWork,
      currency: input.currency as any,
      sellingPrice: input.sellingPrice ? Number(input.sellingPrice) : null,
      status: (post ? "OPEN" : "DRAFT") as RequirementStatus,
      closesAt: new Date(input.closesAt),
      createdByAdminId: admin.id,
      invites: {
        create: input.vendorUserIds.map((vId) => ({
          id: cuid(),
          vendorUserId: vId,
        })),
      },
    },
  });

  if (post && input.vendorUserIds.length > 0) {
    const invited = await prisma.vendorUser.findMany({
      where: { id: { in: input.vendorUserIds } },
      select: { id: true, email: true },
    });

    const outcome = await sendRequirementMail(env, {
      kind: "POSTED",
      recipients: invited.map((v) => v.email),
      project: input.project,
      scopeOfWork: input.scopeOfWork,
      referenceNumber: referenceNumber ?? "",
      closesAt: new Date(input.closesAt).toISOString(),
      portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/requirements/${id}`,
    });

    if (outcome.attempted) {
      for (const v of invited) {
        const failure = outcome.failed.find((f) => f.to === v.email);
        await prisma.requirementInvite.updateMany({
          where: { requirementId: id, vendorUserId: v.id },
          data: {
            emailStatus: failure ? "FAILED" : "SENT",
            emailError: failure ? failure.error : null,
            emailedAt: failure ? null : new Date(),
          },
        });
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
      closesAt: new Date(input.closesAt).toISOString(),
      invited: input.vendorUserIds.length,
    },
  });

  return json(env, request, { ok: true, requirement: { id, referenceNumber } }, 201);
}

export async function handleVendorCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let input;
  try {
    input = normaliseVendorInput((await readJson(request)) as CreateVendorInput);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const existing = await prisma.vendorUser.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    return json(env, request, { error: "An account already exists for that email." }, 409);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const id = cuid();

  await prisma.vendorUser.create({
    data: {
      id,
      email: input.email,
      name: input.name,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      portalAccess: "RELEASED",
      failedAttempts: 0,
      industries: {
        connect: input.industryIds.map((indId) => ({ id: indId })),
      },
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.created",
    entityType: "VendorUser",
    entityId: id,
    metadata: { email: input.email, industryIds: input.industryIds },
  });

  return json(
    env,
    request,
    { ok: true, vendor: { id, email: input.email, name: input.name }, tempPassword },
    201
  );
}

// ── Careers ─────────────────────────────────────────────────────────────────

type JobBody = {
  slug?: unknown;
  title?: unknown;
  department?: unknown;
  location?: unknown;
  employmentType?: unknown;
  description?: unknown;
  requirements?: unknown;
  benefits?: unknown;
  isRemote?: unknown;
  isPublished?: unknown;
  sortOrder?: unknown;
};

function parseJobCreate(body: JobBody) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const department = typeof body.department === "string" ? body.department.trim() : "";
  const location =
    typeof body.location === "string" ? body.location.trim() : "Riyadh, Saudi Arabia";
  const employmentType =
    typeof body.employmentType === "string" ? body.employmentType.trim() : "Full-time";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!title) return { ok: false as const, error: "Title is required" };
  if (!department) return { ok: false as const, error: "Department is required" };
  if (!description) return { ok: false as const, error: "Description is required" };

  return {
    ok: true as const,
    data: {
      slug: typeof body.slug === "string" ? body.slug.trim() : "",
      title,
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

export async function handleCareersList(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await prisma.jobPosting.findMany({
    orderBy: [{ sortOrder: "asc" }, { postedAt: "desc" }],
  });
  return json(env, request, rows);
}

export async function handleCareerGet(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const job = await prisma.jobPosting.findUnique({ where: { id } });
  if (!job) return json(env, request, { error: "Posting not found." }, 404);
  return json(env, request, job);
}

export async function handleCareerApplicationsList(
  sql: unknown,
  env: Env,
  request: Request,
  jobPostingId: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: { id: true },
  });
  if (!job) return json(env, request, { error: "Posting not found." }, 404);

  const rows = await prisma.jobApplication.findMany({
    where: { jobPostingId },
    orderBy: { createdAt: "desc" },
  });

  const applications = rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone ?? "",
    cvFileName: r.cvFileName,
    cvFileUrl: r.cvFileUrl,
    cvMimeType: r.cvMimeType ?? "application/pdf",
    createdAt: r.createdAt.toISOString(),
  }));

  return json(env, request, { applications });
}

export async function handleCareerCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as JobBody | null;
  if (!body) return json(env, request, { error: "Invalid request" }, 400);

  const parsed = parseJobCreate(body);
  if (!parsed.ok) return json(env, request, { error: parsed.error }, 400);

  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  if (!slug) return json(env, request, { error: "Could not derive a slug." }, 400);

  const clash = await prisma.jobPosting.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash) {
    return json(env, request, { error: `The slug “${slug}” is already in use.` }, 409);
  }

  const id = cuid();
  await prisma.jobPosting.create({
    data: {
      id,
      slug,
      title: data.title,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType,
      description: data.description,
      requirements: data.requirements,
      benefits: data.benefits,
      isRemote: data.isRemote,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
      createdById: admin.id,
    },
  });

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
  sql: unknown,
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

  const existing = await prisma.jobPosting.findUnique({ where: { id } });
  if (!existing) return json(env, request, { error: "Posting not found." }, 404);

  const title = body.title !== undefined ? String(body.title).trim() : existing.title;
  const department =
    body.department !== undefined ? String(body.department).trim() : existing.department;
  const location = body.location !== undefined ? String(body.location).trim() : existing.location;
  const employmentType =
    body.employmentType !== undefined
      ? String(body.employmentType).trim()
      : existing.employmentType;
  const description =
    body.description !== undefined ? String(body.description).trim() : existing.description;
  const requirements =
    body.requirements !== undefined
      ? (body.requirements as string[]).map((s) => String(s).trim()).filter(Boolean)
      : existing.requirements;
  const benefits =
    body.benefits !== undefined
      ? (body.benefits as string[]).map((s) => String(s).trim()).filter(Boolean)
      : existing.benefits;
  const isRemote = body.isRemote !== undefined ? Boolean(body.isRemote) : existing.isRemote;
  const isPublished =
    body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;
  const sortOrder =
    body.sortOrder !== undefined && Number.isFinite(body.sortOrder)
      ? Math.trunc(body.sortOrder as number)
      : existing.sortOrder;

  let slug = existing.slug;
  if (body.slug !== undefined || body.title !== undefined) {
    const next = slugify((typeof body.slug === "string" ? body.slug.trim() : "") || title);
    if (!next) return json(env, request, { error: "Could not derive a slug." }, 400);
    const clash = await prisma.jobPosting.findUnique({
      where: { slug: next },
      select: { id: true },
    });
    if (clash && clash.id !== id) {
      return json(env, request, { error: `The slug “${next}” is already in use.` }, 409);
    }
    slug = next;
  }

  await prisma.jobPosting.update({
    where: { id },
    data: {
      slug,
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      benefits,
      isRemote,
      isPublished,
      sortOrder,
    },
  });

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
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const existing = await prisma.jobPosting.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) return json(env, request, { error: "Posting not found." }, 404);

  await writeAudit(sql, {
    adminId: admin.id,
    action: "career.deleted",
    entityType: "JobPosting",
    entityId: id,
    metadata: { slug: existing.slug, title: existing.title },
  });

  await prisma.jobApplication.deleteMany({ where: { jobPostingId: id } });
  await prisma.jobPosting.delete({ where: { id } });
  return json(env, request, { ok: true });
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export async function handleDashboard(sql: unknown, env: Env, request: Request): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  try {
    const statusGroups = await prisma.supplierRegistration.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      byStatus[group.status] = group._count.status;
    }

    const vendorsCount = await prisma.vendorUser.count({ where: { isActive: true } });
    const publishedJobs = await prisma.jobPosting.count({ where: { isPublished: true } });
    const totalJobs = await prisma.jobPosting.count();

    const now = new Date();
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const openCount = await prisma.requirement.count({
      where: { status: "OPEN", closesAt: { gt: now } },
    });
    const closingSoon = await prisma.requirement.count({
      where: {
        status: "OPEN",
        closesAt: { gt: now, lte: in48Hours },
      },
    });
    const awaitingAward = await prisma.requirement.count({
      where: { status: "OPEN", closesAt: { lte: now } },
    });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const activeVendors = await prisma.vendorUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        invites: {
          where: { createdAt: { gte: ninetyDaysAgo } },
          select: { id: true },
        },
        quotes: {
          where: { status: "SUBMITTED" },
          select: {
            id: true,
            submittedAt: true,
            awardedFor: { select: { id: true } },
          },
        },
      },
      orderBy: { email: "asc" },
      take: 100,
    });

    const performance = activeVendors.map((v) => {
      const invited = v.invites.length;
      const submitted = v.quotes.filter(
        (q) => q.submittedAt && q.submittedAt >= ninetyDaysAgo
      ).length;
      const won = v.quotes.filter((q) => q.awardedFor != null).length;
      return {
        email: v.email,
        invited,
        submitted,
        won,
      };
    });

    const recentQuotesRows = await prisma.quote.findMany({
      where: { status: "SUBMITTED" },
      include: {
        vendorUser: { select: { name: true, email: true } },
        requirement: { select: { id: true, project: true } },
      },
      orderBy: { submittedAt: { sort: "desc", nulls: "last" } },
      take: 5,
    });

    const recentQuotes = recentQuotesRows.map((q) => ({
      id: q.id,
      newPrice: Number(q.newPrice) || 0,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      vendorName: q.vendorUser?.name || "Unknown Vendor",
      vendorEmail: q.vendorUser?.email || "",
      requirementId: q.requirement.id,
      requirementTitle: q.requirement.project,
    }));

    const payload = {
      pendingRegistrations: byStatus.SUBMITTED ?? 0,
      activeVendors: vendorsCount,
      vendors: vendorsCount,
      publishedJobs,
      totalJobs,
      openCount,
      closingSoon,
      awaitingAward,
      byStatus,
      performance,
      recentQuotes,
    };

    return json(env, request, payload, 200, {
      "Cache-Control": "private, max-age=15",
    });
  } catch (err) {
    console.error("[admin dashboard failed]", err);
    return json(env, request, { error: "Database unavailable." }, 503);
  }
}

export async function handleIndustriesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await prisma.industry.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return json(
    env,
    request,
    rows.map((r) => ({ id: r.id, name: r.name }))
  );
}
