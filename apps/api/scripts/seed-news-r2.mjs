import { execSync } from "node:child_process";
import { unlinkSync, existsSync } from "node:fs";
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

const SEED_NEWS = [
  {
    title: "Community Landmark: The Lakes Park Project",
    slug: "community-landmark-the-lakes-park-project",
    date: "April 15, 2024",
    excerpt:
      "A new standard for urban recreation. Our latest community project at Lakes Park reflects our commitment to sustainable public spaces.",
    content:
      "RVCC is proud to announce the milestone completion of the Lakes Park Project in Riyadh. Designed to harmoniously combine water retention systems with lush, accessible public parkland, this landmark development stands as a testament to our dedication to environmental stewardship and civil excellence. The park features pedestrian boardwalks, smart irrigation networks, and native flora engineered to thrive in the regional climate.",
    file: "lakes-park.webp",
    category: "COMMUNITY DEVELOPMENT",
    edition: "Vol. 24 / Issue 02",
    sortOrder: 1,
  },
  {
    title: "Supportive Spirit: RVCC Cricket Auction",
    slug: "supportive-spirit-rvcc-cricket-auction",
    date: "April 10, 2024",
    excerpt:
      "Empowering local sports through community-driven initiatives. The annual cricket auction continues to foster athletic talent in the region.",
    content:
      "Fostering wellness, camaraderie, and athletic excellence: RVCC hosted its annual Cricket Auction & Tournament launch in Riyadh. With over twelve community teams participating, the event underscores our belief that strong corporate citizenship begins with investing in grassroots sports, youth mentorship, and team spirit.",
    file: "cricket-auction.webp",
    category: "SPORTS ENGAGEMENT",
    edition: "Vol. 24 / Issue 01",
    sortOrder: 2,
  },
  {
    title: "Athletic Excellence: Riyadh Football Cup",
    slug: "athletic-excellence-riyadh-football-cup",
    date: "March 20, 2024",
    excerpt:
      "Celebrating teamwork and precision. Our sponsorship of the local football championship highlights our dedication to youth empowerment.",
    content:
      "Precision, stamina, and strategic leadership define both world-class contracting and premier sports. RVCC served as the headline sponsor for the Riyadh Football Cup championship finals, honoring the incredible dedication and talent of regional athletes while celebrating community unity across the capital.",
    file: "football-match.webp",
    category: "SPORTS SPONSORSHIP",
    edition: "Vol. 24 / Issue 03",
    sortOrder: 3,
  },
];

async function main() {
  console.log("=== Starting News & Events Cloudflare R2 Upload & Database Seed ===");
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Target Folder: news/`);

  for (let i = 0; i < SEED_NEWS.length; i++) {
    const item = SEED_NEWS[i];
    const localFile = resolve(process.cwd(), `../web/public/images/news/${item.file}`);
    const token = generateUniqueToken(4);
    const r2Key = `news/${item.slug}-${token}.webp`;

    let publicCdnUrl = "";

    if (existsSync(localFile)) {
      console.log(`\n[${i + 1}/${SEED_NEWS.length}] Uploading "${localFile}" -> "${BUCKET_NAME}/${r2Key}"...`);
      const cmd = `npx wrangler r2 object put "${BUCKET_NAME}/${r2Key}" --file="${localFile}" --content-type="image/webp" --remote`;
      execSync(cmd, { stdio: "inherit" });
      publicCdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;
      console.log(`[CDN] URL: ${publicCdnUrl}`);

      // Delete local asset file as requested
      console.log(`[CLEANUP] Deleting local file: ${localFile}`);
      unlinkSync(localFile);
    } else {
      console.log(`\n[${i + 1}/${SEED_NEWS.length}] Local file not found at ${localFile}, checking existing R2 URL...`);
      publicCdnUrl = `${R2_PUBLIC_URL}/news/${item.slug}.webp`;
    }

    // Upsert database record
    const existing = await prisma.newsEvent.findFirst({
      where: { slug: item.slug, deletedAt: null },
    });

    if (existing) {
      const record = await prisma.newsEvent.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          date: item.date,
          excerpt: item.excerpt,
          content: item.content,
          imageUrl: publicCdnUrl,
          category: item.category,
          edition: item.edition,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
      console.log(`[DB] Updated NewsEvent (id: ${record.id}) - ${record.title}`);
    } else {
      const record = await prisma.newsEvent.create({
        data: {
          slug: item.slug,
          title: item.title,
          date: item.date,
          excerpt: item.excerpt,
          content: item.content,
          imageUrl: publicCdnUrl,
          category: item.category,
          edition: item.edition,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
      console.log(`[DB] Created NewsEvent (id: ${record.id}) - ${record.title}`);
    }
  }

  console.log("\n=== Success! All news items uploaded to Cloudflare R2 and seeded into PostgreSQL ===");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
