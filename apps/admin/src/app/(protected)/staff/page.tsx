import type { Metadata } from "next";

import { StaffPanel } from "@/sections/staff/StaffPanel";

export const metadata: Metadata = {
  title: "Staff & Administrators | RVCC Admin",
  description: "Manage internal staff credentials, roles, and administrative security.",
};

export default function StaffPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <StaffPanel />
    </div>
  );
}
