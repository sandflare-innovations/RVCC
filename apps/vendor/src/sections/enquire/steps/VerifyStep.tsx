"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle2 } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";
import { enquireMutedClass } from "@/sections/enquire/enquire-typography";

const STEP_LABELS: Record<string, string> = {
  verify: "Verify",
  company: "Company Details",
  contacts: "Contacts",
  addresses: "Addresses",
  classifications: "Classifications",
  bank: "Bank Accounts",
  products: "Products & Services",
  questionnaire: "Questionnaire",
  review: "Review & Submit",
  done: "Complete",
};

type VerifyOutcome = "vendor" | "register" | "held" | "rejected";

export function VerifyStep() {
  const router = useRouter();
  const {
    registration,
    loading,
    hydrateAfterAuth,
    setError,
    setGateMessage,
    gateMessage,
    clearLocal,
  } = useEnquire();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [blocked, setBlocked] = useState<"held" | "rejected" | null>(null);

  const hasSession = Boolean(registration?.email) && !changingEmail && !blocked;

  const changeEmail = async () => {
    setBusy(true);
    setError(null);
    setGateMessage(null);
    setBlocked(null);
    try {
      await fetch("/api/enquire/logout", { method: "POST", credentials: "include" });
      clearLocal();
      setChangingEmail(true);
      setEmail("");
      setCode("");
      setPhase("email");
      setHint(null);
    } catch {
      setError("Could not reset verification — try again.");
    } finally {
      setBusy(false);
    }
  };

  const continueRegistration = () => {
    const step = registration?.currentStep;
    if (step && step !== "verify") {
      router.push(`/register/${step}`);
    } else {
      router.push("/register/company");
    }
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    setHint(null);
    setBlocked(null);
    try {
      const res = await fetch("/api/enquire/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data: { error?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON */
      }
      if (!res.ok) {
        setError(data.error || `Could not send code (${res.status})`);
        return;
      }
      setPhase("code");
      setHint(data.message || "Access code sent. Check your email.");
    } catch {
      setError("Network error — is the site running? Try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setError(null);
    setGateMessage(null);
    setBlocked(null);
    try {
      const res = await fetch("/api/enquire/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      let data: {
        error?: string;
        outcome?: VerifyOutcome;
        message?: string;
        mustChangePassword?: boolean;
      } = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON */
      }
      if (!res.ok) {
        setError(data.error || `Invalid code (${res.status})`);
        return;
      }

      const outcome = data.outcome || "register";

      if (outcome === "vendor") {
        clearLocal();
        router.replace(data.mustChangePassword ? "/portal/password" : "/portal");
        return;
      }

      if (outcome === "held") {
        clearLocal();
        router.replace("/access-held");
        return;
      }

      if (outcome === "rejected") {
        clearLocal();
        setBlocked("rejected");
        setGateMessage(
          data.message || "Your registration was not approved. Contact RVCC procurement for help."
        );
        setChangingEmail(false);
        return;
      }

      // register — browser cache only until final submit
      await hydrateAfterAuth(email.trim().toLowerCase());
      setChangingEmail(false);
      setHint(null);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !registration && !blocked) return null;

  if (blocked && gateMessage) {
    return (
      <div className="max-w-lg space-y-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5">
          <p className="font-heading text-xl tracking-[0.04em] text-zinc-950 uppercase sm:text-2xl">
            Registration not completed
          </p>
          <p className={`mt-3 ${enquireMutedClass}`}>{gateMessage}</p>
        </div>
        <EnquireActions>
          <InteractiveHoverButton type="button" disabled={busy} onClick={() => void changeEmail()}>
            Use a different email
          </InteractiveHoverButton>
          <a
            href="/login"
            className="text-brand-blue text-sm font-semibold underline underline-offset-2"
          >
            Password sign-in
          </a>
        </EnquireActions>
      </div>
    );
  }

  if (hasSession) {
    const nextStep = registration!.currentStep;
    const nextLabel =
      nextStep && nextStep !== "verify"
        ? STEP_LABELS[nextStep] || "Registration"
        : "Company Details";

    return (
      <div className="max-w-lg space-y-8">
        <div className="flex items-start gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-5">
          <CheckCircle2 className="text-brand-blue mt-0.5 h-8 w-8 shrink-0" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-heading text-xl tracking-[0.04em] text-zinc-950 uppercase sm:text-2xl">
              Email verified
            </p>
            <p className={enquireMutedClass}>
              Continue your supplier registration for{" "}
              <span className="font-semibold text-zinc-800">{registration!.email}</span>. Progress
              is saved in this browser until you submit or log out.
            </p>
          </div>
        </div>
        <EnquireActions>
          <InteractiveHoverButton type="button" onClick={continueRegistration}>
            Continue to {nextLabel}
          </InteractiveHoverButton>
          <button
            type="button"
            disabled={busy}
            onClick={() => void changeEmail()}
            className="text-sm font-semibold text-zinc-500 underline underline-offset-2"
          >
            Use a different email
          </button>
        </EnquireActions>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <p className="font-heading text-xl tracking-[0.04em] text-zinc-950 uppercase sm:text-2xl">
          Verify your email
        </p>
        <p className={`mt-2 ${enquireMutedClass}`}>
          If you already have an approved supplier account, we will open the portal. Otherwise you
          will continue registration.
        </p>
      </div>

      {phase === "email" ? (
        <div className="space-y-5">
          <EnquireField label="Work email">
            <input
              className={enquireInputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </EnquireField>
          <EnquireActions>
            <InteractiveHoverButton
              type="button"
              disabled={busy || !email.includes("@")}
              onClick={() => void requestCode()}
            >
              {busy ? "Sending…" : "Send access code"}
            </InteractiveHoverButton>
          </EnquireActions>
        </div>
      ) : (
        <div className="space-y-5">
          {hint ? <p className={enquireMutedClass}>{hint}</p> : null}
          <EnquireField label="6-digit code">
            <input
              className={enquireInputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </EnquireField>
          <EnquireActions>
            <InteractiveHoverButton
              type="button"
              disabled={busy || code.length !== 6}
              onClick={() => void verifyCode()}
            >
              {busy ? "Checking…" : "Verify"}
            </InteractiveHoverButton>
            <button
              type="button"
              className="text-sm font-semibold text-zinc-500 underline underline-offset-2"
              onClick={() => {
                setPhase("email");
                setCode("");
              }}
            >
              Change email
            </button>
          </EnquireActions>
        </div>
      )}

      <p className={enquireMutedClass}>
        Already approved?{" "}
        <a href="/login" className="text-brand-blue font-semibold underline underline-offset-2">
          Sign in with password
        </a>
      </p>
    </div>
  );
}
