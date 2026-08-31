import { ClipboardList, FileText, Globe, LayoutDashboard, User,Users } from "lucide-react";

import { NotFoundPage } from "@/components/ui/not-found-page";
import { getAdminFromSession } from "@/lib/session";

export default async function NotFound() {
  const admin = await getAdminFromSession();
  const isAuthenticated = Boolean(admin);

  if (isAuthenticated) {
    return (
      <NotFoundPage
        title="Page not found"
        message="The page you're looking for doesn't exist or has been moved."
        isAuthenticated
        suggestions={[
          { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
          {
            label: "Requirements",
            href: "/requirements",
            icon: <ClipboardList className="h-5 w-5" />,
          },
          { label: "Vendors", href: "/vendors", icon: <Users className="h-5 w-5" /> },
          {
            label: "Registrations",
            href: "/registrations",
            icon: <FileText className="h-5 w-5" />,
          },
          { label: "Content", href: "/content", icon: <Globe className="h-5 w-5" /> },
          { label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
        ]}
      />
    );
  }

  return (
    <NotFoundPage
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      isAuthenticated={false}
    />
  );
}
