import { adminSessionJson } from "@/lib/admin-data";
import { PostRequirementForm } from "@/sections/PostRequirementForm";
import type { CachedVendorRow } from "@/lib/vendor-cache";
import { SmoothScroll } from "@/components/ui";


export const dynamic = "force-dynamic";

export default async function NewRequirementPage() {
  const vendorsResult = await adminSessionJson<CachedVendorRow[]>("/vendors?filter=RELEASED");
  
  // Filter only active ones, just like RequirementsPanel did
  const activeVendors = vendorsResult.ok 
    ? vendorsResult.data.filter((v) => v.isActive && v.registrationComplete)
    : [];

  const vendorOptions = activeVendors.map((v) => ({
    id: v.id,
    label: v.companyName ? `${v.companyName} (${v.email})` : v.email,
  }));

  return (
    <SmoothScroll className="w-full flex-1 flex flex-col min-h-0 bg-zinc-50/30">
      <PostRequirementForm vendors={vendorOptions} />
    </SmoothScroll>
  );
}
