"use client";

import { use } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DOCUMENTS } from "@/data/documents";
import { FlipbookReader } from "@/sections/documents/FlipbookReader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const doc = DOCUMENTS.find((d) => d.slug === slug);

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
        <h1 className="font-heading mb-4 text-4xl text-zinc-900 uppercase">Document Not Found</h1>
        <p className="mb-8 text-zinc-500">The document you are looking for does not exist.</p>
        <Link
          href="/documents"
          className="bg-brand-blue px-8 py-3 font-bold tracking-widest text-white uppercase transition-all hover:bg-zinc-900"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <FlipbookReader isOpen={true} onClose={() => router.push("/documents")} document={doc} />
    </div>
  );
}
