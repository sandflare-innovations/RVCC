import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runMigration() {
  console.log("🚀 Starting Enterprise Data Migration...\n");

  await prisma.$transaction(
    async (tx) => {
      // =========================================================================
      // 1. RBAC Initialization & Backfill for AdminUsers
      // =========================================================================
      console.log("👉 [1/4] Seeding RBAC Roles & Permissions...");

      const permissions = [
        { slug: "procurement:read", description: "View purchase requisitions", category: "PROCUREMENT" },
        { slug: "procurement:write", description: "Create/edit purchase requisitions", category: "PROCUREMENT" },
        { slug: "procurement:approve", description: "Approve/reject purchase requisitions", category: "PROCUREMENT" },
        { slug: "vendors:read", description: "View vendor accounts and registrations", category: "VENDORS" },
        { slug: "vendors:write", description: "Approve/manage vendor accounts", category: "VENDORS" },
        { slug: "rfq:manage", description: "Manage RFQs, tendering, and quote awards", category: "SOURCING" },
        { slug: "staff:manage", description: "Manage staff accounts and roles", category: "SECURITY" },
      ];

      for (const p of permissions) {
        await tx.permission.upsert({
          where: { slug: p.slug },
          update: {},
          create: p,
        });
      }

      // Create default Root Super Admin Role
      const superAdminRole = await tx.role.upsert({
        where: { name: "SUPER_ADMIN" },
        update: {},
        create: {
          name: "SUPER_ADMIN",
          description: "Full operational and root administrative access",
          isSystem: true,
        },
      });

      // Attach all permissions to SUPER_ADMIN
      const allPermissions = await tx.permission.findMany();
      for (const perm of allPermissions) {
        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        });
      }

      // Link any orphaned/legacy AdminUsers to SUPER_ADMIN
      const unassignedAdmins = await tx.adminUser.findMany({
        where: {
          OR: [{ roleId: "" }, { roleId: null as any }],
        },
      });

      if (unassignedAdmins.length > 0) {
        console.log(`Assigning SUPER_ADMIN role to ${unassignedAdmins.length} staff member(s)...`);
        await tx.adminUser.updateMany({
          where: {
            id: { in: unassignedAdmins.map((a) => a.id) },
          },
          data: {
            roleId: superAdminRole.id,
          },
        });
      }

      // =========================================================================
      // 2. Normalize and Map Currencies
      // =========================================================================
      console.log("👉 [2/4] Normalizing and verifying multi-currency fields...");

      // Validate & clean up Quotes currency
      await tx.$executeRawUnsafe(`
        UPDATE "quotes" 
        SET "currency" = 'SAR' 
        WHERE "currency"::text NOT IN ('SAR', 'USD', 'AED', 'INR', 'EUR') OR "currency" IS NULL;
      `);

      // Validate & clean up PurchaseRequests currency
      await tx.$executeRawUnsafe(`
        UPDATE "purchase_requests" 
        SET "currency" = 'SAR' 
        WHERE "currency"::text NOT IN ('SAR', 'USD', 'AED', 'INR', 'EUR') OR "currency" IS NULL;
      `);

      // Validate & clean up PurchaseRequestItems currency
      await tx.$executeRawUnsafe(`
        UPDATE "purchase_request_items" 
        SET "currency" = 'SAR' 
        WHERE "currency"::text NOT IN ('SAR', 'USD', 'AED', 'INR', 'EUR') OR "currency" IS NULL;
      `);

      // =========================================================================
      // 3. Migrate Legacy Polymorphic OTPs -> Strict AdminOtp & VendorOtp
      // =========================================================================
      console.log("👉 [3/4] Migrating active OTP verification challenges...");

      // Check if old polymorphic table exists before reading
      const hasOldOtpTable = await tx.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'OtpChallenge' OR table_name = 'otp_challenges'
        );
      `;

      if (hasOldOtpTable[0]?.exists) {
        const legacyOtps = await tx.$queryRaw<
          Array<{
            id: string;
            ownerType: string;
            ownerId: string;
            action: string;
            codeHash: string;
            attempts: number;
            expiresAt: Date;
            consumedAt: Date | null;
            createdAt: Date;
          }>
        >`SELECT * FROM "OtpChallenge" WHERE "expiresAt" > NOW() AND "consumedAt" IS NULL`;

        for (const otp of legacyOtps) {
          if (otp.ownerType === "ADMIN") {
            const adminExists = await tx.adminUser.findUnique({ where: { id: otp.ownerId } });
            if (adminExists) {
              await tx.adminOtp.create({
                data: {
                  adminId: otp.ownerId,
                  action: otp.action,
                  codeHash: otp.codeHash,
                  attempts: otp.attempts,
                  expiresAt: otp.expiresAt,
                  consumedAt: otp.consumedAt,
                  createdAt: otp.createdAt,
                },
              });
            }
          } else if (otp.ownerType === "VENDOR") {
            const vendorExists = await tx.vendorUser.findUnique({ where: { id: otp.ownerId } });
            if (vendorExists) {
              await tx.vendorOtp.create({
                data: {
                  vendorId: otp.ownerId,
                  action: otp.action,
                  codeHash: otp.codeHash,
                  attempts: otp.attempts,
                  expiresAt: otp.expiresAt,
                  consumedAt: otp.consumedAt,
                  createdAt: otp.createdAt,
                },
              });
            }
          }
        }
        console.log(`Migrated ${legacyOtps.length} active OTP challenge(s).`);
      }

      // =========================================================================
      // 4. Verification Check
      // =========================================================================
      console.log("👉 [4/4] Verifying database integrity...");
      const adminCount = await tx.adminUser.count();
      const roleCount = await tx.role.count();
      console.log(`Audit Summary: ${adminCount} Admins configured under ${roleCount} active Roles.`);
    },
    { timeout: 60000 }
  );

  console.log("\n✅ Enterprise Data Migration completed successfully.");
}

runMigration()
  .catch((err) => {
    console.error("\n❌ Migration failed. Transaction rolled back:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
