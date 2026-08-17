"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ClipboardList, KeyRound, LayoutDashboard, LogOut } from "lucide-react";

import type { VendorIdentity } from "@/lib/session";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/sections/NotificationBell";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/password", label: "Password", icon: KeyRound },
];

export function VendorChrome({
  vendor,
  children,
}: {
  vendor: VendorIdentity;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    for (const item of NAV) router.prefetch(item.href);
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    // Navigate first so the UI never waits on the network.
    router.replace("/login");
    void fetch("/api/logout", { method: "POST", credentials: "include" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="text-brand-blue text-xs font-bold tracking-[0.24em] uppercase">
            RVCC Supplier Portal
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">{vendor.name || vendor.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      {!vendor.mustChangePassword && (
        <nav className="flex gap-1.5 py-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-brand-blue inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-brand-blue text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      <main className="flex-1 py-4">{children}</main>
    </div>
  );
}
