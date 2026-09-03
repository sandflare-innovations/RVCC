import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROJECT_SERVICE_MAPPINGS: Record<string, string[]> = {
  "kafd-iconic-tower": ["architectural-service", "cladding-works", "steel-metal-works", "building-projects"],
  "heritage-residences": ["architectural-service", "hardscaping-works", "cladding-works", "building-projects"],
  "prism-commercial-hub": ["cladding-works", "steel-metal-works", "building-projects"],
  "urban-green-initiative": ["artificial-grass", "artificial-lakes", "fountain-services", "irrigation-plantation", "landscape-works"],
  "heavy-industrial-foundation": ["land-development", "sand-removal-earthwork", "hardscaping-works"],
  "skyline-business-park": ["architectural-service", "landscape-works", "steel-metal-works", "building-projects"],
};

async function syncServices() {
  console.log("=== Updating Project & Gallery serviceSlugs and isCover ===");

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: { gallery: true },
  });

  for (const p of projects) {
    const serviceSlugs = PROJECT_SERVICE_MAPPINGS[p.slug] || [p.category.toLowerCase().replace(/\s+/g, "-")];
    console.log(`Updating ${p.title} (${p.slug}) with services:`, serviceSlugs);

    await prisma.project.update({
      where: { id: p.id },
      data: {
        serviceSlugs,
      } as any,
    });

    for (let i = 0; i < p.gallery.length; i++) {
      const g = p.gallery[i]!;
      const isCover = p.coverImage === g.imageUrl || (i === 0 && !p.coverImage);
      await prisma.galleryImage.update({
        where: { id: g.id },
        data: {
          serviceSlugs,
          isCover,
        } as any,
      });
    }
  }

  console.log("✓ Service associations and cover flags successfully updated!");
}

syncServices()
  .catch((e) => {
    console.error("Failed to sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
