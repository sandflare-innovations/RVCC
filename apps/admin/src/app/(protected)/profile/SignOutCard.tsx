"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";

export function SignOutCard() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    signOutInstant(ADMIN_LOGIN_EXPIRED_PATH);
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-red-500 hover:shadow-md transition-all text-left disabled:opacity-50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <LogOut className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-red-600">Sign Out</h3>
        <p className="text-xs text-zinc-500">Log out of your admin session on this device</p>
      </div>
    </button>
  );
}
