"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({
  label = "Back",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={
        className ??
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-600 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_8px_16px_-4px_rgba(15,23,42,0.08)] transition-all hover:bg-zinc-50 hover:text-zinc-950 hover:shadow-md"
      }
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
