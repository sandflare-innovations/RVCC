"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LuCheck as Check, LuCircleCheck as CheckCircle2,LuCopy as Copy } from "react-icons/lu";

import { Button } from "@/components/ui/Button";
import { enquireVerifyUrl, siteUrl, vendorPortalUrl } from "@/lib/public-urls";
import { cn } from "@/lib/utils";
import { useEnquire } from "@/sections/enquire/EnquireContext";

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
        <img src="/images/logo/logo.webp" alt="" className="max-w-12xl w-full object-contain" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-stretch gap-6 py-4 md:flex-row md:gap-8 md:py-8">
        {/* Left Box */}
        <div className="flex flex-1 flex-col items-center justify-center space-y-6 rounded-[2rem] border border-zinc-200 bg-zinc-50/50 p-8 text-center shadow-sm md:space-y-8 md:p-12">
          <div className="bg-brand-blue shadow-brand-blue/20 ring-brand-blue/5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl ring-8 md:h-20 md:w-20">
            <Check className="h-8 w-8 stroke-[3] text-white md:h-10 md:w-10" />
          </div>

          <div className="space-y-3 md:space-y-4">
            <h2 className="font-enquire text-brand-blue text-2xl font-bold tracking-tight uppercase md:text-3xl">
              Request received
            </h2>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-zinc-800 md:text-lg">
              Thank you for registering as a prospective supplier with RVCC. Your request is now in
              our procurement review queue.
            </p>
          </div>
        </div>

        {/* Right Box */}
        <div className="flex flex-1 flex-col items-center justify-center space-y-8 rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="w-full">
            <p className="mb-3 text-xs font-bold tracking-[0.15em] text-zinc-500 uppercase">
              Reference number
            </p>
            <div className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 shadow-inner">
              <p className="text-brand-blue font-mono text-xl font-bold tracking-wider md:text-2xl">
                {ref}
              </p>
              <button
                onClick={handleCopy}
                className={cn(
                  "focus:ring-brand-blue rounded-lg p-2 transition-colors focus:ring-2 focus:ring-offset-1 focus:outline-none",
                  copied
                    ? "bg-green-100 text-green-600"
                    : "hover:text-brand-blue text-zinc-400 hover:bg-zinc-200"
                )}
                title="Copy reference number"
              >
                {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <p className="text-base leading-relaxed text-zinc-800 md:text-[14px]">
            Keep this reference for follow-up. Notifications will be sent to your administrative
            contact email when a decision is made.
            {hasVendorPortal ? (
              <>
                {" "}
                After approval, you will sign in at the{" "}
                <a
                  href={vendorLogin}
                  className="text-brand-blue hover:text-brand-blue/80 font-medium underline underline-offset-4 transition-colors"
                  rel="noopener noreferrer"
                >
                  supplier portal
                </a>
                .
              </>
            ) : null}
          </p>

          <div className="flex w-full flex-col gap-3 pt-2">
            <Button
              href={homeHref}
              variant="primary"
              className="h-12 w-full rounded-xl text-[14px] font-bold tracking-wide md:h-14 md:text-[15px]"
            >
              BACK TO HOME
            </Button>
            <Button
              href={contactHref}
              variant="outline"
              className="hover:border-brand-blue hover:text-brand-blue h-12 w-full rounded-xl border-2 border-zinc-200 bg-white text-[14px] font-bold tracking-wide text-zinc-700 md:h-14 md:text-[15px]"
            >
              CONTACT PROCUREMENT
            </Button>
          </div>

          <p className="w-full border-t border-zinc-100 pt-2 text-[14px] text-zinc-500 md:text-[15px]">
            Need to start another draft?{" "}
            <a
              href={enquireVerifyUrl()}
              className="font-medium underline underline-offset-4 transition-colors hover:text-zinc-800"
            >
              E-Vendor Registration
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
