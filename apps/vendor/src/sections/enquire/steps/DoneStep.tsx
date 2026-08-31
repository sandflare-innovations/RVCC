"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { enquireVerifyUrl, siteUrl, vendorPortalUrl } from "@/lib/public-urls";
import { enquirePageTitleClass } from "@/sections/enquire/enquire-typography";
import { useEnquire } from "@/sections/enquire/EnquireContext";

export function DoneStep() {
  const params = useSearchParams();
  const { registration } = useEnquire();
  const ref = params.get("ref") || registration?.referenceNumber || "—";
  const homeHref = siteUrl("/");
  const contactHref = siteUrl("/contact");
  const vendorLogin = vendorPortalUrl("/login");
  const hasVendorPortal = Boolean(process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL);

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8 text-center">
      <div className="bg-brand-blue mx-auto flex h-16 w-16 items-center justify-center text-white">
        <span className="text-2xl font-black">✓</span>
      </div>
      <div className="space-y-3">
        <h2 className={enquirePageTitleClass}>Request received</h2>
        <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
          Thank you for registering as a prospective supplier with RVCC. Your request is now in our
          procurement review queue.
        </p>
      </div>
      <div className="border border-zinc-100 bg-zinc-50 px-6 py-5">
        <p className="text-sm font-bold tracking-[0.12em] text-zinc-600 uppercase sm:text-base">
          Reference number
        </p>
        <p className="text-brand-blue mt-2 font-mono text-2xl font-bold tracking-wide">{ref}</p>
      </div>
      <p className="text-base text-zinc-600 sm:text-lg">
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
        <Button href={homeHref} variant="primary" className="h-14 rounded-none text-base">
          Back to Home
        </Button>
        <Link
          href={contactHref}
          className="border-brand-blue text-brand-blue inline-flex h-14 items-center border-2 px-8 text-sm font-bold tracking-[0.12em] uppercase sm:text-base"
        >
          Contact Procurement
        </Link>
      </div>
      <p className="text-sm text-zinc-500 sm:text-base">
        Need to start another draft?{" "}
        <a href={enquireVerifyUrl()} className="underline underline-offset-2">
          E-Vendor Registration
        </a>
      </p>
    </div>
  );
}
