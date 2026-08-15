import { redirect } from "next/navigation";

import { getAgentFromCookies } from "@/lib/auth/agent-guard";

export default async function PortalLoginLayout({ children }: { children: React.ReactNode }) {
  const agent = await getAgentFromCookies();
  if (agent) redirect("/portal");
  return <>{children}</>;
}
