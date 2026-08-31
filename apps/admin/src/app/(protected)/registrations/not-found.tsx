import { ClipboardList, FileText, Globe,LayoutDashboard, Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Registration not found"
      message="This registration may have been deleted, or the link you followed is incorrect."
      isAuthenticated
      suggestions={[
        {
          label: "All Registrations",
          href: "/registrations",
          icon: <FileText className="h-5 w-5" />,
        },
        { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
        {
          label: "Requirements",
          href: "/requirements",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        { label: "Vendors", href: "/vendors", icon: <Users className="h-5 w-5" /> },
        { label: "Content", href: "/content", icon: <Globe className="h-5 w-5" /> },
      ]}
    />
  );
}
