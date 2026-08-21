"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { ClipboardList, FileText, FolderOpen, LayoutDashboard, LogOut, Users } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";
import type { AdminIdentity } from "@/lib/session";

const ICON = "h-5 w-5 shrink-0";

const NAV = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/vendors", label: "Vendor Accounts", icon: <Users className={ICON} /> },
  { href: "/requirements", label: "RFQs / Requirements", icon: <ClipboardList className={ICON} /> },
  { href: "/registrations", label: "Vendor Registrations", icon: <FileText className={ICON} /> },
  { href: "/content", label: "Site Content", icon: <FolderOpen className={ICON} /> },
];

/** Split out so it can call useSidebar(), which only exists inside <Sidebar>. */
function SidebarContents({
  admin,
  onNavigate,
  onSignOut,
  onPrefetch,
  signingOut,
}: {
  admin: AdminIdentity;
  onNavigate: () => void;
  onSignOut: () => void;
  onPrefetch: (href: string) => void;
  signingOut: boolean;
}) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();
  const expanded = animate ? open : true;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-3 px-2.5 py-1">
        <div className="bg-white flex h-10 w-10 shrink-0 items-center justify-center rounded-md p-1 shadow-sm">
          <img
            src="/images/logo/logo.webp"
            alt="RVCC Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <motion.span
          animate={{
            opacity: expanded ? 1 : 0,
            display: expanded ? "block" : "none",
          }}
          initial={false}
          className="whitespace-nowrap"
        >
          <span className="block text-sm font-semibold text-white">Administration</span>
          <span className="block text-[11px] text-blue-200">RVCC</span>
        </motion.span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <SidebarLink
            key={item.href}
            link={item}
            onClick={onNavigate}
            onPrefetch={() => onPrefetch(item.href)}
            active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div className="border-t border-white/20 pt-3">
        <Link 
          href="/profile" 
          onClick={onNavigate}
          className="flex items-center gap-3 px-2.5 py-2 hover:bg-white/10 rounded-md transition-colors group focus-visible:ring-white focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-blue shadow-sm">
            {(admin.name || admin.email).charAt(0).toUpperCase()}
          </span>
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
            initial={false}
            className="min-w-0 whitespace-nowrap"
          >
            <span className="block truncate text-sm font-medium text-white group-hover:text-blue-50 transition-colors">
              {admin.name || admin.email}
            </span>
            <span className="block text-[11px] text-blue-200 group-hover:text-blue-100 transition-colors">
              {admin.role.replace("_", " ").toLowerCase()}
            </span>
          </motion.span>
        </Link>
      </div>
    </div>
  );
}

export function AdminChrome({
  admin,
  children,
}: {
  admin: AdminIdentity;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Warm all primary routes once after sign-in so sidebar clicks feel instant.
  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  // Keep the current section warm when nested routes are open.
  useEffect(() => {
    const match = NAV.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );
    if (match) router.prefetch(match.href);
  }, [pathname, router]);

  const prefetch = (href: string) => {
    router.prefetch(href);
  };

  const signOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    signOutInstant(ADMIN_LOGIN_EXPIRED_PATH);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50/50">
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody>
          <SidebarContents
            admin={admin}
            signingOut={signingOut}
            onSignOut={signOut}
            onNavigate={() => setOpen(false)}
            onPrefetch={prefetch}
          />
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden bg-white rounded-3xl my-3 mr-3 ml-3 border border-zinc-200/60 min-h-0 min-w-0">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-5 md:p-8 rounded-3xl">
          <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
