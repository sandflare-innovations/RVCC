import { VendorLoginForm } from "@/sections/vendor/VendorLoginForm";

export default function VendorLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-brand-blue text-xs font-bold tracking-[0.24em] uppercase">
            RVCC Supplier Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Approved suppliers only. Not registered yet?{" "}
            <a href="/enquire" className="text-brand-blue underline underline-offset-2">
              Start an E-Vendor Registration
            </a>
            .
          </p>
        </div>
        <VendorLoginForm />
      </div>
    </main>
  );
}
