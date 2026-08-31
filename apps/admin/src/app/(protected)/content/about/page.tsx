import { ChevronLeft, Construction,Info } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">About Page</h1>
              <p className="text-sm text-zinc-500">Manage company overview, mission, and stats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
            <Construction className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900">Coming Soon</h2>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            The about page management module is under development. You&apos;ll be able to edit the
            company overview, mission &amp; values, journey timeline, stats, divisions, and
            certifications.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
              Edit Overview
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
              Mission & Values
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
              Company Stats
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
              Certifications
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
