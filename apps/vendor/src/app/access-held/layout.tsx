import { PortalShell } from "@/components/layout/PortalShell";

export { metadata } from "@/components/layout/PortalShell";

export default function AccessHeldLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
