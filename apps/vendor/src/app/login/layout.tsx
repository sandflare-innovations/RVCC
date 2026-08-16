import { PortalShell } from "@/components/layout/PortalShell";

export { metadata } from "@/components/layout/PortalShell";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
