"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useEnquire } from "@/sections/enquire/EnquireContext";

export function DoneStep() {
  const params = useSearchParams();
  const { registration } = useEnquire();
  const ref = params.get("ref") || registration?.referenceNumber || "—";

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8 text-center">
      <div className="bg-brand-blue mx-auto flex h-16 w-16 items-center justify-center text-white">
        <span className="text-2xl font-black">✓</span>
      </div>
      <div className="space-y-3">
        <h2 className="font-heading text-3xl tracking-tighter uppercase md:text-5xl">
          Request received
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500">
          Thank you for registering as a prospective supplier with RVCC. Your request is now in our
          procurement review queue.
        </p>
      </div>
      <div className="border border-zinc-100 bg-zinc-50 px-6 py-5">
        <p className="text-xs font-bold tracking-[0.18em] text-zinc-600 uppercase">
          Reference number
        </p>
        <p className="text-brand-blue mt-2 font-mono text-xl font-bold tracking-wide">{ref}</p>
      </div>
      <p className="text-sm text-zinc-600">
        Keep this reference for follow-up. Notifications will be sent to your administrative contact
        email when a decision is made.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary" className="h-14 rounded-none">
          Back to Home
        </Button>
        <Link
          href="/contact"
          className="border-brand-blue text-brand-blue inline-flex h-14 items-center border-2 px-8 text-xs font-bold tracking-[0.18em] uppercase"
        >
          Contact Procurement
        </Link>
      </div>
    </div>
  );
}
