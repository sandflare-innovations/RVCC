import Link from "next/link";

export default function AccessHeldPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <p className="text-brand-blue text-xs font-bold tracking-[0.24em] uppercase">
            RVCC Vendor Portal
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            Account Registered Successfully
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Your vendor registration is complete. Thank you for submitting your details to RVCC
            procurement.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5">
          <p className="text-sm font-bold tracking-[0.12em] text-amber-950 uppercase">
            Vendor Access Held
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
            Portal pages are not available yet. RVCC must <strong>release</strong> your access from
            User Management. You will receive an email when you can sign in and use the vendor
            portal.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/login" className="text-brand-blue underline underline-offset-2">
            Try password sign-in later
          </Link>
          <Link href="/register/verify" className="text-zinc-500 underline underline-offset-2">
            Use a different email
          </Link>
        </div>
      </div>
    </main>
  );
}
