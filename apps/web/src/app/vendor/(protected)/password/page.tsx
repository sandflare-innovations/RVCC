import { redirect } from "next/navigation";

import { getVendorFromSession } from "@/lib/vendor/session";
import { VendorPasswordForm } from "@/sections/vendor/VendorPasswordForm";

export const dynamic = "force-dynamic";

export default async function VendorPasswordPage() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect("/vendor/login");

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {vendor.mustChangePassword ? "Set your password" : "Change password"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {vendor.mustChangePassword
            ? "Your account was created with a temporary password. Choose a new one to continue."
            : "Changing your password signs you out on all other devices."}
        </p>
      </div>
      <VendorPasswordForm mustChange={vendor.mustChangePassword} />
    </div>
  );
}
