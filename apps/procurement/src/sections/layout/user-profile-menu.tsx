"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, Shield, Mail } from "lucide-react";
import { PROCUREMENT_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";

interface UserProfileMenuProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayEmail = user?.email || "procurement@rvcc.com";
  const displayName = user?.name || displayEmail.split("@")[0] || "Procurement Staff";
  const displayRole = user?.role ? user.role.replace(/_/g, " ") : "Staff Member";
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleSignOut = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    signOutInstant(PROCUREMENT_LOGIN_EXPIRED_PATH);
  };

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Profile Button — circle avatar only */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`${displayName} (${displayEmail})`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0073bc] text-sm font-bold text-white shadow-xs transition-all hover:ring-3 hover:ring-[#0073bc]/25 hover:shadow-md active:scale-95 cursor-pointer focus:outline-none focus:ring-3 focus:ring-[#0073bc]/30"
      >
        {userInitial}
      </button>

      {/* Popover / Dropdown Menu on Click or Hover */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-zinc-100/90 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* User Header Details */}
          <div className="flex items-start gap-3 pb-3 border-b border-zinc-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0073bc] text-sm font-bold text-white shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-900 leading-snug truncate">
                {displayName}
              </p>
              <p className="text-xs text-zinc-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 shrink-0 text-zinc-400" />
                <span className="truncate">{displayEmail}</span>
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#0073bc]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-[#0073bc]">
                <Shield className="h-2.5 w-2.5" />
                <span>{displayRole}</span>
              </div>
            </div>
          </div>

          {/* Action item: Sign Out */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
