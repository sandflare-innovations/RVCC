import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "rvcc-public-assets";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev").replace(/\/$/, "");

async function runMigration() {
  console.log("=== Migrating Hero Carousel Images via Wrangler CLI ===");
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Public URL: ${R2_PUBLIC_URL}`);

  const slides = await prisma.heroSlide.findMany({
    where: { deletedAt: null },
  });

  console.log(`\nFound ${slides.length} active hero slides in database.`);

  const tempDir = resolve(process.cwd(), "./scripts");

  for (const slide of slides) {
    console.log(`\nChecking Slide [${slide.id}] - "${slide.title1} ${slide.title2}"`);
    console.log(`Current imageUrl: ${slide.imageUrl}`);

    if (!slide.imageUrl || !slide.imageUrl.includes("gallery/hero/")) {
      console.log("  -> Skipping (not in gallery/hero/)");
      continue;
    }

    const urlObj = new URL(slide.imageUrl);
    const oldKey = urlObj.pathname.replace(/^\//, "");
    const fileName = oldKey.split("/").pop();
    const newKey = `hero/${fileName}`;
    const newUrl = `${R2_PUBLIC_URL}/${newKey}`;
    const tempFilePath = resolve(tempDir, fileName);

    console.log(`  -> Old Key: ${oldKey}`);
    console.log(`  -> New Key: ${newKey}`);

    try {
      // 1. Download using wrangler
      console.log(`  -> [1/4] Downloading ${oldKey} to temporary file...`);
      execSync(
        `npx wrangler r2 object get "${BUCKET_NAME}/${oldKey}" --file="${tempFilePath}" --remote`,
        { stdio: "inherit" }
      );

      // 2. Upload to newKey hero/
      console.log(`  -> [2/4] Uploading to ${newKey}...`);
      execSync(
        `npx wrangler r2 object put "${BUCKET_NAME}/${newKey}" --file="${tempFilePath}" --content-type="image/webp" --remote`,
        { stdio: "inherit" }
      );

      // 3. Update DB
      console.log(`  -> [3/4] Updating Database record to ${newUrl}...`);
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { imageUrl: newUrl },
      });

      // 4. Delete oldKey
      console.log(`  -> [4/4] Deleting old object ${oldKey}...`);
      execSync(
        `npx wrangler r2 object delete "${BUCKET_NAME}/${oldKey}" --remote`,
        { stdio: "inherit" }
      );

      console.log(`  -> Successfully migrated Slide [${slide.id}]!`);
    } catch (err) {
      console.error(`  -> Failed migrating ${slide.id}:`, err);
    } finally {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
    }
  }

  console.log("\n=== Migration Finished! ===");
}

runMigration()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
