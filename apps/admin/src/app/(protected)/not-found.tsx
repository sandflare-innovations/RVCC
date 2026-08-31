import { ClipboardList, FileText, Globe, LayoutDashboard,User, Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Page not found"
      message="The admin page you're looking for doesn't exist or has been removed."
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
        { label: "Content", href: "/content", icon: <Globe className="h-5 w-5" /> },
        { label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
      ]}
    />
  );
}
