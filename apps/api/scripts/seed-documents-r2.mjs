import { readFileSync, statSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { AwsClient } from "aws4fetch";
import { PrismaClient } from "@prisma/client";

// Load environment variables from apps/api/.env
try {
  const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      let v = trimmed.slice(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
} catch {
  // Ignore
}

const prisma = new PrismaClient();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "d17302a485a00dcb8339cce02701183f";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "4dcfc82f87784bf1806c5986cc96ddc8";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "30a1ad770a0a7021891f05010cc5a00654d6a825cbedb4d6f417af83d2988071";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rvcc-public-assets";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev").replace(/\/$/, "");

const s3Client = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
});

async function uploadToR2(storageKey, buffer, contentType) {
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${storageKey}`;
  console.log(`[R2 Uploading] ${storageKey} (${(buffer.length / 1024 / 1024).toFixed(2)} MB, ${contentType})...`);
  
  const res = await s3Client.fetch(url, {
    method: "PUT",
    body: buffer,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  console.log(`[R2 Done] ${storageKey} -> ${R2_PUBLIC_URL}/${storageKey}`);
  return `${R2_PUBLIC_URL}/${storageKey}`;
}

const SEED_DOCUMENTS = [
  {
    slug: "rvcc-general-profile",
    title: "RVCC General Profile",
    category: "Profile",
    description: "A comprehensive overview of our history, expertise, and landmark projects in the Saudi Kingdom.",
    fileName: "rvcc-general-profile.pdf",
    coverFileName: "company-profile.webp",
    sortOrder: 0,
    pageCount: 42,
  },
  {
    slug: "rvcc-signature-projects",
    title: "Signature Projects Profile",
    category: "Profile",
    description: "A curated showcase of our most ambitious and structurally significant projects across the region.",
    fileName: "rvcc-signature-project-profile.pdf",
    coverFileName: "company-profile.webp",
    sortOrder: 1,
    pageCount: 56,
  },
  {
    slug: "rvcc-water-feature-landscape",
    title: "Water Feature & Landscape Profile",
    category: "Profile",
    description: "A specialized showcase of our elite water feature engineering and architectural landscape masterworks.",
    fileName: "rvcc-water-feature-landscape-profile.pdf",
    coverFileName: "company-profile.webp",
    sortOrder: 2,
    pageCount: 78,
  },
  {
    slug: "rvmf-metal-factory-steel-work",
    title: "Metal Factory & Steel Work Profile",
    category: "Profile",
    description: "Comprehensive documentation of our high-precision metal fabrication and structural steel engineering capabilities.",
    fileName: "rvmf-metal-factory-steel-work-profile.pdf",
    coverFileName: "company-profile.webp",
    sortOrder: 3,
    pageCount: 36,
  },
];

async function main() {
  console.log("=== Starting Company Documents Cloudflare R2 Upload & Database Seed ===");
  console.log(`Target Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Target Public CDN: ${R2_PUBLIC_URL}`);

  // 1. Upload Cover Image
  const coverLocalPath = resolve(process.cwd(), "../web/public/images/books/company-profile.webp");
  let coverPublicUrl = `${R2_PUBLIC_URL}/documents/covers/company-profile.webp`;
  if (existsSync(coverLocalPath)) {
    const coverBuf = readFileSync(coverLocalPath);
    coverPublicUrl = await uploadToR2("documents/covers/company-profile.webp", coverBuf, "image/webp");
  } else {
    console.warn(`Cover file not found locally at ${coverLocalPath}, using fallback URL`);
  }

  // 2. Upload Each PDF and Upsert into PostgreSQL
  for (const doc of SEED_DOCUMENTS) {
    const pdfPath = resolve(process.cwd(), `../web/public/pdf/books/${doc.fileName}`);
    if (!existsSync(pdfPath)) {
      console.error(`Missing PDF file: ${pdfPath}`);
      continue;
    }

    const pdfStat = statSync(pdfPath);
    const pdfBuf = readFileSync(pdfPath);
    const storageKey = `documents/${doc.fileName}`;
    const fileSizeStr = `${(pdfStat.size / (1024 * 1024)).toFixed(1)} MB`;

    console.log(`\nProcessing: "${doc.title}" (${fileSizeStr})`);
    const fileUrl = await uploadToR2(storageKey, pdfBuf, "application/pdf");

    const record = await prisma.companyDocument.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        category: doc.category,
        description: doc.description,
        fileSize: fileSizeStr,
        sizeBytes: BigInt(pdfStat.size),
        pageCount: doc.pageCount,
        fileUrl,
        storageKey,
        filePath: `/pdf/books/${doc.fileName}`,
        coverImage: coverPublicUrl,
        sortOrder: doc.sortOrder,
        isPublished: true,
        deletedAt: null,
      },
      create: {
        slug: doc.slug,
        title: doc.title,
        category: doc.category,
        description: doc.description,
        fileSize: fileSizeStr,
        sizeBytes: BigInt(pdfStat.size),
        pageCount: doc.pageCount,
        fileUrl,
        storageKey,
        filePath: `/pdf/books/${doc.fileName}`,
        coverImage: coverPublicUrl,
        sortOrder: doc.sortOrder,
        isPublished: true,
      },
    });

    console.log(`[DB Record Created/Updated] ID: ${record.id} - Slug: ${record.slug} - Size: ${record.fileSize}`);
  }

  const count = await prisma.companyDocument.count({ where: { deletedAt: null } });
  console.log(`\n=== Successfully Seeded ${count} Company Documents to PostgreSQL and Cloudflare R2! ===`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
