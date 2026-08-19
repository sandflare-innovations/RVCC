"use client";

import { useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { ClipboardList, FileText, FolderOpen, LayoutDashboard, LogOut, Users } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";
import type { AdminIdentity } from "@/lib/session";
import { NotificationBell } from "@/sections/NotificationBell";

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
        <span className="bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white">
          R
        </span>
        <motion.span
          animate={{
            opacity: expanded ? 1 : 0,
            display: expanded ? "block" : "none",
          }}
          initial={false}
          className="whitespace-nowrap"
        >
          <span className="block text-sm font-semibold text-zinc-950">Administration</span>
          <span className="block text-[11px] text-zinc-500">RVCC</span>
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

      <div className="border-t border-zinc-200 pt-3">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            {(admin.name || admin.email).charAt(0).toUpperCase()}
          </span>
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
            initial={false}
            className="min-w-0 whitespace-nowrap"
          >
            <span className="block truncate text-sm font-medium text-zinc-950">
              {admin.name || admin.email}
            </span>
            <span className="block text-[11px] text-zinc-500">
              {admin.role.replace("_", " ").toLowerCase()}
            </span>
          </motion.span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          title="Sign out"
          className="focus-visible:ring-brand-blue flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          <LogOut className={ICON} aria-hidden="true" />
          <motion.span
            animate={{ opacity: expanded ? 1 : 0, display: expanded ? "inline-block" : "none" }}
            initial={false}
            className="text-sm font-medium whitespace-nowrap"
          >
            Sign out
          </motion.span>
        </button>
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
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const prefetch = (href: string) => {
    router.prefetch(href);
  };

  const signOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    signOutInstant(ADMIN_LOGIN_EXPIRED_PATH);
  };

  return (
    <div className="flex h-screen bg-zinc-50/50">
      <Sidebar open={open} setOpen={setOpen}>
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md md:px-8">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
