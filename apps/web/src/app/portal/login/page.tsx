"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enter a valid email address.");
        return;
      }
      setNotice(data.message);
      setStep("code");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That code is invalid or has expired. Request a new one.");
        return;
      }
      router.replace("/portal");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form
        onSubmit={step === "email" ? requestCode : submitCode}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold">Agent sign in</h1>

        <label className="block">
          <span className="text-sm text-neutral-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={step === "code"}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 disabled:bg-neutral-100"
          />
        </label>

        {step === "code" && (
          <label className="block">
            <span className="text-sm text-neutral-700">6-digit code</span>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 tracking-widest"
            />
          </label>
        )}

        {notice && <p className="text-sm text-neutral-600">{notice}</p>}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Working…" : step === "email" ? "Send me a code" : "Sign in"}
        </button>

        {step === "code" && (
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setNotice(null);
              setError(null);
            }}
            className="w-full text-sm text-neutral-600 underline"
          >
            Use a different email
          </button>
        )}
      </form>
    </main>
  );
}
