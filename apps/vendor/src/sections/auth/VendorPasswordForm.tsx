"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo,useState } from "react";

import { SubmitLoader } from "@/components/ui/loader";
import { readApiError } from "@/lib/read-error";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 12;

function getStrength(pw: string): { label: string; score: number; color: string } {
  let score = 0;
  if (pw.length >= MIN_LENGTH) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", score, color: "bg-red-500" };
  if (score <= 3) return { label: "Fair", score, color: "bg-amber-500" };
  if (score <= 4) return { label: "Good", score, color: "bg-brand-blue" };
  return { label: "Strong", score, color: "bg-emerald-500" };
}

const inputBase =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-base text-zinc-950 tabular-nums placeholder:text-zinc-400 outline-none transition-[border-color,box-shadow] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 sm:text-[17px] aria-invalid:border-red-400 aria-invalid:ring-red-400/20";

export function VendorPasswordForm({ mustChange }: { mustChange: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const ready = current && next.length >= MIN_LENGTH && next === confirm;

  const strength = useMemo(() => getStrength(next), [next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/password", {
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
      if (mustChange) router.replace("/");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done && !mustChange) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900">Password Updated</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Other devices have been signed out for security.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Current / Temporary Password */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-bold tracking-[0.05em] text-zinc-600 uppercase sm:text-base">
          {mustChange ? "Temporary password" : "Current password"}
          <span className="text-brand-blue">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            className={cn(inputBase, "pr-11")}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((s) => !s)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
            tabIndex={-1}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-bold tracking-[0.05em] text-zinc-600 uppercase sm:text-base">
          New password
          <span className="text-brand-blue">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={tooShort || undefined}
            className={cn(inputBase, "pr-11")}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowNext((s) => !s)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
            tabIndex={-1}
            aria-label={showNext ? "Hide password" : "Show password"}
          >
            {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength indicator */}
        {next.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i < strength.score ? strength.color : "bg-zinc-200"
                  )}
                />
              ))}
            </div>
            <p
              className={cn("text-xs font-medium", {
                "text-red-500": strength.label === "Weak",
                "text-amber-500": strength.label === "Fair",
                "text-brand-blue": strength.label === "Good",
                "text-emerald-500": strength.label === "Strong",
              })}
            >
              {strength.label}
            </p>
          </div>
        )}

        {next.length === 0 && (
          <p className="text-xs text-zinc-400">At least {MIN_LENGTH} characters.</p>
        )}
        {tooShort && (
          <p className="text-xs font-medium text-red-500">
            Need at least {MIN_LENGTH} characters — {MIN_LENGTH - next.length} more to go.
          </p>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-bold tracking-[0.05em] text-zinc-600 uppercase sm:text-base">
          Confirm new password
          <span className="text-brand-blue">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className="relative">
          <input
            type="password"
            autoComplete="new-password"
            aria-invalid={mismatch || undefined}
            className={cn(inputBase, mismatch && "border-red-400 ring-red-400/20")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {confirm.length > 0 && !mismatch && (
            <CheckCircle2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-emerald-500" />
          )}
        </div>
        {mismatch && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            Passwords do not match.
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={busy || !ready}
        className={cn(
          "group border-brand-blue bg-brand-blue relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border-2 px-8 text-sm font-bold tracking-[0.1em] text-white uppercase transition-all duration-200",
          "hover:bg-brand-blue/90 active:scale-[0.98]",
          "focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-55 disabled:active:scale-100",
          "sm:text-base"
        )}
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <SubmitLoader text={mustChange ? "Setting…" : "Saving…"} />
          </span>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            <span>{mustChange ? "Set Password & Continue" : "Change Password"}</span>
            <ArrowRight className="h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
          </>
        )}
      </button>
    </form>
  );
}
