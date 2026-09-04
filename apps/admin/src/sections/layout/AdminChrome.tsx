"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  ClipboardList,
  Download,
  FileArchive,
  FileText,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiSlideshowLight } from "react-icons/pi";

import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { useInstallPrompt } from "@/lib/pwa/install-prompt";
import type { AdminIdentity } from "@/lib/session";
import { signOutInstant } from "@/lib/sign-out-client";

const ICON = "h-5 w-5 shrink-0";

const VENDOR_NAV = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/procurement", label: "Procurements", icon: <ShoppingBag className={ICON} /> },
  { href: "/vendors", label: "Vendor Accounts", icon: <Users className={ICON} /> },
  { href: "/requirements", label: "RFQs / Requirements", icon: <ClipboardList className={ICON} /> },
  { href: "/live-market", label: "Live Market", icon: <TrendingUp className={ICON} /> },
  { href: "/registrations", label: "Vendor Registrations", icon: <FileText className={ICON} /> },
  { href: "/staff", label: "Staff & Admins", icon: <ShieldCheck className={ICON} /> },
];

const WEBSITE_NAV = [
  { href: "/content", label: "Dashboard", icon: <LayoutDashboard className={ICON} />, exact: true },
  { href: "/content/hero", label: "Hero Slides", icon: <PiSlideshowLight className={ICON} /> },
  { href: "/content/projects", label: "Projects", icon: <Briefcase className={ICON} /> },
  { href: "/content/gallery", label: "Gallery", icon: <ImageIcon className={ICON} /> },
  { href: "/content/services", label: "Services", icon: <Wrench className={ICON} /> },
  { href: "/content/about", label: "About Page", icon: <Info className={ICON} /> },
  { href: "/content/clients", label: "Clients", icon: <UserCheck className={ICON} /> },
  { href: "/content/companies", label: "Our Companies", icon: <Building2 className={ICON} /> },
  { href: "/content/careers", label: "Careers", icon: <Briefcase className={ICON} /> },
  { href: "/content/documents", label: "File Manager", icon: <FolderOpen className={ICON} /> },
  {
    href: "/content/quality-policy",
    label: "Quality Policy",
    icon: <ShieldCheck className={ICON} />,
  },
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
  const allowProcurement =
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROCUREMENT_ADMIN";
  const allowStaff = role === "SUPER_ADMIN" || role === "ADMIN";

  // Filter VENDOR_NAV according to permissions
  const filteredVendorNav = VENDOR_NAV.filter((item) => {
    if (item.href === "/procurement") return allowProcurement;
    if (item.href === "/staff") return allowStaff;
    if (
      item.href === "/" ||
      item.href === "/vendors" ||
      item.href === "/requirements" ||
      item.href === "/registrations" ||
      item.href === "/live-market"
    ) {
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Fixed Sidebar Header / Portal Switcher */}
      <div className="relative mb-3 shrink-0 py-1">
        <button
          onClick={() => {
            if (canSwitchPortals) setDashboardMenuOpen(!dashboardMenuOpen);
          }}
          disabled={!canSwitchPortals}
          onBlur={() => setTimeout(() => setDashboardMenuOpen(false), 200)}
          className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${canSwitchPortals ? "cursor-pointer hover:bg-white/10" : "cursor-default"
            }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm">
            <img
              src="/images/logo/logo.webp"
              alt="RVCC Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <motion.div
            animate={{ opacity: expanded ? 1 : 0, display: expanded ? "flex" : "none" }}
            initial={false}
            className="flex min-w-0 flex-1 items-center justify-between"
          >
            <div className="min-w-0 pr-2">
              <span className="block truncate text-sm font-semibold text-white">
                {effectiveIsWebsite
                  ? "Company Website"
                  : role === "PROCUREMENT_ADMIN"
                    ? "Procurement"
                    : "Vendor Management"}
              </span>
              <span className="block text-[11px] text-blue-200">
                {role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : role === "WEBSITE_ADMIN"
                    ? "Website CMS"
                    : role === "PROCUREMENT_ADMIN"
                      ? "Procurement Portal"
                      : "Administration"}
              </span>
            </div>
            {canSwitchPortals && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 text-blue-200 transition-transform ${dashboardMenuOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </motion.div>
        </button>

        {dashboardMenuOpen && expanded && canSwitchPortals && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
            {allowVendors && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDashboardMenuOpen(false);
                  router.push("/");
                  onNavigate();
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 ${!isWebsiteDashboard ? "text-brand-blue bg-blue-50/50 font-semibold" : "text-zinc-700"}`}
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
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 ${isWebsiteDashboard ? "text-brand-blue bg-blue-50/50 font-semibold" : "text-zinc-700"}`}
              >
                <Globe className="h-4 w-4" />
                Company Website
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center Portion: Scrollable Menu Items */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

      {/* Fixed Sidebar Bottom Profile / Actions Item */}
      <div className="mt-3 shrink-0 pt-1">
        <div
          className={`overflow-hidden rounded-2xl bg-zinc-100 p-1.5 shadow-sm ${expanded ? "" : "flex flex-col items-center gap-1"
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
                className={`focus-visible:ring-brand-blue/30 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:outline-none ${prompting ? "opacity-70" : ""
                  } ${expanded ? "" : "justify-center"}`}
              >
                <span className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <Download className="h-4 w-4" />
                </span>
                <motion.span
                  animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
                  initial={false}
                  className="min-w-0 flex-1 text-left whitespace-nowrap"
                >
                  <span className="text-brand-blue block truncate text-sm font-semibold">
                    Install App
                  </span>
                </motion.span>
              </button>

              <div className={`bg-zinc-200/80 ${expanded ? "mx-2 h-px" : "h-px w-6"}`} />
            </>
          )}

          <Link
            href="/profile"
            onClick={onNavigate}
            className={`group focus-visible:ring-brand-blue/30 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:outline-none ${expanded ? "" : "justify-center"
              }`}
          >
            <span className="bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
              {(admin.name || admin.email).charAt(0).toUpperCase()}
            </span>
            <motion.span
              animate={{ opacity: expanded ? 1 : 0, display: expanded ? "block" : "none" }}
              initial={false}
              className="min-w-0 flex-1 whitespace-nowrap"
            >
              <span className="text-brand-blue block truncate text-sm font-semibold">
                {admin.name || admin.email}
              </span>
              <span className="text-brand-blue/70 block text-[11px]">
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

      <div className="my-3 mr-3 ml-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/60 bg-white">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl p-4">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
