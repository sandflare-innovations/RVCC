import { ClipboardList, FileText, FolderOpen,Globe, LayoutDashboard, Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Content section not found"
      message="This content section may not exist yet, or the link you followed is incorrect."
      isAuthenticated
      suggestions={[
        { label: "All Content", href: "/content", icon: <Globe className="h-5 w-5" /> },
        { label: "Careers", href: "/content/careers", icon: <FolderOpen className="h-5 w-5" /> },
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
