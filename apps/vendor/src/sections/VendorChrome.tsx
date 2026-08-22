"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, Bell, ClipboardList } from "lucide-react";

import type { VendorIdentity } from "@/lib/session";
import { SmoothScroll } from "@/components/ui";
import { NotificationBell } from "@/sections/NotificationBell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/requirements", label: "My RFQs / Bids", icon: ClipboardList },
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

  const initial = (vendor.name || vendor.email).charAt(0).toUpperCase();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-50 font-enquire selection:bg-white selection:text-brand-blue">
      <SmoothScroll className="h-full min-h-0 flex-1" paused={mobileMenuOpen}>
      <div className="flex min-h-full flex-col">
      {/* Top Navigation Bar Container */}
      <div className="w-full px-4 md:px-6 pt-4 md:pt-6">
        <header 
          className={cn(
            "bg-brand-blue mx-auto w-full z-50 relative transition-all duration-300 px-6 py-4 md:px-10",
            pathname === "/" ? "rounded-t-[2.5rem]" : "rounded-[2.5rem]"
          )}
        >
          <div className="flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/images/logo/logo.webp" alt="RVCC Logo" className="h-6 md:h-8 w-auto brightness-0 invert" />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-8 md:flex">
              {!vendor.mustChangePassword &&
                NAV.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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

            {/* Right Actions (Notification + Profile) */}
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell />

              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-brand-blue shadow-sm transition-transform hover:scale-105 active:scale-95"
                title="My Profile"
              >
                <span className="text-sm font-bold">{initial}</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-sm md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-white p-6"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <span className="text-sm font-bold tracking-[0.2em] text-zinc-950 uppercase">Menu</span>
              <button
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
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={cn("flex-1 w-full pb-12 px-4 md:px-6", pathname === "/" ? "pt-0" : "pt-6")}>
        <div className="mx-auto w-full">
          {children}
        </div>
      </main>
      </div>
      </SmoothScroll>
    </div>
  );
}
