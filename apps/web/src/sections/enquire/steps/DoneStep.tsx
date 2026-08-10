"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { enquireVerifyUrl, siteUrl, vendorPortalUrl } from "@/lib/public-urls";
import { useEnquire } from "@/sections/enquire/EnquireContext";

export function DoneStep() {
  const params = useSearchParams();
  const { registration } = useEnquire();
  const ref = params.get("ref") || registration?.referenceNumber || "—";
  const homeHref = siteUrl("/");
  const contactHref = siteUrl("/contact");
  // Portal login is only after approval (email). Submit success stays on marketing.
  const vendorLogin = vendorPortalUrl("/login");
  const hasVendorPortal = Boolean(process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL);

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
        {hasVendorPortal ? (
          <>
            {" "}
            After approval, you will sign in at the{" "}
            <a
              href={vendorLogin}
              className="text-brand-blue underline underline-offset-2"
              rel="noopener noreferrer"
            >
              supplier portal
            </a>
            .
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href={homeHref} variant="primary" className="h-14 rounded-none">
          Back to Home
        </Button>
        <Link
          href={contactHref}
          className="border-brand-blue text-brand-blue inline-flex h-14 items-center border-2 px-8 text-xs font-bold tracking-[0.18em] uppercase"
        >
          Contact Procurement
        </Link>
      </div>
      <p className="text-xs text-zinc-400">
        Need to start another draft?{" "}
        <a href={enquireVerifyUrl()} className="underline underline-offset-2">
          E-Vendor Registration
        </a>
      </p>
    </div>
  );
}
