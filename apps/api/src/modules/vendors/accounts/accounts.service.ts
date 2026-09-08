import type { PortalAccess, Prisma } from "@prisma/client";
import type { Env } from "../../../config/env";
import { generateTempPassword, hashPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { sendAccessReleasedEmail } from "../../mail/mail";
import type { CreateVendorInput, NormalisedVendorInput } from "../types/vendors.types";

const VALID_VENDOR_FILTER = new Set(["ALL", "ACTIVE", "DISABLED", "HELD", "RELEASED", "PENDING"]);

export function normaliseVendorInput(input: CreateVendorInput): NormalisedVendorInput {
  const email = String(input?.email ?? "").trim().toLowerCase();
  const name = String(input?.name ?? "").trim();

  if (!email) throw new Error("An email is required.");
  if (!name) throw new Error("A name is required.");

  return {
    email,
    name,
    company: String(input.company ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    industryIds: Array.isArray(input.industryIds) ? input.industryIds : [],
  };
}

export class VendorAccountsService {
  /**
   * List vendor accounts with filtering
   */
  static async listVendors(filterRaw?: string, q?: string) {
    const filter = VALID_VENDOR_FILTER.has((filterRaw || "").toUpperCase())
      ? (filterRaw || "").toUpperCase()
      : "RELEASED";
    const cleanQ = (q || "").replace(/[\0-\x1f\x7f]/g, "").trim().slice(0, 120);

    const where: Prisma.VendorUserWhereInput = { deletedAt: null };

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

    if (cleanQ) {
      where.AND = [
        {
          OR: [
            { email: { contains: cleanQ, mode: "insensitive" } },
            { name: { contains: cleanQ, mode: "insensitive" } },
            { registration: { company: { legalName: { contains: cleanQ, mode: "insensitive" } } } },
          ],
        },
      ];
    }

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

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      isActive: r.isActive,
      portalAccess: r.portalAccess,
      mustChangePassword: r.mustChangePassword,
      lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      lockedUntil: r.lockedUntil ? r.lockedUntil.toISOString() : null,
      registrationId: r.registrationId,
      companyName: r.registration?.company?.legalName ?? null,
      referenceNumber: r.registration?.referenceNumber ?? null,
      registrationStatus: r.registration?.status ?? null,
      registrationComplete: Boolean(r.registration?.registrationComplete) || r.registrationId == null,
      activeSessions: r.sessions.length,
      registration: r.registration
        ? {
            id: r.registration.id,
            referenceNumber: r.registration.referenceNumber,
            status: r.registration.status,
            company: r.registration.company,
          }
        : null,
    }));
  }

  /**
   * Get single vendor detail with full graph
   */
  static async getVendorById(id: string) {
    const vendor = await prisma.vendorUser.findFirst({
      where: { id, deletedAt: null },
      include: {
        industries: true,
        registration: {
          include: {
            company: true,
            contacts: { orderBy: { sortOrder: "asc" } },
            bankAccounts: { orderBy: { sortOrder: "asc" } },
            classifications: { orderBy: { sortOrder: "asc" } },
            attachments: true,
          },
        },
        quotes: {
          include: {
            requirement: {
              select: {
                id: true,
                project: true,
                referenceNumber: true,
                currency: true,
                status: true,
                closesAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        invites: {
          include: {
            requirement: {
              select: {
                id: true,
                project: true,
                referenceNumber: true,
                status: true,
                closesAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        loginHistory: {
          orderBy: { loginAt: "desc" },
          take: 10,
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!vendor) return null;

    const vendorObj = {
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      isActive: vendor.isActive,
      portalAccess: vendor.portalAccess,
      mustChangePassword: vendor.mustChangePassword,
      lastLoginAt: vendor.lastLoginAt ? vendor.lastLoginAt.toISOString() : null,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
      lockedUntil: vendor.lockedUntil ? vendor.lockedUntil.toISOString() : null,
      registrationId: vendor.registrationId,
      companyName: vendor.registration?.company?.legalName ?? null,
      referenceNumber: vendor.registration?.referenceNumber ?? null,
      registrationStatus: vendor.registration?.status ?? null,
      registrationComplete: Boolean(vendor.registration?.registrationComplete) || vendor.registrationId == null,
      activeSessions: vendor.sessions.length,
      industries: vendor.industries.map((i) => ({ id: i.id, name: i.name, slug: i.slug })),
      loginHistory: vendor.loginHistory.map((h) => ({
        id: h.id,
        ipAddress: h.ipAddress,
        userAgent: h.userAgent,
        status: h.status,
        failureReason: h.failureReason,
        loginAt: h.loginAt.toISOString(),
      })),
      registration: vendor.registration
        ? {
            id: vendor.registration.id,
            status: vendor.registration.status,
            referenceNumber: vendor.registration.referenceNumber,
            productCategories: vendor.registration.productCategories,
            company: vendor.registration.company,
            contacts: vendor.registration.contacts,
            bankAccounts: vendor.registration.bankAccounts,
            classifications: vendor.registration.classifications,
            attachments: vendor.registration.attachments,
          }
        : null,
    };

    const quotes = vendor.quotes.map((q) => ({
      id: q.id,
      newPrice: q.newPrice ? String(q.newPrice) : null,
      amountSar: q.amountSar ? String(q.amountSar) : null,
      currency: q.currency,
      status: q.status,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      requirementProject: q.requirement.project,
      requirementRef: q.requirement.referenceNumber,
      requirementId: q.requirement.id,
      requirement: q.requirement,
    }));

    const invites = vendor.invites.map((i) => ({
      id: i.id,
      emailStatus: i.emailStatus,
      emailedAt: i.createdAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
      requirementProject: i.requirement.project,
      requirementRef: i.requirement.referenceNumber,
      requirementId: i.requirement.id,
      requirement: i.requirement,
    }));

    return {
      vendor: vendorObj,
      quotes,
      invites,
    };
  }

  /**
   * Delete vendor account (soft-delete)
   */
  static async deleteVendor(id: string) {
    const existing = await prisma.vendorUser.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, name: true },
    });

    if (!existing) return null;

    await prisma.$transaction([
      prisma.vendorUser.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          portalAccess: "HELD",
        },
      }),
      prisma.vendorSession.updateMany({
        where: { vendorId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return existing;

  }

  /**
   * Create vendor manually
   */
  static async createVendor(
    input: CreateVendorInput,
    env: Env
  ) {
    const normalised = normaliseVendorInput(input);
    const existing = await prisma.vendorUser.findUnique({
      where: { email: normalised.email },
    });
    if (existing) return { conflict: true };

    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);
    const vendorId = cuid();

    await prisma.$transaction(async (tx) => {
      let registrationId: string | undefined;

      if (normalised.company) {
        registrationId = cuid();
        await tx.supplierRegistration.create({
          data: {
            id: registrationId,
            email: normalised.email,
            status: "APPROVED",
            registrationComplete: true,
            company: {
              create: { legalName: normalised.company },
            },
            contacts: {
              create: {
                firstName: normalised.name,
                email: normalised.email,
                phone: normalised.phone,
                isAdministrative: true,
              },
            },
          },
        });
      }

      await tx.vendorUser.create({
        data: {
          id: vendorId,
          email: normalised.email,
          name: normalised.name,
          passwordHash: hash,
          mustChangePassword: true,
          isActive: true,
          portalAccess: "RELEASED",
          registrationId,
          industries: normalised.industryIds.length
            ? { connect: normalised.industryIds.map((id) => ({ id })) }
            : undefined,
        },
      });
    });

    try {
      await sendAccessReleasedEmail(env, normalised.email, {
        legalName: normalised.company || normalised.name,
        portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/login`,
        loginEmail: normalised.email,
        tempPassword,
      });
    } catch (err) {
      console.warn("Failed to send vendor welcome email:", err);
    }

    return {
      vendorId,
      email: normalised.email,
      name: normalised.name,
    };
  }

  /**
   * Patch vendor status or portal access
   */
  static async patchVendor(
    id: string,
    body: { isActive?: boolean; portalAccess?: string; name?: string; industryIds?: string[] }
  ) {
    const existing = await prisma.vendorUser.findUnique({ where: { id } });
    if (!existing) return null;

    const data: Prisma.VendorUserUpdateInput = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (body.portalAccess && (body.portalAccess === "HELD" || body.portalAccess === "RELEASED")) {
      data.portalAccess = body.portalAccess as PortalAccess;
    }
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (Array.isArray(body.industryIds)) {
      data.industries = {
        set: body.industryIds.map((indId) => ({ id: indId })),
      };
    }

    const updated = await prisma.vendorUser.update({
      where: { id },
      data,
    });

    if (body.isActive === false || body.portalAccess === "HELD") {
      await prisma.vendorSession.updateMany({
        where: { vendorId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  }

  /**
   * Reset vendor password
   */
  static async resetVendorPassword(id: string, env: Env) {
    const vendor = await prisma.vendorUser.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!vendor) return { notFound: true };
    if (!vendor.isActive) return { inactive: true };

    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    await prisma.$transaction([
      prisma.vendorUser.update({
        where: { id },
        data: {
          passwordHash: hash,
          mustChangePassword: true,
          failedAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.vendorSession.updateMany({
        where: { vendorId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    try {
      await sendAccessReleasedEmail(env, vendor.email, {
        legalName: vendor.name,
        portalUrl: `${(env.VENDOR_PORTAL_URL || "").replace(/\/$/, "")}/login`,
        loginEmail: vendor.email,
        tempPassword,
      });
    } catch (err) {
      console.warn("Failed to send vendor password reset email:", err);
    }

    return { ok: true, email: vendor.email };
  }
}
