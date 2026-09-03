import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { gallery: true },
      },
      gallery: {
        take: 2,
        select: { imageUrl: true, caption: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  console.log(
    JSON.stringify(
      projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        coverImage: p.coverImage,
        galleryCount: p._count.gallery,
        sampleGallery: p.gallery,
      })),
      null,
      2
    )
  );
}

main().finally(() => prisma.$disconnect());
