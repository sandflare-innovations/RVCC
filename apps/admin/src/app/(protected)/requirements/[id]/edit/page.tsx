import { notFound } from "next/navigation";
import { adminSessionJson } from "@/lib/admin-data";
import { PostRequirementForm } from "@/sections/PostRequirementForm";
import type { CachedVendorRow } from "@/lib/vendor-cache";

export const dynamic = "force-dynamic";

type Payload = {
  requirement: {
    id: string;
    project: string;
    scopeOfWork: string;
    currency: string;
    sellingPrice: string | number | null;
    closesAt: string;
  };
  invites: Array<{
    vendorUser: { id?: string; email: string };
  }>;
};

export default async function EditRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [vendorsResult, reqResult] = await Promise.all([
    adminSessionJson<CachedVendorRow[]>("/vendors?filter=RELEASED"),
    adminSessionJson<Payload>(`/requirements/${encodeURIComponent(id)}`)
  ]);

  if (!reqResult.ok) {
    if (reqResult.status === 404) notFound();
    return <p className="p-4">Could not load requirement ({reqResult.status}).</p>;
  }

  const activeVendors = vendorsResult.ok 
    ? vendorsResult.data.filter((v) => v.isActive && v.registrationComplete)
    : [];

  const vendorOptions = activeVendors.map((v) => ({
    id: v.id,
    label: v.companyName ? `${v.companyName} (${v.email})` : v.email,
  }));

  const { requirement: req, invites } = reqResult.data;
  
  // Parse category out of scopeOfWork if it exists
  let parsedScope = req.scopeOfWork;
  let parsedCategory = "";
  if (parsedScope.includes("\n\nCategory: ")) {
    const parts = parsedScope.split("\n\nCategory: ");
    parsedScope = parts[0];
    parsedCategory = parts[1];
  }

  const invitedVendorIds = invites.map(i => i.vendorUser.id || vendorOptions.find(v => v.label.includes(i.vendorUser.email))?.id).filter(Boolean) as string[];

  const initialData = {
    id: req.id,
    project: req.project,
    scopeOfWork: parsedScope,
    category: parsedCategory,
    currency: req.currency,
    sellingPrice: req.sellingPrice ? String(req.sellingPrice) : "",
    closesAt: req.closesAt,
    invitedVendorIds,
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-zinc-50/30">
      <PostRequirementForm vendors={vendorOptions} initialData={initialData} />
    </div>
  );
}
