import Link from "next/link";
import { ChevronLeft, FileArchive, Construction } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ContentDocumentsPage() {
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
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileArchive className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">Documents</h1>
              <p className="text-sm text-zinc-500">Manage company PDFs, brochures, and certificates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100">
            <Construction className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Coming Soon</h2>
          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
            The document management module is under development. You&apos;ll be able to upload, categorize, and manage all company documents, PDFs, and brochures.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Upload PDFs</span>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Categorize</span>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">Manage Certificates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
