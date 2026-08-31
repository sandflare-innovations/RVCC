import { ClipboardList, FileText,LayoutDashboard, Plus, Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Requirement not found"
      message="This requirement may have been deleted, or the link you followed is incorrect."
      isAuthenticated
      suggestions={[
        {
          label: "All Requirements",
          href: "/requirements",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        { label: "Post New", href: "/requirements/new", icon: <Plus className="h-5 w-5" /> },
        { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Vendors", href: "/vendors", icon: <Users className="h-5 w-5" /> },
        { label: "Registrations", href: "/registrations", icon: <FileText className="h-5 w-5" /> },
      ]}
    />
  );
}
