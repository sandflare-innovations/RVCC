import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminFromSession } from "@/lib/session";
import { StaffPanel } from "@/sections/staff/StaffPanel";

export const metadata: Metadata = {
  title: "Staff & Administrators | RVCC Admin",
  description: "Manage internal staff credentials, roles, and administrative security.",
};

export default async function StaffPage() {
  const admin = await getAdminFromSession();
  if (admin?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <StaffPanel />
    </div>
  );
}

