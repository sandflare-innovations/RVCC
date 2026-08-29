"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export function ProcurementLoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSessionExpired = params.get("expired") === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      const next = params.get("next");
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.replace(dest);
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Sign In to Procurement
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your authorized RVCC staff credentials to access requisitions and material procurement.
        </p>
      </div>

      {isSessionExpired && !error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <span>Your session has expired. Please sign in again to continue.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@rvcc.com"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-xs transition-all outline-none placeholder:text-zinc-400 focus:border-[#0073bc] focus:ring-3 focus:ring-[#0073bc]/10"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-xs transition-all outline-none placeholder:text-zinc-400 focus:border-[#0073bc] focus:ring-3 focus:ring-[#0073bc]/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0073bc] py-3.5 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#005f9e] hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-400">
          Protected by RVCC enterprise multi-factor session security.
        </p>
      </div>
    </div>
  );
}
