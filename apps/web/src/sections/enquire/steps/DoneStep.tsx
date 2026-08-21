"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { enquireVerifyUrl, siteUrl, vendorPortalUrl } from "@/lib/public-urls";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { cn } from "@/lib/utils";

export function DoneStep() {
  const params = useSearchParams();
  const { registration } = useEnquire();
  const ref = params.get("ref") || registration?.referenceNumber || "?";
  const homeHref = siteUrl("/");
  const contactHref = siteUrl("/contact");
  const vendorLogin = vendorPortalUrl("/login");
  const hasVendorPortal = Boolean(process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Full screen watermark logo */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-5">
        <img src="/images/logo/logo.webp" alt="" className="w-full max-w-12xl object-contain" />
      </div>

      <div className="mx-auto max-w-5xl w-full flex flex-col md:flex-row items-stretch gap-6 md:gap-8 py-4 md:py-8 relative z-10">
        {/* Left Box */}
        <div className="flex-1 rounded-[2rem] border border-zinc-200 bg-zinc-50/50 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 shadow-sm">
          <div className="bg-brand-blue flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl shadow-xl shadow-brand-blue/20 ring-8 ring-brand-blue/5">
            <Check className="h-8 w-8 md:h-10 md:w-10 text-white stroke-[3]" />
          </div>

          <div className="space-y-3 md:space-y-4">
            <h2 className="font-enquire text-2xl md:text-3xl font-bold tracking-tight text-brand-blue uppercase">Request received</h2>
            <p className="text-base md:text-lg leading-relaxed text-zinc-800 max-w-sm mx-auto">
              Thank you for registering as a prospective supplier with RVCC. Your request is now in our
              procurement review queue.
            </p>
          </div>
        </div>

        {/* Right Box */}
        <div className="flex-1 rounded-[2rem] border border-zinc-200 bg-white p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-sm">
          <div className="w-full">
            <p className="text-xs font-bold tracking-[0.15em] text-zinc-500 uppercase mb-3">
              Reference number
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl py-4 px-5 shadow-inner flex items-center justify-between group">
              <p className="text-brand-blue font-mono text-xl md:text-2xl font-bold tracking-wider">{ref}</p>
              <button
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-1",
                  copied ? "text-green-600 bg-green-100" : "text-zinc-400 hover:text-brand-blue hover:bg-zinc-200"
                )}
                title="Copy reference number"
              >
                {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <p className="text-base md:text-[14px] leading-relaxed text-zinc-800">
            Keep this reference for follow-up. Notifications will be sent to your administrative contact
            email when a decision is made.
            {hasVendorPortal ? (
              <>
                {" "}
                After approval, you will sign in at the{" "}
                <a
                  href={vendorLogin}
                  className="font-medium text-brand-blue underline underline-offset-4 hover:text-brand-blue/80 transition-colors"
                  rel="noopener noreferrer"
                >
                  supplier portal
                </a>
                .
              </>
            ) : null}
          </p>

          <div className="flex flex-col w-full gap-3 pt-2">
            <Button href={homeHref} variant="primary" className="w-full h-12 md:h-14 rounded-xl text-[14px] md:text-[15px] font-bold tracking-wide">
              BACK TO HOME
            </Button>
            <Button
              href={contactHref}
              variant="outline"
              className="w-full h-12 md:h-14 rounded-xl border-2 border-zinc-200 bg-white text-[14px] md:text-[15px] font-bold tracking-wide text-zinc-700 hover:border-brand-blue hover:text-brand-blue"
            >
              CONTACT PROCUREMENT
            </Button>
          </div>

          <p className="text-[14px] md:text-[15px] text-zinc-500 w-full pt-2 border-t border-zinc-100">
            Need to start another draft?{" "}
            <a href={enquireVerifyUrl()} className="font-medium underline underline-offset-4 hover:text-zinc-800 transition-colors">
              E-Vendor Registration
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
