import { ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { adminSessionJson } from "@/lib/admin-data";
import { HeroSlideEditor } from "@/sections/hero/HeroSlideEditor";
import type { HeroSlideDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

export default async function EditHeroSlidePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const res = await adminSessionJson<{ slide: HeroSlideDTO }>(`/hero-slides/${id}`);

  if (!res.ok || !res.data.slide) {
    notFound();
  }

  const slide = res.data.slide;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-none items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/content/hero"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Back to Hero Slides"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">Edit Hero Slide</h1>
              <p className="text-sm text-zinc-500">
                Update headline, imagery, and button links for &ldquo;{slide.title1} {slide.title2}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        <HeroSlideEditor initial={slide} />
      </div>
    </div>
  );
}
