"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { signOutInstant } from "@/lib/sign-out-client";

export function SignOutButton() {
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
      className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/25 hover:shadow-lg disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {signingOut ? "Signing out…" : "Sign Out"}
    </button>
  );
}
