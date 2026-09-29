"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, FileText, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SmoothScroll } from "@/components/ui";
import { VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import type { VendorIdentity } from "@/lib/session";
import { signOutInstant } from "@/lib/sign-out-client";
import { cn } from "@/lib/utils";

import { NotificationBell } from "./NotificationBell";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/requirements", label: "My RFQs / Bids", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function VendorChrome({
  vendor,
  children,
}: {
  vendor: VendorIdentity;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const initial = (vendor.name || vendor.email).charAt(0).toUpperCase();

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKey);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  function signOut() {
    signOutInstant(VENDOR_LOGIN_EXPIRED_PATH);
  }

  return (
    <div className="font-enquire selection:text-brand-blue flex h-dvh flex-col overflow-hidden bg-zinc-50 selection:bg-white">
      <div className="relative z-50 w-full shrink-0 px-4 pt-4 md:px-6 md:pt-6">
        <header className="bg-brand-blue relative mx-auto w-full overflow-visible rounded-[2.5rem] px-6 py-4 md:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <img
                  src="/images/logo/logo.webp"
                  alt="RVCC Logo"
                  className="h-6 w-auto brightness-0 invert md:h-8"
                />
              </Link>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              {!vendor.mustChangePassword &&
                NAV.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white",
                        isActive ? "text-white" : "text-white/70"
                      )}
                      onMouseEnter={() => router.prefetch(item.href)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell />

              <div className="relative overflow-visible" ref={accountRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setAccountOpen((open) => !open);
                  }}
                  className="text-brand-blue flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="text-sm font-bold">{initial}</span>
                </button>
                {accountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-[200] w-48 rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-lg"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                    >
                      <UserRound className="h-4 w-4 text-zinc-500" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-sm md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-white p-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <span className="text-sm font-bold tracking-[0.2em] text-zinc-950 uppercase">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold tracking-tight text-zinc-950"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold tracking-tight text-zinc-950"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-left text-2xl font-bold tracking-tight text-red-600"
              >
                Sign out
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SmoothScroll className="h-full min-h-0 flex-1" paused={mobileMenuOpen}>
        <main
          className={cn("w-full flex-1 px-4 pb-12 md:px-6", pathname === "/" ? "pt-0" : "pt-6")}
        >
          <div className="mx-auto w-full">{children}</div>
        </main>
      </SmoothScroll>
    </div>
  );
}
