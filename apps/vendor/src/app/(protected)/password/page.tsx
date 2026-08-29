import { redirect } from "next/navigation";

import { getVendorFromSession } from "@/lib/session";
import { VendorPasswordForm } from "@/sections/auth/VendorPasswordForm";

export const dynamic = "force-dynamic";

export default async function VendorPasswordPage() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect("/login");
  // Layout already redirects when mustChangePassword and path !== /password.

  return (
    <div className="flex min-h-[70dvh] items-center justify-center py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10">
            <svg
              className="h-8 w-8 text-brand-blue"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-3xl tracking-tight text-zinc-950 uppercase sm:text-4xl">
            {vendor.mustChangePassword ? "Set your password" : "Change password"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">
            {vendor.mustChangePassword
              ? "Your account was created with a temporary password. Choose a new one to continue."
              : "Changing your password signs you out on all other devices."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-8">
          <VendorPasswordForm mustChange={vendor.mustChangePassword} />
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          Use a strong, unique password that you don&apos;t use elsewhere.
        </p>
      </div>
    </div>
  );
}
