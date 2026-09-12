import type { AboutContentDTO } from "@rvcc/schemas";
import { ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { AboutContentEditor } from "@/sections/about/AboutContentEditor";

export const dynamic = "force-dynamic";

async function AboutContentLoader() {
  const res = await adminSessionJson<{ ok: boolean; about: AboutContentDTO }>("/about");
  const initialContent: AboutContentDTO =
    res.ok && res.data.about
      ? res.data.about
      : {
          id: "default",
          videoUrl:
            "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/about.mp4",
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

  return <AboutContentEditor initialContent={initialContent} />;
}

export default function ContentAboutPage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
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
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">About Content</h1>
              <p className="text-sm text-zinc-500">
                Manage homepage video, impact stats, and about page overview
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
          <AboutContentLoader />
        </Suspense>
      </div>
    </div>
  );
}
