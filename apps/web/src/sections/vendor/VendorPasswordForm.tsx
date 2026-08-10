"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { readApiError } from "@/lib/api/read-error";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";

const MIN_LENGTH = 12;

export function VendorPasswordForm({ mustChange }: { mustChange: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const ready = current && next.length >= MIN_LENGTH && next === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not change your password."));
        return;
      }
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      // The layout reads mustChangePassword server-side, so refresh before moving on.
      router.refresh();
      if (mustChange) router.replace("/vendor");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done && !mustChange) {
    return (
      <div className="border-brand-blue bg-brand-blue/5 flex items-start gap-2.5 rounded-lg border-l-4 px-4 py-3 text-sm font-medium text-zinc-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Password updated. Other devices have been signed out.</span>
      </div>
    );
  }

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

      <EnquireField label={mustChange ? "Temporary password" : "Current password"} required>
        <input
          type="password"
          autoComplete="current-password"
          className={enquireInputClass}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </EnquireField>

      <EnquireField label="New password" required hint={`At least ${MIN_LENGTH} characters.`}>
        <input
          type="password"
          autoComplete="new-password"
          aria-invalid={tooShort || undefined}
          className={enquireInputClass}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </EnquireField>

      <EnquireField label="Confirm new password" required>
        <input
          type="password"
          autoComplete="new-password"
          aria-invalid={mismatch || undefined}
          className={enquireInputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </EnquireField>

      {mismatch && <p className="text-sm font-medium text-zinc-900">Passwords do not match.</p>}

      <InteractiveHoverButton
        type="submit"
        variant="solid"
        fullWidth
        pending={busy}
        disabled={!ready}
      >
        {busy ? "Saving…" : mustChange ? "Set Password & Continue" : "Change Password"}
      </InteractiveHoverButton>
    </form>
  );
}
