import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev").replace(/\/$/, "");
const BUCKET_NAME = "rvcc-public-assets";

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

const SEED_SLIDES = [
  {
    localFile: resolve(process.cwd(), "../web/public/images/projects/13.webp"),
    badge: "Architecture & Design",
    title1: "Building",
    title2: "Legacy",
    description:
      "Redefining the architectural landscape through precision engineering and visionary design. We build structures that define generations.",
    sortOrder: 0,
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
  },
  {
    localFile: resolve(process.cwd(), "../web/public/images/projects/4.webp"),
    badge: "Architecture & Design",
    title1: "Shaping",
    title2: "Reality",
    description:
      "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
    sortOrder: 1,
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
  },
  {
    localFile: resolve(process.cwd(), "../web/public/images/projects/2.webp"),
    badge: "Architecture & Design",
    title1: "Beyond",
    title2: "Limits",
    description:
      "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
    sortOrder: 2,
    primaryBtnText: "Explore Works",
    primaryBtnLink: "#projects",
    secondaryBtnText: "E-Vendor Registration",
    secondaryBtnLink: "/enquire/verify",
  },
];

async function main() {
  console.log("=== Starting Hero Cloudflare R2 Upload & Database Seed ===");

  for (const slide of SEED_SLIDES) {
    const seoSlug = slugify(`${slide.title1}-${slide.title2}`);
    const token = generateUniqueToken(4);
    const r2Key = `gallery/hero/${seoSlug}-${token}.webp`;

    console.log(`\n[Upload] Uploading "${slide.localFile}" to R2 -> "${BUCKET_NAME}/${r2Key}"...`);
    const cmd = `npx wrangler r2 object put "${BUCKET_NAME}/${r2Key}" --file="${slide.localFile}" --content-type="image/webp" --remote`;
    execSync(cmd, { stdio: "inherit" });

    const publicCdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    console.log(`[CDN] URL: ${publicCdnUrl}`);

    const record = await prisma.heroSlide.create({
      data: {
        badge: slide.badge,
        title1: slide.title1,
        title2: slide.title2,
        description: slide.description,
        imageUrl: publicCdnUrl,
        primaryBtnText: slide.primaryBtnText,
        primaryBtnLink: slide.primaryBtnLink,
        secondaryBtnText: slide.secondaryBtnText,
        secondaryBtnLink: slide.secondaryBtnLink,
        sortOrder: slide.sortOrder,
        isActive: true,
      },
    });

    console.log(`[DB] Created HeroSlide (id: ${record.id}) - ${record.title1} ${record.title2}`);
  }

  console.log("\n=== Success! All hero slides uploaded to Cloudflare R2 and seeded into PostgreSQL ===");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
