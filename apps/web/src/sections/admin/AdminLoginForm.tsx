"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        return;
      }
      // `next` is validated as a same-site path to avoid an open redirect.
      const next = params.get("next");
      const dest = next && next.startsWith("/admin") ? next : "/admin";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <EnquireField label="Email" required>
        <input
          type="email"
          name="email"
          autoComplete="username"
          className={enquireInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@rvcc.com"
          required
        />
      </EnquireField>

      <EnquireField label="Password" required>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className={enquireInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </EnquireField>

      <InteractiveHoverButton
        type="submit"
        variant="solid"
        fullWidth
        pending={busy}
        disabled={!email.trim() || !password}
      >
        {busy ? "Signing in…" : "Sign In"}
      </InteractiveHoverButton>
    </form>
  );
}
