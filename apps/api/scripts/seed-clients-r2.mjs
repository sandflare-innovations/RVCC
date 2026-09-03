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

const SEED_CLIENTS = [
  { id: 1, name: "GCC Interconnection Authority", file: "1.webp", industry: "Energy & Infrastructure" },
  { id: 2, name: "Halliburton", file: "2.webp", industry: "Energy & Infrastructure" },
  { id: 3, name: "Ferrovial Agroman", file: "3.webp", industry: "Infrastructure" },
  { id: 4, name: "Al Fahd Company", file: "4.webp", industry: "Tourism & Hospitality" },
  { id: 5, name: "Saudi Aramco", file: "5.webp", industry: "Entertainment & Leisure" },
  { id: 6, name: "ABV Rock Group", file: "6.webp", industry: "Real Estate" },
  { id: 7, name: "Almabani", file: "7.webp", industry: "Construction" },
  { id: 8, name: "King Faisal Specialist Hospital and Research Center", file: "8.webp", industry: "Construction" },
  { id: 9, name: "Shibh Al Jazira Contracting Co.", file: "9.webp", industry: "Engineering" },
  { id: 10, name: "Yuksel", file: "10.webp", industry: "Construction" },
  { id: 11, name: "Saudi Oger LTD", file: "11.webp", industry: "Construction" },
  { id: 12, name: "Saudi Electricity Company", file: "12.webp", industry: "Construction" },
  { id: 13, name: "Salco", file: "13.webp", industry: "Infrastructure" },
  { id: 14, name: "Royal Commission For Riyadh City", file: "14.webp", industry: "Civil Engineering" },
  { id: 15, name: "LuLu", file: "15.webp", industry: "Global Construction" },
  { id: 16, name: "Pitchmastic PmB", file: "16.webp", industry: "Infrastructure" },
  { id: 17, name: "Armed Forces Medical Services In Saudi Arabia", file: "17.webp", industry: "Engineering & Construction" },
  { id: 18, name: "Royal Commission For Riyadh City", file: "18.webp", industry: "Industrial Development" },
];

async function main() {
  console.log("=== Starting Client Logos Cloudflare R2 Upload & Database Seed ===");
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Target Folder: clients/`);

  for (let i = 0; i < SEED_CLIENTS.length; i++) {
    const client = SEED_CLIENTS[i];
    const localFile = resolve(process.cwd(), `../web/public/images/clients/${client.file}`);
    const seoSlug = slugify(client.name);
    const token = generateUniqueToken(4);
    const r2Key = `clients/${seoSlug}-${token}.webp`;

    console.log(`\n[${i + 1}/${SEED_CLIENTS.length}] Uploading "${localFile}" -> "${BUCKET_NAME}/${r2Key}"...`);
    const cmd = `npx wrangler r2 object put "${BUCKET_NAME}/${r2Key}" --file="${localFile}" --content-type="image/webp" --remote`;
    execSync(cmd, { stdio: "inherit" });

    const publicCdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    console.log(`[CDN] URL: ${publicCdnUrl}`);

    const record = await prisma.clientPartner.create({
      data: {
        name: client.name,
        logoUrl: publicCdnUrl,
        industry: client.industry,
        sortOrder: i,
        isActive: true,
      },
    });

    console.log(`[DB] Created ClientPartner (id: ${record.id}) - ${record.name}`);
  }

  console.log("\n=== Success! All 18 client logos uploaded to Cloudflare R2 under clients/ and seeded into PostgreSQL ===");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
