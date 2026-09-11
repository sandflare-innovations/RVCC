import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class NewsService {
  static async listAdminNews() {
    const items = await prisma.newsEvent.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      date: item.date,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.imageUrl,
      category: item.category,
      edition: item.edition,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  static async listPublicNews() {
    const items = await prisma.newsEvent.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      date: item.date,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.imageUrl,
      category: item.category,
      edition: item.edition,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  static async getNewsById(id: string) {
    const item = await prisma.newsEvent.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) return null;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      date: item.date,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.imageUrl,
      category: item.category,
      edition: item.edition,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  static async getNewsBySlug(slug: string) {
    const item = await prisma.newsEvent.findFirst({
      where: { slug, isActive: true, deletedAt: null },
    });
    if (!item) return null;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      date: item.date,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.imageUrl,
      category: item.category,
      edition: item.edition,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  static async createNews(data: {
    title: string;
    slug?: string;
    date?: string;
    excerpt?: string;
    content?: string | null;
    imageUrl: string;
    category?: string;
    edition?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    let slug = data.slug ? slugify(data.slug) : slugify(data.title);
    if (!slug) slug = `news-${Date.now()}`;

    // Ensure slug uniqueness
    const existing = await prisma.newsEvent.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.newsEvent.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const formattedDate = data.date || new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const item = await prisma.newsEvent.create({
      data: {
        id: cuid(),
        slug,
        title: data.title,
        date: formattedDate,
        excerpt: data.excerpt || "",
        content: data.content ?? null,
        imageUrl: data.imageUrl,
        category: data.category || "General",
        edition: data.edition || "Vol. 24",
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  static async updateNews(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = { ...data };
    if (typeof updateData.slug === "string") {
      updateData.slug = slugify(updateData.slug);
    }

    const item = await prisma.newsEvent.update({
      where: { id },
      data: updateData as any,
    });

    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  static async deleteNews(id: string) {
    const existing = await prisma.newsEvent.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await prisma.newsEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderNews(newsIds: string[]) {
    await prisma.$transaction(
      newsIds.map((id, index) =>
        prisma.newsEvent.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
