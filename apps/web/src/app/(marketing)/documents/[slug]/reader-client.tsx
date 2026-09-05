"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { WebDocumentItem } from "@/lib/content/documents";

const FlipbookReader = dynamic(
  () => import("@/sections/documents/FlipbookReader").then((mod) => mod.FlipbookReader),
  { ssr: false }
);

export function DocumentReaderClient({ doc }: { doc: WebDocumentItem }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <FlipbookReader isOpen={true} onClose={() => router.push("/documents")} document={doc as any} />
    </div>
  );
}
