import { getAdminFromSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SignOutCard } from "./SignOutCard";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const admin = await getAdminFromSession();
  if (!admin) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Admin Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage your administrative account.</p>
      </div>
      
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10 text-2xl font-bold text-brand-blue">
            {(admin.name || admin.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{admin.name || "Administrator"}</h2>
            <p className="text-sm text-zinc-500">{admin.email}</p>
            <p className="mt-1 inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
              Role: {admin.role.replace("_", " ").toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SignOutCard />
      </div>
    </div>
  );
}
