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

import { type Service } from "@/data/services";
import { apiFetch } from "@/lib/api-fetch";
import {
  SERVICES_CACHE_TAG,
  SERVICES_REVALIDATE_SECONDS,
} from "@/lib/cache";

function resolveIcon(iconName?: string): React.ReactNode {
  switch (iconName) {
    case "HiOutlineSparkles":
    case "Sparkles":
      return <HiOutlineSparkles className="h-6 w-6" />;
    case "HiOutlinePencilSquare":
    case "PencilSquare":
      return <HiOutlinePencilSquare className="h-6 w-6" />;
    case "FaWater":
    case "Water":
      return <FaWater className="h-6 w-6" />;
    case "HiOutlineSquares2X2":
    case "Squares2X2":
      return <HiOutlineSquares2X2 className="h-6 w-6" />;
    case "FaDroplet":
    case "Droplet":
      return <FaDroplet className="h-6 w-6" />;
    case "HiOutlineSquare3Stack3D":
    case "Square3Stack3D":
      return <HiOutlineSquare3Stack3D className="h-6 w-6" />;
    case "FaTree":
    case "Tree":
      return <FaTree className="h-6 w-6" />;
    case "HiOutlineGlobeAlt":
    case "GlobeAlt":
      return <HiOutlineGlobeAlt className="h-6 w-6" />;
    case "HiOutlineHome":
    case "Home":
      return <HiOutlineHome className="h-6 w-6" />;
    case "HiOutlineCpuChip":
    case "CpuChip":
      return <HiOutlineCpuChip className="h-6 w-6" />;
    case "HiOutlineTruck":
    case "Truck":
      return <HiOutlineTruck className="h-6 w-6" />;
    case "HiOutlineBuildingOffice2":
    case "BuildingOffice2":
      return <HiOutlineBuildingOffice2 className="h-6 w-6" />;
    default:
      return <HiOutlineWrench className="h-6 w-6" />;
  }
}

/**
 * Fetch all active services from backend with ISR revalidation.
 * Returns empty array and logs to terminal if API is unreachable.
 */
export async function getServices(): Promise<Service[]> {
  const data = await apiFetch<{ services?: any[] }>(
    "/services",
    {
      next: { revalidate: SERVICES_REVALIDATE_SECONDS, tags: [SERVICES_CACHE_TAG] },
    },
    "services"
  );

  if (!data || !data.services || data.services.length === 0) {
    return [];
  }

  return data.services.map((s, index) => {
    return {
      id: s.sortOrder || index + 1,
      slug: s.slug,
      title: s.title,
      description: s.description || "",
      longDescription: s.longDescription || s.description || "",
      image: s.image || "",
      icon: resolveIcon(s.iconName),
      features: Array.isArray(s.features) ? s.features : [],
      projectIds: s.projectIds || [],
    };
  });
}

/**
 * Fetch single service by slug with its connected dynamic gallery images and projects.
 */
export async function getServiceBySlug(
  slug: string
): Promise<(Service & { dynamicGalleryImages?: string[]; dynamicProjects?: any[] }) | null> {
  const data = await apiFetch<{ service?: any }>(
    `/services/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: SERVICES_REVALIDATE_SECONDS, tags: [SERVICES_CACHE_TAG] },
    },
    `services/${slug}`
  );

  if (data && data.service) {
    const s = data.service;
    const galleryImages: string[] = Array.isArray(s.galleryImages)
      ? s.galleryImages.map((g: any) => g.imageUrl).filter(Boolean)
      : [];

    return {
      id: s.sortOrder || 1,
      slug: s.slug,
      title: s.title,
      description: s.description || "",
      longDescription: s.longDescription || s.description || "",
      image: s.image || "",
      icon: resolveIcon(s.iconName),
      features: Array.isArray(s.features) ? s.features : [],
      projectIds: s.projectIds || [],
      dynamicGalleryImages: galleryImages,
      dynamicProjects: s.projects || [],
    };
  }

  return null;
}
