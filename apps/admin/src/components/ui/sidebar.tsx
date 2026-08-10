"use client";

import React, { createContext, useContext, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * Hover-expand sidebar. Retheme of the supplied component: the original's
 * neutral-100/neutral-800 + dark: variants are replaced with the admin's
 * zinc scaffolding and brand-blue as the only chromatic accent.
 */

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Match on prefix rather than equality — /admin would otherwise always win. */
  exact?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
);

export const SidebarBody = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <>
    <DesktopSidebar className={className}>{children}</DesktopSidebar>
    <MobileSidebar className={className}>{children}</MobileSidebar>
  </>
);

export const DesktopSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4 md:flex",
        className
      )}
      animate={{ width: animate ? (open ? 248 : 68) : 248 }}
      initial={false}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <div className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
      <span className="text-brand-blue text-[11px] font-bold tracking-[0.2em] uppercase">
        RVCC Admin
      </span>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn("fixed inset-0 z-[100] flex flex-col bg-white p-6", className)}
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 rounded-md p-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  active = false,
  className,
  onClick,
}: {
  link: SidebarLinkItem;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={link.label}
      className={cn(
        "group/sidebar flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
        active ? "bg-brand-blue text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
        className
      )}
    >
      <span className="shrink-0">{link.icon}</span>
      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          // Collapsed labels must not remain focusable or hoverable.
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
        }}
        initial={false}
        className="inline-block text-sm font-medium whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
