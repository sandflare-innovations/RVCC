import Link from "next/link";
import { ChevronLeft, Briefcase, Construction } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ContentProjectsPage() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      <div className="flex-none flex items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">Projects</h1>
              <p className="text-sm text-zinc-500">Manage your project portfolio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
            <Construction className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
            The project management module is under development. You&apos;ll be able to add, edit, and manage all company projects displayed on the website.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Add Projects</span>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Upload Images</span>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Edit Details</span>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Set Metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
