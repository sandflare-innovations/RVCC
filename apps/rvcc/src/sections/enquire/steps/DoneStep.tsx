"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { enquirePageTitleClass } from "@/sections/enquire/enquire-typography";

export function DoneStep() {
  const params = useSearchParams();
  const ref = params.get("ref") || "—";

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8 text-center">
      <div className="bg-brand-blue mx-auto flex h-16 w-16 items-center justify-center text-white">
        <span className="text-2xl font-black">✓</span>
      </div>
      <div className="space-y-3">
        <h2 className={enquirePageTitleClass}>Request received</h2>
        <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
          Thank you for registering as a prospective supplier with RVCC. Your request is now in our
          procurement review queue. The supplier portal opens only after approval.
        </p>
      </div>
      <div className="border border-zinc-100 bg-zinc-50 px-6 py-5">
        <p className="text-sm font-bold tracking-[0.12em] text-zinc-600 uppercase sm:text-base">
          Reference number
        </p>
        <p className="text-brand-blue mt-2 font-mono text-2xl font-bold tracking-wide">{ref}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="bg-brand-blue inline-flex h-14 items-center px-8 text-sm font-bold tracking-[0.12em] text-white uppercase"
        >
          Supplier sign-in
        </Link>
        <Link
          href="/contact"
          className="border-brand-blue text-brand-blue inline-flex h-14 items-center border-2 px-8 text-sm font-bold tracking-[0.12em] uppercase sm:text-base"
        >
          Contact Procurement
        </Link>
      </div>
      <p className="text-sm text-zinc-500 sm:text-base">
        <Link href="/" className="underline underline-offset-2">
          Back to RVCC website
        </Link>
        {" · "}
        <Link href="/register/verify" className="underline underline-offset-2">
          Start another registration
        </Link>
      </p>
    </div>
  );
}
