import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { deletePublicAsset } from "../../../lib/storage";

export function extractR2Key(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("hero/") || trimmed.startsWith("content/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/^\//, "");
    if (pathname.startsWith("hero/") || pathname.startsWith("content/")) {
      return decodeURIComponent(pathname);
    }
  } catch {
    // not a full URL
  }
  return null;
}

export class HeroService {
  static async listAdminSlides(page?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (page && page !== "all") {
      where.page = page;
    }

    const slides = await prisma.heroSlide.findMany({
      where: where as any,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((s) => ({
      id: s.id,
      page: (s as any).page || "home",
      badge: s.badge,
      title1: s.title1,
      title2: s.title2,
      description: s.description,
      imageUrl: s.imageUrl,
      primaryBtnText: s.primaryBtnText,
      primaryBtnLink: s.primaryBtnLink,
      secondaryBtnText: s.secondaryBtnText,
      secondaryBtnLink: s.secondaryBtnLink,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  static async listPublicSlides(page = "home") {
    const slides = await prisma.heroSlide.findMany({
      where: { page, isActive: true, deletedAt: null } as any,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((s) => ({
      id: s.id,
      page: (s as any).page || "home",
      badge: s.badge,
      title1: s.title1,
      title2: s.title2,
      description: s.description,
      imageUrl: s.imageUrl,
      primaryBtnText: s.primaryBtnText,
      primaryBtnLink: s.primaryBtnLink,
      secondaryBtnText: s.secondaryBtnText,
      secondaryBtnLink: s.secondaryBtnLink,
      sortOrder: s.sortOrder,
    }));
  }

  static async getPageHero(page: string) {
    const slide = await prisma.heroSlide.findFirst({
      where: { page, isActive: true, deletedAt: null } as any,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (!slide) return null;

    return {
      id: slide.id,
      page: (slide as any).page || page,
      badge: slide.badge,
      title1: slide.title1,
      title2: slide.title2,
      description: slide.description,
      imageUrl: slide.imageUrl,
      primaryBtnText: slide.primaryBtnText,
      primaryBtnLink: slide.primaryBtnLink,
      secondaryBtnText: slide.secondaryBtnText,
      secondaryBtnLink: slide.secondaryBtnLink,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async getSlideById(id: string) {
    const slide = await prisma.heroSlide.findFirst({
      where: { id, deletedAt: null },
    });
    if (!slide) return null;

    return {
      id: slide.id,
      page: (slide as any).page || "home",
      badge: slide.badge,
      title1: slide.title1,
      title2: slide.title2,
      description: slide.description,
      imageUrl: slide.imageUrl,
      primaryBtnText: slide.primaryBtnText,
      primaryBtnLink: slide.primaryBtnLink,
      secondaryBtnText: slide.secondaryBtnText,
      secondaryBtnLink: slide.secondaryBtnLink,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async createSlide(data: {
    page?: string;
    title1: string;
    title2: string;
    imageUrl: string;
    description?: string;
    badge?: string;
    primaryBtnText?: string;
    primaryBtnLink?: string;
    secondaryBtnText?: string;
    secondaryBtnLink?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const page = data.page || "home";
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const highest = await prisma.heroSlide.findFirst({
        where: { page, deletedAt: null } as any,
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = highest ? highest.sortOrder + 1 : 0;
    }

    const slide = await prisma.heroSlide.create({
      data: {
        id: cuid(),
        page,
        title1: data.title1,
        title2: data.title2,
        imageUrl: data.imageUrl,
        description: data.description || "",
        badge: data.badge || "Architecture & Design",
        primaryBtnText: data.primaryBtnText ?? "Explore Works",
        primaryBtnLink: data.primaryBtnLink ?? "#projects",
        secondaryBtnText: data.secondaryBtnText ?? "E-Vendor Registration",
        secondaryBtnLink: data.secondaryBtnLink ?? "/enquire/verify",
        sortOrder,
        isActive: data.isActive ?? true,
      } as any,
    });

    return {
      ...slide,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async upsertPageHero(
    page: string,
    data: {
      title1: string;
      title2: string;
      imageUrl: string;
      description?: string;
      badge?: string;
      primaryBtnText?: string;
      primaryBtnLink?: string;
      secondaryBtnText?: string;
      secondaryBtnLink?: string;
      isActive?: boolean;
    },
    env?: Env
  ) {
    const existing = await prisma.heroSlide.findFirst({
      where: { page, deletedAt: null } as any,
    });

    if (existing) {
      // If image is being changed and old image is an R2 asset, delete obsolete asset
      if (existing.imageUrl && existing.imageUrl !== data.imageUrl && env) {
        const oldKey = extractR2Key(existing.imageUrl);
        if (oldKey) {
          try {
            await deletePublicAsset(env, oldKey);
          } catch (err) {
            console.warn("[HeroService] failed to delete old public asset from R2:", err);
          }
        }
      }

      const updated = await prisma.heroSlide.update({
        where: { id: existing.id },
        data: {
          title1: data.title1,
          title2: data.title2,
          imageUrl: data.imageUrl,
          description: data.description ?? existing.description,
          badge: data.badge ?? existing.badge,
          primaryBtnText: data.primaryBtnText ?? existing.primaryBtnText,
          primaryBtnLink: data.primaryBtnLink ?? existing.primaryBtnLink,
          secondaryBtnText: data.secondaryBtnText ?? existing.secondaryBtnText,
          secondaryBtnLink: data.secondaryBtnLink ?? existing.secondaryBtnLink,
          isActive: data.isActive ?? existing.isActive,
        },
      });

      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    return this.createSlide({
      page,
      title1: data.title1,
      title2: data.title2,
      imageUrl: data.imageUrl,
      description: data.description,
      badge: data.badge,
      primaryBtnText: data.primaryBtnText,
      primaryBtnLink: data.primaryBtnLink,
      secondaryBtnText: data.secondaryBtnText,
      secondaryBtnLink: data.secondaryBtnLink,
      isActive: data.isActive ?? true,
    });
  }

  static async updateSlide(id: string, data: Record<string, unknown>, env?: Env) {
    if (data.imageUrl && env) {
      const existing = await prisma.heroSlide.findFirst({
        where: { id, deletedAt: null },
      });
      if (existing?.imageUrl && existing.imageUrl !== data.imageUrl) {
        const oldKey = extractR2Key(existing.imageUrl);
        if (oldKey) {
          try {
            await deletePublicAsset(env, oldKey);
          } catch (err) {
            console.warn("[HeroService] failed to delete old public asset from R2:", err);
          }
        }
      }
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: data as any,
    });

    return {
      ...slide,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    };
  }

  static async deleteSlide(id: string, env?: Env) {
    const existing = await prisma.heroSlide.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    if (existing.imageUrl && env) {
      const oldKey = extractR2Key(existing.imageUrl);
      if (oldKey) {
        try {
          await deletePublicAsset(env, oldKey);
        } catch (err) {
          console.warn("[HeroService] failed to delete asset on slide delete:", err);
        }
      }
    }

    await prisma.heroSlide.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return existing;
  }

  static async reorderSlides(slideIds: string[]) {
    await prisma.$transaction(
      slideIds.map((id, index) =>
        prisma.heroSlide.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }

  static async cleanupUnusedPageHeroes(env?: Env) {
    const UNUSED_PAGES = [
      "about",
      "projects",
      "clients",
      "gallery",
      "gallary",
      "quality-policy",
      "contact",
    ];
    const found = await prisma.heroSlide.findMany({
      where: {
        page: { in: UNUSED_PAGES },
      } as any,
    });

    if (found.length > 0) {
      if (env) {
        for (const s of found) {
          const key = extractR2Key(s.imageUrl);
          if (key) {
            await deletePublicAsset(env, key).catch(() => undefined);
          }
        }
      }

      await prisma.heroSlide.deleteMany({
        where: {
          page: { in: UNUSED_PAGES },
        } as any,
      });
    }
  }
}
