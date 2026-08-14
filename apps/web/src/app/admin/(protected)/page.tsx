import { requireAdmin } from "@/lib/auth/admin-guard";

import { SignOutButton } from "./SignOutButton";

export default async function AdminHome() {
  const admin = await requireAdmin();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-neutral-600">Signed in as {admin.email}</p>
      <SignOutButton />
    </main>
  );
}
