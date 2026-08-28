"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
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

  const displayName = user?.name || user?.email?.split("@")[0] || "Procurement Staff";
  const displayRole = user?.role ? user.role.replace(/_/g, " ") : "Staff Member";
  const userInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    signOutInstant(PROCUREMENT_LOGIN_EXPIRED_PATH);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full bg-zinc-100/80 hover:bg-zinc-200/80 p-1.5 pr-3 text-left transition-all border border-zinc-200/70 shadow-xs cursor-pointer focus:outline-none"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0073bc] text-xs font-bold text-white shadow-xs">
          {userInitial}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-zinc-900 leading-tight max-w-[120px] truncate">
            {displayName}
          </p>
          <p className="text-[10px] text-zinc-500 capitalize leading-tight">
            {displayRole.toLowerCase()}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-zinc-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2.5 border-b border-zinc-100">
            <p className="text-xs font-bold text-zinc-900 truncate">{displayName}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email || "staff@rvcc.com"}</p>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0073bc]">
              <Shield className="h-3 w-3" />
              <span>{displayRole}</span>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
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
