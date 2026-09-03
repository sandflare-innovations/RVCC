import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { GalleryGrid } from "@/sections/gallery/GalleryGrid";
import type { GalleryImageDTO, ProjectDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function GalleryContent() {
  const [imagesRes, projectsRes] = await Promise.all([
    adminSessionJson<{ images: (GalleryImageDTO & { projectTitle?: string; projectSlug?: string })[] }>(
      "/gallery"
    ),
    adminSessionJson<{ projects: ProjectDTO[] }>("/projects"),
  ]);

  const images = imagesRes.ok && Array.isArray(imagesRes.data.images) ? imagesRes.data.images : [];
  const projects =
    projectsRes.ok && Array.isArray(projectsRes.data.projects) ? projectsRes.data.projects : [];

  return <GalleryGrid initialImages={images} projects={projects} />;
}

export default async function ContentGalleryPage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-zinc-200/80 bg-white p-5 space-y-3">
                  <Skeleton className="aspect-16/10 w-full rounded-2xl" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="aspect-square rounded-xl" />
                  </div>
                  <div className="pt-2 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <GalleryContent />
        </Suspense>
      </div>
    </div>
  );
}
