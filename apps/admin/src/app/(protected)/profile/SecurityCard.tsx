"use client";

import { useState } from "react";
import { Shield, KeyRound } from "lucide-react";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function SecurityCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="group relative rounded-3xl border border-zinc-100/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] hover:border-brand-blue/20 transition-all duration-300">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-zinc-900">Security</h2>
            <p className="text-xs text-zinc-500">Session & access status</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-brand-blue hover:text-white transition-all duration-200"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </button>
        </div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0 last:pb-0 first:pt-0">
            <span className="text-xs font-medium text-zinc-500">Session Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0 last:pb-0 first:pt-0">
            <span className="text-xs font-medium text-zinc-500">Validation</span>
            <span className="text-xs font-medium text-zinc-700">Per-request</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0 last:pb-0 first:pt-0">
            <span className="text-xs font-medium text-zinc-500">Cookie Type</span>
            <span className="text-xs font-mono text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded">httpOnly</span>
          </div>
        </div>
      </div>

      <ChangePasswordForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
