"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { ClipboardList, FileText, FolderOpen, LayoutDashboard, LogOut, Users, Globe, Image as ImageIcon, Briefcase, Wrench, Info, UserCheck, FileArchive, ShieldCheck, Download, ShoppingBag } from "lucide-react";

import { useInstallPrompt } from "@/lib/pwa/install-prompt";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";
import type { AdminIdentity } from "@/lib/session";

const ICON = "h-5 w-5 shrink-0";

const VENDOR_NAV = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/procurement", label: "Procurements", icon: <ShoppingBag className={ICON} /> },
  { href: "/vendors", label: "Vendor Accounts", icon: <Users className={ICON} /> },
  { href: "/requirements", label: "RFQs / Requirements", icon: <ClipboardList className={ICON} /> },
  { href: "/registrations", label: "Vendor Registrations", icon: <FileText className={ICON} /> },
  { href: "/staff", label: "Staff & Admins", icon: <ShieldCheck className={ICON} /> },
];




const WEBSITE_NAV = [
  { href: "/content", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/content/projects", label: "Projects", icon: <Briefcase className={ICON} /> },
  { href: "/content/gallery", label: "Gallery", icon: <ImageIcon className={ICON} /> },
  { href: "/content/services", label: "Services", icon: <Wrench className={ICON} /> },
  { href: "/content/about", label: "About Page", icon: <Info className={ICON} /> },
  { href: "/content/clients", label: "Clients", icon: <UserCheck className={ICON} /> },
  { href: "/content/careers", label: "Careers", icon: <FolderOpen className={ICON} /> },
  { href: "/content/documents", label: "Documents", icon: <FileArchive className={ICON} /> },
  { href: "/content/quality-policy", label: "Quality Policy", icon: <ShieldCheck className={ICON} /> },
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
  const router = useRouter();
  const { open, animate } = useSidebar();
  const expanded = animate ? open : true;

  const role = admin.role;
  const allowVendors = role === "SUPER_ADMIN" || role === "ADMIN" || role === "VENDOR_ADMIN";
  const allowWebsite = role === "SUPER_ADMIN" || role === "ADMIN" || role === "WEBSITE_ADMIN";
  const allowProcurement = role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROCUREMENT_ADMIN";
  const allowStaff = role === "SUPER_ADMIN";

  // Filter VENDOR_NAV according to permissions
  const filteredVendorNav = VENDOR_NAV.filter((item) => {
    if (item.href === "/procurement") return allowProcurement;
    if (item.href === "/staff") return allowStaff;
    if (item.href === "/" || item.href === "/vendors" || item.href === "/requirements" || item.href === "/registrations") {
      return allowVendors;
    }
    return true;
  });

  const isWebsiteDashboard = pathname.startsWith("/content");
  // Default to Website nav if role is only WEBSITE_ADMIN
  const effectiveIsWebsite = allowWebsite && (!allowVendors || isWebsiteDashboard);
  const currentNav = effectiveIsWebsite ? WEBSITE_NAV : filteredVendorNav;

  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const canSwitchPortals = allowVendors && allowWebsite;


  const { showInstallButton, prompting, promptInstall } = useInstallPrompt();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 py-1 relative">
        <button
          onClick={() => {
            if (canSwitchPortals) setDashboardMenuOpen(!dashboardMenuOpen);
          }}
          disabled={!canSwitchPortals}
          onBlur={() => setTimeout(() => setDashboardMenuOpen(false), 200)}
          className={`flex items-center gap-2.5 w-full p-2 rounded-lg transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            canSwitchPortals ? "hover:bg-white/10 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="bg-white flex h-10 w-10 shrink-0 items-center justify-center rounded-md p-1 shadow-sm">
            <img
              src="/images/logo/logo.webp"
              alt="RVCC Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, display: expanded ? "flex" : "none" }}
            initial={false}
            className="flex-1 flex items-center justify-between min-w-0"
          >
            <div className="min-w-0 pr-2">
              <span className="block text-sm font-semibold text-white truncate">
                {effectiveIsWebsite ? "Company Website" : role === "PROCUREMENT_ADMIN" ? "Procurement" : "Vendor Management"}
              </span>
              <span className="block text-[11px] text-blue-200">
                {role === "SUPER_ADMIN" ? "Super Admin" : role === "WEBSITE_ADMIN" ? "Website CMS" : role === "PROCUREMENT_ADMIN" ? "Procurement Portal" : "Administration"}
              </span>
            </div>
            {canSwitchPortals && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-blue-200 transition-transform shrink-0 ${dashboardMenuOpen ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </motion.div>
        </button>

        {dashboardMenuOpen && expanded && canSwitchPortals && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50 overflow-hidden">
            {allowVendors && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDashboardMenuOpen(false);
                  router.push("/");
                  onNavigate();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 ${!isWebsiteDashboard ? "bg-blue-50/50 font-semibold text-brand-blue" : "text-zinc-700"}`}
              >
                <Users className="h-4 w-4" />
                Vendor Management
              </button>
            )}
            {allowWebsite && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDashboardMenuOpen(false);
                  router.push("/content");
                  onNavigate();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 ${isWebsiteDashboard ? "bg-blue-50/50 font-semibold text-brand-blue" : "text-zinc-700"}`}
              >
                <Globe className="h-4 w-4" />
                Company Website
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {currentNav.map((item) => (
          <SidebarLink
            key={item.href}
            link={item}
            onClick={onNavigate}
            onPrefetch={() => onPrefetch(item.href)}
            active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
          />
        ))}
      </nav>


      <div>
        <div
          className={`overflow-hidden rounded-2xl bg-zinc-100 p-1.5 shadow-sm ${
            expanded ? "" : "flex flex-col items-center gap-1"
          }`}
        >
          {/* Install App */}
          {showInstallButton && (
            <>
              <button
                type="button"
                title="Install RVCC Admin as an app"
                disabled={prompting}
                onClick={promptInstall}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-colors cursor-pointer hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 ${
                  prompting ? "opacity-70" : ""
                } ${expanded ? "" : "justify-center"}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"
                >
                  <Download className="h-4 w-4" />
                </span>
                <motion.span
                  animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
                  initial={false}
                  className="min-w-0 flex-1 whitespace-nowrap text-left"
                >
                  <span className="block truncate text-sm font-semibold text-brand-blue">Install App</span>
                </motion.span>
              </button>

              <div className={`bg-zinc-200/80 ${expanded ? "mx-2 h-px" : "h-px w-6"}`} />
            </>
          )}

          <Link
            href="/profile"
            onClick={onNavigate}
            className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 ${
              expanded ? "" : "justify-center"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white shadow-sm">
              {(admin.name || admin.email).charAt(0).toUpperCase()}
            </span>
            <motion.span
              animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
              initial={false}
              className="min-w-0 flex-1 whitespace-nowrap"
            >
              <span className="block truncate text-sm font-semibold text-brand-blue">
                {admin.name || admin.email}
              </span>
              <span className="block text-[11px] text-brand-blue/70">
                {admin.role.replace("_", " ").toLowerCase()}
              </span>
            </motion.span>
          </Link>
        </div>
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
    for (const item of [...VENDOR_NAV, ...WEBSITE_NAV]) {
      router.prefetch(item.href);
    }
  }, [router]);

  // Keep the current section warm when nested routes are open.
  useEffect(() => {
    const match = [...VENDOR_NAV, ...WEBSITE_NAV].find((item) =>
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
          <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
