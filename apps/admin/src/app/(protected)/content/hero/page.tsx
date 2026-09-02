import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { HeroSlidesGrid } from "@/sections/hero/HeroSlidesGrid";
import type { HeroSlideDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function HeroSlidesContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ slides: HeroSlideDTO[] }>("/hero-slides");
  const slides = res.ok && Array.isArray(res.data.slides) ? res.data.slides : [];

  return <HeroSlidesGrid initialSlides={slides} canDelete={canDelete} />;
}

export default async function ContentHeroPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-80 w-full rounded-3xl" />
            </div>
          }
        >
          <HeroSlidesContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
