"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
