import "server-only";

import React from "react";
import { FaDroplet, FaTree, FaWater } from "react-icons/fa6";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineHome,
  HiOutlinePencilSquare,
  HiOutlineSparkles,
  HiOutlineSquare3Stack3D,
  HiOutlineSquares2X2,
  HiOutlineTruck,
  HiOutlineWrench,
} from "react-icons/hi2";

import {
  SERVICES_CACHE_TAG,
  SERVICES_REVALIDATE_SECONDS,
} from "@/lib/cache";
import { services as STATIC_SERVICES, Service } from "@/data/services";

function apiBase(): string {
  return (process.env.API_URL || "https://rvcc-api.rvcc.workers.dev").replace(/\/$/, "");
}

function resolveIcon(iconName: string): React.ReactNode {
  switch (iconName) {
    case "HiOutlineSparkles":
      return <HiOutlineSparkles className="h-6 w-6" />;
    case "HiOutlinePencilSquare":
      return <HiOutlinePencilSquare className="h-6 w-6" />;
    case "FaWater":
      return <FaWater className="h-6 w-6" />;
    case "HiOutlineSquares2X2":
      return <HiOutlineSquares2X2 className="h-6 w-6" />;
    case "FaDroplet":
      return <FaDroplet className="h-6 w-6" />;
    case "HiOutlineSquare3Stack3D":
      return <HiOutlineSquare3Stack3D className="h-6 w-6" />;
    case "FaTree":
      return <FaTree className="h-6 w-6" />;
    case "HiOutlineGlobeAlt":
      return <HiOutlineGlobeAlt className="h-6 w-6" />;
    case "HiOutlineHome":
      return <HiOutlineHome className="h-6 w-6" />;
    case "HiOutlineCpuChip":
      return <HiOutlineCpuChip className="h-6 w-6" />;
    case "HiOutlineTruck":
      return <HiOutlineTruck className="h-6 w-6" />;
    case "HiOutlineBuildingOffice2":
      return <HiOutlineBuildingOffice2 className="h-6 w-6" />;
    default:
      return <HiOutlineWrench className="h-6 w-6" />;
  }
}

/**
 * Fetch all active services from backend with ISR revalidation.
 * Falls back to static services on failure.
 */
export async function getServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${apiBase()}/services`, {
      next: { revalidate: SERVICES_REVALIDATE_SECONDS, tags: [SERVICES_CACHE_TAG] },
    });

    if (!res.ok) {
      return STATIC_SERVICES;
    }

    const data = (await res.json()) as { services?: any[] };
    if (!data.services || data.services.length === 0) {
      return STATIC_SERVICES;
    }

    return data.services.map((s, index) => {
      // Find static fallback to retain icon & projectIds if needed
      const staticMatch = STATIC_SERVICES.find((st) => st.slug === s.slug);
      return {
        id: index + 1,
        slug: s.slug,
        title: s.title,
        description: s.description,
        longDescription: s.longDescription,
        image: s.image || staticMatch?.image || "/images/services/civil.webp",
        icon: resolveIcon(s.iconName) || staticMatch?.icon,
        features: s.features || staticMatch?.features || [],
        projectIds: staticMatch?.projectIds || [],
      };
    });
  } catch (err) {
    console.warn("[services] Could not reach API, using static fallback", err);
    return STATIC_SERVICES;
  }
}

/**
 * Fetch single service by slug with its connected dynamic gallery images and projects.
 */
export async function getServiceBySlug(
  slug: string
): Promise<(Service & { dynamicGalleryImages?: string[]; dynamicProjects?: any[] }) | null> {
  try {
    const res = await fetch(`${apiBase()}/services/${encodeURIComponent(slug)}`, {
      next: { revalidate: SERVICES_REVALIDATE_SECONDS, tags: [SERVICES_CACHE_TAG] },
    });

    if (res.ok) {
      const data = (await res.json()) as { service?: any };
      if (data.service) {
        const s = data.service;
        const staticMatch = STATIC_SERVICES.find((st) => st.slug === s.slug);
        const galleryImages: string[] = Array.isArray(s.galleryImages)
          ? s.galleryImages.map((g: any) => g.imageUrl).filter(Boolean)
          : [];

        return {
          id: s.sortOrder || staticMatch?.id || 1,
          slug: s.slug,
          title: s.title,
          description: s.description,
          longDescription: s.longDescription,
          image: s.image || staticMatch?.image || "/images/services/civil.webp",
          icon: resolveIcon(s.iconName) || staticMatch?.icon,
          features: s.features || staticMatch?.features || [],
          projectIds: staticMatch?.projectIds || [],
          dynamicGalleryImages: galleryImages,
          dynamicProjects: s.projects || [],
        };
      }
    }
  } catch (err) {
    console.warn(`[services/${slug}] Could not reach API, using static fallback`, err);
  }

  // Fallback to static
  const found = STATIC_SERVICES.find((s) => s.slug === slug);
  return found || null;
}
