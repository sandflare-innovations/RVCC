import { NotFoundPage } from "@/components/ui/not-found-page";
import { LayoutDashboard, ClipboardList, Users, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <NotFoundPage
      title="Profile not found"
      message="Your profile information could not be loaded. Please try signing in again."
      isAuthenticated
      suggestions={[
        { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Requirements", href: "/requirements", icon: <ClipboardList className="h-5 w-5" /> },
        { label: "Vendors", href: "/vendors", icon: <Users className="h-5 w-5" /> },
        { label: "Registrations", href: "/registrations", icon: <FileText className="h-5 w-5" /> },
      ]}
    />
  );
}
