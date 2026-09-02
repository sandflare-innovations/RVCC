import { notFound } from "next/navigation";

import { adminSessionJson } from "@/lib/admin-data";
import { HeroSlideEditor } from "@/sections/hero/HeroSlideEditor";
import type { HeroSlideDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

export default async function EditHeroSlidePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const res = await adminSessionJson<{ slide?: HeroSlideDTO } & Partial<HeroSlideDTO>>(`/hero-slides/${encodeURIComponent(id)}`);

  const slide = (res.ok && (res.data.slide || (res.data.id && res.data))) ? (res.data.slide || res.data) as HeroSlideDTO : null;

  if (!slide) {
    notFound();
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <HeroSlideEditor initial={slide} />
      </div>
    </div>
  );
}
