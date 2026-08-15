import { requireAgent } from "@/lib/auth/agent-guard";

import { PortalSignOutButton } from "./PortalSignOutButton";

export default async function PortalHome() {
  const agent = await requireAgent();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Portal</h1>
          <p className="mt-2 text-neutral-600">Signed in as {agent.email}</p>
        </div>
        <PortalSignOutButton />
      </div>
      <p className="mt-8 text-neutral-600">
        You have no open requirements right now. You will get an email when one is sent to you.
      </p>
    </main>
  );
}
