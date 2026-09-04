import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev").replace(/\/$/, "");
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "rvcc-public-assets";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateUniqueToken(length = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Concern Logos from apps/web/public/images/concern-companies/logos/
const SEED_LOGOS = [
  { file: "1.webp", name: "Flyin Co", websiteUrl: "https://www.flyinco.com/", industry: "Sister Concern / Aviation" },
  { file: "2.webp", name: "Paanayil Heavy Equipment", websiteUrl: null, industry: "Heavy Machinery & Logistics" },
  { file: "3.webp", name: "Paanayil Builders", websiteUrl: null, industry: "Construction & Infrastructure" },
  { file: "4.webp", name: "South Pacific General Trading", websiteUrl: null, industry: "General Trading & Contracting" },
  { file: "5.webp", name: "Al Safa Engineering", websiteUrl: null, industry: "Engineering Services" },
  { file: "6.webp", name: "Global Petro Services", websiteUrl: null, industry: "Industrial & Petrochemical" },
  { file: "7.webp", name: "Pacific Marine Logistics", websiteUrl: null, industry: "Maritime & Logistics" },
  { file: "8.webp", name: "Gulf Electro Mechanical", websiteUrl: null, industry: "MEP & Electrical Works" },
  { file: "9.webp", name: "Apex Steel & Metal", websiteUrl: null, industry: "Steel & Fabrication Works" },
];

// Main subsidiary companies from apps/web/public/images/concern-companies/
const SEED_SUBSIDIARIES = [
  { file: "paanayil-heavy.webp", name: "Paanayil Heavy Equipment", websiteUrl: null, industry: "Heavy Machinery & Fleet" },
  { file: "panayil-builder.webp", name: "Paanayil Builder Contracting", websiteUrl: null, industry: "Commercial Building & Contracting" },
  { file: "south-pacific-general.webp", name: "South Pacific General Trading", websiteUrl: null, industry: "General Trading & Supplies" },
];

async function main() {
  console.log("=== Starting Sister Concern Companies Cloudflare R2 Upload & Database Seed ===");
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}`);

  // Check if any sister companies already exist
  const existingCount = await prisma.sisterCompany.count({ where: { deletedAt: null } });
  console.log(`Current existing SisterCompany records in DB: ${existingCount}`);

  // 1. Upload & Seed Logos
  console.log("\n--- Seeding Concern Company Logos ---");
  for (let i = 0; i < SEED_LOGOS.length; i++) {
    const item = SEED_LOGOS[i];
    const localFile = resolve(process.cwd(), `../web/public/images/concern-companies/logos/${item.file}`);
    const seoSlug = slugify(item.name);
    const token = generateUniqueToken(4);
    const r2Key = `sister-companies/${seoSlug}-${token}.webp`;

    console.log(`\n[Logo ${i + 1}/${SEED_LOGOS.length}] Uploading "${localFile}" -> "${BUCKET_NAME}/${r2Key}"...`);
    const cmd = `npx wrangler r2 object put "${BUCKET_NAME}/${r2Key}" --file="${localFile}" --content-type="image/webp" --remote`;
    execSync(cmd, { stdio: "inherit" });

    const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    console.log(`[CDN] URL: ${publicUrl}`);

    const record = await prisma.sisterCompany.create({
      data: {
        name: item.name,
        logoUrl: publicUrl,
        industry: item.industry,
        websiteUrl: item.websiteUrl,
        sortOrder: i,
        isActive: true,
      },
    });

    console.log(`[DB] Created SisterCompany (id: ${record.id}) - "${record.name}"`);
  }

  const total = await prisma.sisterCompany.count({ where: { deletedAt: null } });
  console.log(`\n=== Successfully seeded ${total} Sister Concern Company Logos to Cloudflare R2 and PostgreSQL! ===`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
