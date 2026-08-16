"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { ClipboardList, FileText, FolderOpen, LayoutDashboard, LogOut, Users } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import type { AdminIdentity } from "@/lib/session";
import { NotificationBell } from "@/sections/NotificationBell";

const ICON = "h-5 w-5 shrink-0";

const NAV = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  {
    href: "/registrations",
    label: "Vendor Registrations",
    icon: <FileText className={ICON} />,
  },
  { href: "/requirements", label: "Requirements", icon: <ClipboardList className={ICON} /> },
  { href: "/vendors", label: "Vendor Accounts", icon: <Users className={ICON} /> },
  { href: "/content", label: "Site Content", icon: <FolderOpen className={ICON} /> },
];

/** Split out so it can call useSidebar(), which only exists inside <Sidebar>. */
function SidebarContents({
  admin,
  onNavigate,
  onSignOut,
  signingOut,
}: {
  admin: AdminIdentity;
  onNavigate: () => void;
  onSignOut: () => void;
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
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
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

  useEffect(() => {
    for (const item of NAV) {
      router.prefetch(item.href);
    }
    router.prefetch("/registrations?status=SUBMITTED");
    router.prefetch("/content/careers");
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    router.replace("/login");
    void fetch("/api/logout", { method: "POST", credentials: "include" });
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody>
          <SidebarContents
            admin={admin}
            signingOut={signingOut}
            onSignOut={() => void signOut()}
            onNavigate={() => setOpen(false)}
          />
        </SidebarBody>
      </Sidebar>

      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
        <div className="mb-4 flex justify-end">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
