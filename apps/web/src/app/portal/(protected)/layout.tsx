import { requireAgent } from "@/lib/auth/agent-guard";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireAgent();
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
