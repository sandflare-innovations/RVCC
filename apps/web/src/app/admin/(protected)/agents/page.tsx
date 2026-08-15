import { requireAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db";

import { AgentForm } from "./AgentForm";
import { AgentToggle } from "./AgentToggle";

export default async function AgentsPage() {
  await requireAdmin();

  const agents = await prisma.agent.findMany({
    orderBy: [{ isActive: "desc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, company: true, isActive: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Agents</h1>
      <p className="mt-2 text-neutral-600">
        Only agents listed here can sign in to the portal and receive requirements.
      </p>

      <AgentForm />

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300">
            <th className="py-2">Email</th>
            <th className="py-2">Name</th>
            <th className="py-2">Company</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-b border-neutral-200">
              <td className="py-2">{agent.email}</td>
              <td className="py-2">{agent.name}</td>
              <td className="py-2">{agent.company}</td>
              <td className="py-2">{agent.isActive ? "Active" : "Inactive"}</td>
              <td className="py-2 text-right">
                <AgentToggle id={agent.id} isActive={agent.isActive} />
              </td>
            </tr>
          ))}
          {agents.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-neutral-500">
                No agents yet. Add the first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
