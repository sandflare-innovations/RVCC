import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { loadEnv } from "../../src/config/env";
import { createApp } from "../../src/app";
import { cuid, hashSha256 } from "../../src/lib/sql";
import { hashPassword } from "../../src/lib/password";

/**
 * Live E2E tests — requires DATABASE_URL. Run via: pnpm test:live
 * Excluded from CI by vitest.config.ts (see tests/live/** exclude).
 */
const env = loadEnv();
const app = createApp(env);

describe("QA Scenario 1: Live Bidding, Blind Masking & Concurrency E2E Test", () => {
  let requirementId: string;
  let adminId: string;
  let adminSessionToken: string;

  let vendorAId: string;
  let vendorASessionToken: string;

  let vendorBId: string;
  let vendorBSessionToken: string;

  beforeAll(async () => {
    // 1. Setup Admin Account & Session
    adminId = `qa-admin-${Date.now()}`;
    adminSessionToken = `qa-admin-token-${Date.now()}`;
    const adminTokenHash = await hashSha256(adminSessionToken);

    await prisma.adminUser.create({
      data: {
        id: adminId,
        email: `qa_admin_${Date.now()}@rvcc.test`,
        name: "QA Super Admin",
        passwordHash: await hashPassword("AdminSecret123!"),
        role: {
          connectOrCreate: {
            where: { name: "SUPER_ADMIN" },
            create: { name: "SUPER_ADMIN", description: "Super Administrator", isSystem: true },
          },
        },
        sessions: {
          create: {
            tokenHash: adminTokenHash,
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });

    // 2. Setup Vendor A
    vendorAId = `qa-vendor-a-${Date.now()}`;
    vendorASessionToken = `qa-vendor-a-token-${Date.now()}`;
    const vendorATokenHash = await hashSha256(vendorASessionToken);

    await prisma.vendorUser.create({
      data: {
        id: vendorAId,
        email: `vendor_a_${Date.now()}@contractor.test`,
        name: "Vendor Alpha Contracting",
        passwordHash: await hashPassword("VendorSecret123!"),
        isActive: true,
        portalAccess: "RELEASED",
        sessions: {
          create: {
            tokenHash: vendorATokenHash,
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });

    // 3. Setup Vendor B
    vendorBId = `qa-vendor-b-${Date.now()}`;
    vendorBSessionToken = `qa-vendor-b-token-${Date.now()}`;
    const vendorBTokenHash = await hashSha256(vendorBSessionToken);

    await prisma.vendorUser.create({
      data: {
        id: vendorBId,
        email: `vendor_b_${Date.now()}@contractor.test`,
        name: "Vendor Beta Engineering",
        passwordHash: await hashPassword("VendorSecret123!"),
        isActive: true,
        portalAccess: "RELEASED",
        sessions: {
          create: {
            tokenHash: vendorBTokenHash,
            expiresAt: new Date(Date.now() + 3600000),
          },
        },
      },
    });

    // 4. Create Active Requirement (Closes in 24 hours)
    requirementId = `qa-req-${Date.now()}`;
    await prisma.requirement.create({
      data: {
        id: requirementId,
        referenceNumber: `REQ-QA-${Date.now().toString().slice(-4)}`,
        project: "Riyadh Metro HVAC Expansion QA",
        scopeOfWork: "Chilled water plant and piping supply",
        status: "OPEN",
        closesAt: new Date(Date.now() + 86400000),
        currency: "SAR",
        createdByAdminId: adminId,
        invites: {
          create: [
            { vendorUserId: vendorAId },
            { vendorUserId: vendorBId },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup QA records to leave database completely pristine
    try {
      await prisma.quote.deleteMany({ where: { requirementId } });
      await prisma.requirementInvite.deleteMany({ where: { requirementId } });
      await prisma.requirement.delete({ where: { id: requirementId } });

      await prisma.vendorSession.deleteMany({ where: { vendorId: { in: [vendorAId, vendorBId] } } });
      await prisma.vendorUser.deleteMany({ where: { id: { in: [vendorAId, vendorBId] } } });

      await prisma.adminSession.deleteMany({ where: { adminId } });
      await prisma.adminUser.delete({ where: { id: adminId } });
    } catch (err) {
      console.warn("QA Cleanup warning:", err);
    }
  });

  it("Step 1: Vendor A and Vendor B place concurrent initial bids", async () => {
    // Vendor A bids 100,000 SAR
    const resA = await app.request(`/vendor/requirements/${requirementId}/quote`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Vendor-Session": vendorASessionToken,
      },
      body: JSON.stringify({
        newPrice: 100000,
        currency: "SAR",
        remarks: "Alpha Initial Tender Offer",
        submit: true,
      }),
    });
    expect(resA.status).toBe(200);

    // Vendor B bids 90,000 SAR (Lowest price -> L1)
    const resB = await app.request(`/vendor/requirements/${requirementId}/quote`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Vendor-Session": vendorBSessionToken,
      },
      body: JSON.stringify({
        newPrice: 90000,
        currency: "SAR",
        remarks: "Beta Initial Competitive Bid",
        submit: true,
      }),
    });
    expect(resB.status).toBe(200);
  });

  it("Step 2: Blind Bidding Anti-Collusion Verification for Vendor A", async () => {
    const res = await app.request(`/vendor/requirements/${requirementId}/live-bids`, {
      method: "GET",
      headers: {
        "X-Vendor-Session": vendorASessionToken,
      },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    // Check payload data via ranking service directly for assertions
    const { buildVendorLiveBidsPayload } = await import(
      "../../src/modules/sourcing/bidding/ranking.service"
    );
    const vendorPayload = await buildVendorLiveBidsPayload(requirementId, vendorAId);

    expect(vendorPayload).toBeDefined();
    expect(vendorPayload?.myRank).toBe(2); // Vendor A is 100k vs Beta 90k
    expect(vendorPayload?.isLeading).toBe(false);
    expect(vendorPayload?.lowestPrice).toBe("90000.00");

    // Verify Masking: Vendor A must see themselves as "You", and competitor Vendor B masked as "Bidder #1"
    const myItem = vendorPayload?.leaderboard.find((b) => b.isYou);
    expect(myItem?.maskedName).toBe("You");
    expect(myItem?.price).toBe("100000.00");

    const competitorItem = vendorPayload?.leaderboard.find((b) => !b.isYou);
    expect(competitorItem?.maskedName).toBe("Bidder #1");
    expect(competitorItem?.price).toBe("90000.00");

    // STRICT PRIVACY CHECK: Ensure competitor name, email, or id are NOT exposed
    expect((competitorItem as any).who).toBeUndefined();
    expect((competitorItem as any).vendorEmail).toBeUndefined();
    expect((competitorItem as any).vendorId).toBeUndefined();
  });

  it("Step 3: Admin Cockpit sees unmasked full identities and correct ranks", async () => {
    const { buildAdminLiveBidsPayload } = await import(
      "../../src/modules/sourcing/bidding/ranking.service"
    );
    const adminPayload = await buildAdminLiveBidsPayload(requirementId);

    expect(adminPayload).toBeDefined();
    expect(adminPayload?.totalQuotes).toBe(2);
    expect(adminPayload?.lowestPrice).toBe("90000.00");

    // Admin sees Rank 1 (Beta) and Rank 2 (Alpha) with real company names
    const rank1 = adminPayload?.quotes.find((q) => q.rank === 1);
    expect(rank1?.vendorId).toBe(vendorBId);
    expect(rank1?.newPrice).toBe("90000.00");
    expect(rank1?.isLeading).toBe(true);

    const rank2 = adminPayload?.quotes.find((q) => q.rank === 2);
    expect(rank2?.vendorId).toBe(vendorAId);
    expect(rank2?.newPrice).toBe("100000.00");
    expect(rank2?.isLeading).toBe(false);
  });

  it("Step 4: Vendor A outbids Vendor B with a revised lower quote", async () => {
    // Vendor A revisions quote to 85,000 SAR
    const resA = await app.request(`/vendor/requirements/${requirementId}/quote`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Vendor-Session": vendorASessionToken,
      },
      body: JSON.stringify({
        newPrice: 85000,
        currency: "SAR",
        remarks: "Alpha Aggressive Revised Tender",
        submit: true,
      }),
    });
    expect(resA.status).toBe(200);

    const { buildVendorLiveBidsPayload } = await import(
      "../../src/modules/sourcing/bidding/ranking.service"
    );
    const vendorPayload = await buildVendorLiveBidsPayload(requirementId, vendorAId);

    // Vendor A must now be Rank 1 (L1 Leading)
    expect(vendorPayload?.myRank).toBe(1);
    expect(vendorPayload?.isLeading).toBe(true);
    expect(vendorPayload?.lowestPrice).toBe("85000.00");

    const revisionCount = await prisma.quoteRevision.count({
      where: { requirementId, vendorUserId: vendorAId },
    });
    expect(revisionCount).toBeGreaterThanOrEqual(2);
  });

  it("Step 5: Post-Deadline Lockout prevents bids after closing time", async () => {
    // Expire the requirement in database
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { closesAt: new Date(Date.now() - 10000) }, // 10 seconds ago
    });

    // Vendor B attempts to place a late bid
    const lateBidRes = await app.request(`/vendor/requirements/${requirementId}/quote`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Vendor-Session": vendorBSessionToken,
      },
      body: JSON.stringify({
        newPrice: 80000,
        currency: "SAR",
        submit: true,
      }),
    });

    // Must be rejected with 409 Conflict
    expect(lateBidRes.status).toBe(409);
    const body = await lateBidRes.json();
    expect(body.error).toMatch(/closed|expired|deadline|not available/i);
  });
});
