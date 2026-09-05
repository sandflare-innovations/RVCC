import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDocumentBySlug } from "@/lib/content/documents";
import { DocumentReaderClient } from "./reader-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);

  if (!doc) {
    return {
      title: "Document Not Found | RVCC",
      description: "The requested document could not be found.",
    };
  }

  return {
    title: `${doc.title} | RVCC Publications`,
    description: doc.description || `Access and read ${doc.title} published by RVCC.`,
    openGraph: {
      title: `${doc.title} | RVCC Publications`,
      description: doc.description || `Access and read ${doc.title} published by RVCC.`,
      images: doc.image ? [{ url: doc.image }] : undefined,
    },
  };
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);

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

  return <DocumentReaderClient doc={doc} />;
}
