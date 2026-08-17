/**
 * One-off migration of the hardcoded careers list into the database.
 *
 *   node ./scripts/seed-careers.mjs [--dry-run]
 *
 * Idempotent: upserts by slug, so re-running will not duplicate rows. Existing
 * rows are left untouched — once staff edit a posting in the admin panel, this
 * script must not overwrite their copy.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry-run");

/* Mirrors src/data/careers.ts at the time of migration. */
const POSITIONS = [
  {
    slug: "senior-architect",
    title: "Senior Architect",
    department: "Architecture",
    location: "Riyadh, Saudi Arabia",
    employmentType: "Full-time",
    postedAt: "2024-05-01",
    description:
      "We are looking for a Senior Architect to lead iconic high-rise projects and mentor our design team.",
    requirements: [
      "Master's Degree in Architecture",
      "10+ years of experience in large-scale projects",
      "Proficiency in Revit and Rhino",
      "Knowledge of Saudi building codes",
    ],
    benefits: [
      "Competitive salary and performance bonuses",
      "Comprehensive medical insurance",
      "Professional development support",
      "Relocation assistance",
    ],
    isRemote: false,
  },
  {
    slug: "structural-engineer",
    title: "Lead Structural Engineer",
    department: "Engineering",
    location: "Jeddah, Saudi Arabia",
    employmentType: "Full-time",
    postedAt: "2024-05-05",
    description:
      "Join our engineering team to solve complex structural challenges in urban development.",
    requirements: [
      "Bachelor's Degree in Civil/Structural Engineering",
      "8+ years of experience in structural design",
      "Strong analytical skills",
      "Experience with Etabs and SAP2000",
    ],
    benefits: [
      "Premium workspace in our Jeddah office",
      "Flexible working hours",
      "Annual flight allowance",
      "Project completion incentives",
    ],
    isRemote: false,
  },
  {
    slug: "project-manager",
    title: "Project Manager",
    department: "Management",
    location: "Riyadh, Saudi Arabia",
    employmentType: "Full-time",
    postedAt: "2024-05-10",
    description:
      "Manage end-to-end project lifecycles for our commercial and residential portfolios.",
    requirements: [
      "PMP Certification",
      "Proven track record in construction management",
      "Excellent communication and leadership skills",
      "Fluent in Arabic and English",
    ],
    benefits: [
      "Standard-setting compensation package",
      "Company vehicle",
      "Generous vacation policy",
      "Leadership training programs",
    ],
    isRemote: false,
  },
  {
    slug: "bim-coordinator",
    title: "BIM Coordinator",
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    employmentType: "Full-time",
    postedAt: "2024-05-12",
    description: "Coordinate BIM workflows and ensure data integrity across all project stages.",
    requirements: [
      "Degree in Architecture or Engineering",
      "5+ years of BIM-specific experience",
      "Expert level in Autodesk Revit and Navisworks",
      "Experience in VDC processes",
    ],
    benefits: [
      "Cutting-edge technology stack",
      "Flexible work arrangements",
      "Team-building retreats",
      "Health and wellness programs",
    ],
    isRemote: true,
  },
];

try {
  let created = 0;
  let skipped = 0;

  for (const [i, p] of POSITIONS.entries()) {
    const existing = await prisma.jobPosting.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  skip    ${p.slug} (already present)`);
      skipped++;
      continue;
    }
    if (DRY) {
      console.log(`  would create  ${p.slug}`);
      created++;
      continue;
    }
    await prisma.jobPosting.create({
      data: {
        ...p,
        postedAt: new Date(p.postedAt),
        // Published so the public page keeps showing exactly what it does today.
        isPublished: true,
        sortOrder: i,
      },
    });
    console.log(`  created ${p.slug}`);
    created++;
  }

  const total = await prisma.jobPosting.count();
  console.log(`\n  ${DRY ? "[dry run] " : ""}created ${created}, skipped ${skipped}. Total in DB: ${total}\n`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
