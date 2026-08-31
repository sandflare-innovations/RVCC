import { ClipboardList, FileText,LayoutDashboard, Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Profile not found"
      message="Your profile information could not be loaded. Please try signing in again."
      isAuthenticated
      suggestions={[
        { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
        {
          label: "Requirements",
          href: "/requirements",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        { label: "Vendors", href: "/vendors", icon: <Users className="h-5 w-5" /> },
        { label: "Registrations", href: "/registrations", icon: <FileText className="h-5 w-5" /> },
      ]}
    />
  );
}
