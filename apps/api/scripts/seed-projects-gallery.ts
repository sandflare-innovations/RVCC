import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from apps/api/.env manually
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rvcc-public-assets";
const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev"
).replace(/\/$/, "");

/**
 * Uploads a file directly to Cloudflare R2 using wrangler CLI with remote credentials
 */
function uploadToCloudflareR2(key: string, localFilePath: string, contentType = "image/webp"): string {
  const apiDir = path.resolve(__dirname, "..");
  const escapedFile = `"${localFilePath}"`;
  const cmd = `npx wrangler r2 object put "${R2_BUCKET_NAME}/${key}" --file ${escapedFile} --content-type ${contentType} --remote`;

  try {
    execSync(cmd, { cwd: apiDir, stdio: "pipe" });
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (err: any) {
    console.error(`Error uploading ${key}:`, err?.stderr?.toString() || err?.message);
    throw err;
  }
}

interface ProjectSeedData {
  slug: string;
  title: string;
  category: string;
  client: string;
  location: string;
  year: string;
  status: string;
  description: string;
  coverLocalImage: string;
  galleryLocalImages: string[];
  scope: string[];
}

const SEED_PROJECTS: ProjectSeedData[] = [
  {
    slug: "kafd-iconic-tower",
    title: "KAFD Iconic Tower",
    category: "Commercial Architecture",
    client: "KAFD Development",
    location: "Riyadh, KSA",
    year: "2023",
    status: "Completed",
    description:
      "A landmark skyscraper in the King Abdullah Financial District, featuring state-of-the-art sustainable engineering and premium commercial spaces.",
    coverLocalImage: "13.webp",
    galleryLocalImages: ["13.webp", "14.webp", "12.webp", "4.webp", "1.webp", "2.webp", "3.webp"],
    scope: [
      "Structural Engineering",
      "Interior Fit-out",
      "Sustainable Facade Design",
      "Project Management",
    ],
  },
  {
    slug: "heritage-residences",
    title: "Heritage Residences",
    category: "Residential Architecture",
    client: "Al-Faisaliah Group",
    location: "Riyadh, KSA",
    year: "2024",
    status: "Completed",
    description:
      "Luxury residential villas that blend traditional Najdi architectural motifs with contemporary minimalist interiors.",
    coverLocalImage: "2.webp",
    galleryLocalImages: ["2.webp", "5.webp", "6.webp", "7.webp", "3.webp", "15.webp"],
    scope: ["Architectural Design", "Civil Construction", "Landscape Architecture", "MEP Services"],
  },
  {
    slug: "prism-commercial-hub",
    title: "Prism Commercial Hub",
    category: "Corporate Infrastructure",
    client: "Red Sea Development",
    location: "Jeddah, KSA",
    year: "2023",
    status: "Completed",
    description:
      "A high-tech corporate hub featuring geometric glass facades and collaborative workspaces for modern enterprises.",
    coverLocalImage: "1.webp",
    galleryLocalImages: ["1.webp", "8.webp", "9.webp", "10.webp", "7.webp", "6.webp"],
    scope: ["Glass Curtain Wall", "Foundation Works", "Digital Integration", "HVAC Systems"],
  },
  {
    slug: "urban-green-initiative",
    title: "Urban Green Initiative",
    category: "Landscape & Urbanism",
    client: "Municipality of Dammam",
    location: "Dammam, KSA",
    year: "2024",
    status: "In Progress",
    description:
      "Transforming urban spaces with sustainable irrigation systems, native plantations, and recreational public parks.",
    coverLocalImage: "10.webp",
    galleryLocalImages: ["10.webp", "11.webp", "12.webp", "14.webp", "9.webp"],
    scope: ["Site Planning", "Irrigation Systems", "Soft & Hard Landscaping", "Outdoor Lighting"],
  },
  {
    slug: "heavy-industrial-foundation",
    title: "Industrial Foundation",
    category: "Industrial Engineering",
    client: "SABIC",
    location: "Jubail, KSA",
    year: "2023",
    status: "Completed",
    description:
      "Precision heavy-earth works and foundation engineering for large-scale industrial complexes in the Jubail industrial zone.",
    coverLocalImage: "15.webp",
    galleryLocalImages: ["15.webp", "3.webp", "8.webp", "6.webp", "7.webp"],
    scope: ["Excavation", "Concrete Foundation", "Site Preparation", "Utility Trenching"],
  },
  {
    slug: "skyline-business-park",
    title: "Skyline Business Park",
    category: "Corporate Infrastructure",
    client: "Riyadh Development Authority",
    location: "Riyadh, KSA",
    year: "2024",
    status: "In Progress",
    description:
      "A sprawling business park featuring modular office spaces, green roof gardens, and high-tech connectivity infrastructure.",
    coverLocalImage: "14.webp",
    galleryLocalImages: ["14.webp", "1.webp", "2.webp", "13.webp", "4.webp", "5.webp"],
    scope: [
      "Master Planning",
      "Modular Construction",
      "Smart Building Systems",
      "Urban Landscaping",
    ],
  },
];

async function seed() {
  console.log("=== Starting Data & Cloudflare R2 Seeding ===");

  const imagesDir = path.resolve(__dirname, "../../web/public/images/projects");
  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Local project images directory not found at: ${imagesDir}`);
  }

  for (let pIdx = 0; pIdx < SEED_PROJECTS.length; pIdx++) {
    const item = SEED_PROJECTS[pIdx]!;
    console.log(`\n[${pIdx + 1}/${SEED_PROJECTS.length}] Processing project: ${item.title} (${item.slug})`);

    // 1. Upload Cover Image to Cloudflare R2 under projects/{projectSlug}/cover.webp
    const coverPath = path.join(imagesDir, item.coverLocalImage);
    const coverKey = `projects/${item.slug}/cover.webp`;
    console.log(`  -> Uploading Cover to R2: ${coverKey}`);
    const coverUrl = uploadToCloudflareR2(coverKey, coverPath);
    console.log(`     Uploaded URL: ${coverUrl}`);

    // 2. Upsert Project record in PostgreSQL
    const existingProject = await prisma.project.findFirst({
      where: { slug: item.slug },
    });

    let projectRecord;
    if (existingProject) {
      projectRecord = await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          title: item.title,
          category: item.category,
          client: item.client,
          location: item.location,
          year: item.year,
          status: item.status,
          description: item.description,
          coverImage: coverUrl,
          scope: item.scope,
          sortOrder: pIdx,
          isActive: true,
          deletedAt: null,
        },
      });
      console.log(`  ✓ Updated project record (ID: ${projectRecord.id})`);
    } else {
      projectRecord = await prisma.project.create({
        data: {
          slug: item.slug,
          title: item.title,
          category: item.category,
          client: item.client,
          location: item.location,
          year: item.year,
          status: item.status,
          description: item.description,
          coverImage: coverUrl,
          scope: item.scope,
          sortOrder: pIdx,
          isActive: true,
        },
      });
      console.log(`  ✓ Created project record (ID: ${projectRecord.id})`);
    }

    // 3. Upload Gallery Images to Cloudflare R2 under gallery/{projectSlug}/photo-{idx}.webp
    // and sync with the separate GalleryImage table
    console.log(`  -> Uploading and syncing ${item.galleryLocalImages.length} gallery images...`);

    // Remove old active gallery records for clean sync
    await prisma.galleryImage.deleteMany({
      where: { projectId: projectRecord.id },
    });

    for (let gIdx = 0; gIdx < item.galleryLocalImages.length; gIdx++) {
      const imgFileName = item.galleryLocalImages[gIdx]!;
      const imgFilePath = path.join(imagesDir, imgFileName);
      const galleryKey = `gallery/${item.slug}/photo-${gIdx + 1}.webp`;

      console.log(`     [${gIdx + 1}/${item.galleryLocalImages.length}] Uploading: ${galleryKey}`);
      const galleryUrl = uploadToCloudflareR2(galleryKey, imgFilePath);

      await prisma.galleryImage.create({
        data: {
          projectId: projectRecord.id,
          imageUrl: galleryUrl,
          caption: `${item.title} - View ${gIdx + 1}`,
          sortOrder: gIdx,
          isActive: true,
        },
      });
    }

    console.log(`  ✓ Successfully seeded gallery for: ${item.title}`);
  }

  console.log("\n=== Seeding completed successfully! ===");
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
