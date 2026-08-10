import {
  attemptAdminLogin,
  createAdminSession,
  requireAdmin,
  revokeAdminSession,
  writeAudit,
} from "./auth";
import type { Env } from "./cors";
import { json } from "./cors";
import { type Sql, cuid, loadRegistration } from "./db";
import { notifyDecision } from "./notify";
import { generateTempPassword, hashPassword } from "./password";

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
        (id, email, name, "passwordHash", "mustChangePassword", "isActive", "registrationId",
         "failedAttempts", "createdAt", "updatedAt")
      VALUES
        (${cuid()}, ${email}, ${t.name}, ${passwordHash}, true, true, ${id},
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
      v."mustChangePassword",
      v."lastLoginAt",
      v."createdAt",
      v."lockedUntil",
      v."registrationId",
      r."referenceNumber",
      r.status AS "registrationStatus",
      c."legalName" AS "companyLegalName",
      (
        SELECT COUNT(*)::int FROM "VendorSession" s
        WHERE s."vendorId" = v.id
          AND s."revokedAt" IS NULL
          AND s."expiresAt" > NOW()
      ) AS "activeSessions"
    FROM "VendorUser" v
    JOIN "SupplierRegistration" r ON r.id = v."registrationId"
    LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
    WHERE
      (${filter} = 'ALL'
        OR (${filter} = 'ACTIVE' AND v."isActive" = true)
        OR (${filter} = 'DISABLED' AND v."isActive" = false)
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
      mustChangePassword: v.mustChangePassword,
      lastLoginAt: v.lastLoginAt,
      createdAt: v.createdAt,
      lockedUntil: v.lockedUntil,
      activeSessions: v.activeSessions,
      registrationId: v.registrationId,
      companyName: v.companyLegalName || "—",
      referenceNumber: v.referenceNumber,
      registrationStatus: v.registrationStatus,
      registration: {
        id: v.registrationId,
        referenceNumber: v.referenceNumber,
        status: v.registrationStatus,
        company: v.companyLegalName ? { legalName: v.companyLegalName } : null,
      },
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

  const body = (await readJson(request)) as { isActive?: unknown } | null;
  if (!body || typeof body.isActive !== "boolean") {
    return json(env, request, { error: "isActive is required" }, 400);
  }

  const [vendor] = await sql`SELECT id, email FROM "VendorUser" WHERE id = ${id} LIMIT 1`;
  if (!vendor) return json(env, request, { error: "Account not found." }, 404);

  const { isActive } = body;
  await sql`
    UPDATE "VendorUser"
    SET "isActive" = ${isActive}, "updatedAt" = NOW()
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

  const statusRows = await sql`
    SELECT status, COUNT(*)::int AS count
    FROM "SupplierRegistration"
    GROUP BY status
  `;
  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status as string] = Number(row.count);
  }

  const [{ vendors }] = await sql`SELECT COUNT(*)::int AS vendors FROM "VendorUser"`;
  const [{ publishedJobs }] = await sql`
    SELECT COUNT(*)::int AS "publishedJobs" FROM "JobPosting" WHERE "isPublished" = true
  `;

  return json(env, request, {
    pendingRegistrations: byStatus.SUBMITTED ?? 0,
    vendors: Number(vendors),
    publishedJobs: Number(publishedJobs),
    byStatus,
  });
}
