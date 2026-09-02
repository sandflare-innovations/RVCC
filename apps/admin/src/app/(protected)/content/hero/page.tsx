import { Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { HeroSlideRowActions } from "@/sections/hero/HeroSlideRowActions";
import type { HeroSlideDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function HeroSlidesTable({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ slides: HeroSlideDTO[] }>("/hero-slides");
  const slides = res.ok ? res.data.slides : [];

  if (!slides.length) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Sparkles className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-950">No hero slides yet</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Add your first dynamic slide to personalize the public website hero section.
        </p>
        <Link
          href="/content/hero/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create First Slide
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs">
      <div className="divide-y divide-zinc-100">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50/60 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 shadow-2xs">
                {slide.imageUrl ? (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title1}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    No img
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase">
                    {slide.badge || "Architecture"}
                  </span>
                  <span className="text-xs text-zinc-400">Order: #{slide.sortOrder}</span>
                </div>
                <h4 className="mt-1 text-base font-bold text-zinc-950">
                  <span>{slide.title1} </span>
                  <span className="text-blue-600">{slide.title2}</span>
                </h4>
                <p className="mt-0.5 line-clamp-1 max-w-lg text-xs text-zinc-500">
                  {slide.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <HeroSlideRowActions slide={slide} canDelete={canDelete} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ContentHeroPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-none items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Hero Slides</h1>
            <p className="text-sm text-zinc-500">
              Manage interactive headline slides on the marketing homepage
            </p>
          </div>
        </div>

        <Link
          href="/content/hero/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
          }
        >
          <HeroSlidesTable canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
