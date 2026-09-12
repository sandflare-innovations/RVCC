import type { HeroSlideDTO } from "@rvcc/schemas";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { HeroSectionManager } from "@/sections/hero/HeroSectionManager";

export const dynamic = "force-dynamic";

async function HeroSectionContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ slides: HeroSlideDTO[] }>("/hero-slides?page=all");
  const slides = res.ok && Array.isArray(res.data.slides) ? res.data.slides : [];

  return <HeroSectionManager initialSlides={slides} canDelete={canDelete} />;
}

export default async function ContentHeroPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Header matching About Content Header standard */}
      <div className="flex flex-none items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <SlidersHorizontal className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">Hero Section</h1>
              <p className="text-sm text-zinc-500">
                Manage hero banners, titles, badges, and background media across all website pages
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          }
        >
          <HeroSectionContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
