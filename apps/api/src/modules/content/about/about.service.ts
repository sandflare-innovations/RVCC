import type { AboutContentDTO, AboutContentInput } from "@rvcc/schemas";
import { prisma } from "../../../lib/prisma";

export class AboutService {
  static async getAboutContent(): Promise<AboutContentDTO> {
    const record = await (prisma as any).aboutContent.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      return {
        id: "default",
        videoUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/about.mp4",
        videoPosterUrl: null,
        homeStats: [
          { value: 2006, label: "YEAR FOUNDED", suffix: "" },
          { value: 100, label: "COMPLETED PROJECTS", suffix: "+" },
          { value: 30, label: "ONGOING PROJECTS", suffix: "+" },
          { value: 15, label: "GOVERNMENT PROJECTS", suffix: "+" },
          { value: 100, label: "SATISFIED CLIENTS", suffix: "%" },
        ],
        aboutStats: [
          {
            description: "Premier projects successfully delivered across the Saudi Kingdom",
            value: "150",
          },
          {
            description: "Strategic urban centers and cities served nationwide",
            value: "12",
          },
          {
            description: "Years of unwavering architectural and engineering excellence",
            value: "15",
          },
          {
            description: "Dedicated professional teams shaping global visions into reality",
            value: "50",
          },
        ],
        overviewImages: [
          "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-1.webp",
          "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
          "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-3.webp",
          "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-4.webp",
        ],
        overviewTitle: "The Art of Structural Perfection.",
        overviewSubtitle: "Company Profile",
        overviewDescription1:
          "Riyadh Villas Contracting Company (RVCC) stands as a beacon of refined engineering and timeless structural design. For nearly two decades, we have been the quiet force behind the Kingdom's most prestigious developments.",
        overviewDescription2:
          "Our philosophy is simple: perfection is not when there is nothing more to add, but when there is nothing left to take away. We bring this minimalist precision to every civil, structural, and engineering challenge we undertake.",
        classABadge: "Class A",
        classADescription: "Ministry Accredited Excellence",
        deliveriesCount: "150+",
        yearsCount: "20+",
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      id: record.id,
      videoUrl: record.videoUrl,
      videoPosterUrl: record.videoPosterUrl,
      homeStats: Array.isArray(record.homeStats) ? record.homeStats : [],
      aboutStats: Array.isArray(record.aboutStats) ? record.aboutStats : [],
      overviewImages: Array.isArray(record.overviewImages) ? record.overviewImages : [],
      overviewTitle: record.overviewTitle ?? undefined,
      overviewSubtitle: record.overviewSubtitle ?? undefined,
      overviewDescription1: record.overviewDescription1 ?? undefined,
      overviewDescription2: record.overviewDescription2 ?? undefined,
      classABadge: record.classABadge ?? undefined,
      classADescription: record.classADescription ?? undefined,
      deliveriesCount: record.deliveriesCount ?? undefined,
      yearsCount: record.yearsCount ?? undefined,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static async updateAboutContent(data: AboutContentInput): Promise<AboutContentDTO> {
    const updateData: any = {};
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.videoPosterUrl !== undefined) updateData.videoPosterUrl = data.videoPosterUrl;
    if (data.homeStats !== undefined) updateData.homeStats = data.homeStats;
    if (data.aboutStats !== undefined) updateData.aboutStats = data.aboutStats;
    if (data.overviewImages !== undefined) updateData.overviewImages = data.overviewImages;
    if (data.overviewTitle !== undefined) updateData.overviewTitle = data.overviewTitle;
    if (data.overviewSubtitle !== undefined) updateData.overviewSubtitle = data.overviewSubtitle;
    if (data.overviewDescription1 !== undefined) updateData.overviewDescription1 = data.overviewDescription1;
    if (data.overviewDescription2 !== undefined) updateData.overviewDescription2 = data.overviewDescription2;
    if (data.classABadge !== undefined) updateData.classABadge = data.classABadge;
    if (data.classADescription !== undefined) updateData.classADescription = data.classADescription;
    if (data.deliveriesCount !== undefined) updateData.deliveriesCount = data.deliveriesCount;
    if (data.yearsCount !== undefined) updateData.yearsCount = data.yearsCount;

    const record = await (prisma as any).aboutContent.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...updateData,
      },
      update: updateData,
    });

    return {
      id: record.id,
      videoUrl: record.videoUrl,
      videoPosterUrl: record.videoPosterUrl,
      homeStats: Array.isArray(record.homeStats) ? record.homeStats : [],
      aboutStats: Array.isArray(record.aboutStats) ? record.aboutStats : [],
      overviewImages: Array.isArray(record.overviewImages) ? record.overviewImages : [],
      overviewTitle: record.overviewTitle ?? undefined,
      overviewSubtitle: record.overviewSubtitle ?? undefined,
      overviewDescription1: record.overviewDescription1 ?? undefined,
      overviewDescription2: record.overviewDescription2 ?? undefined,
      classABadge: record.classABadge ?? undefined,
      classADescription: record.classADescription ?? undefined,
      deliveriesCount: record.deliveriesCount ?? undefined,
      yearsCount: record.yearsCount ?? undefined,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
