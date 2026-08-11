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

export function VerifyStep() {
  const router = useRouter();
  const { registration, loading, hydrateAfterAuth, setRegistration, setError } = useEnquire();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  /** User explicitly chose to sign out and use a different email. */
  const [changingEmail, setChangingEmail] = useState(false);

  const hasSession = Boolean(registration?.email) && !changingEmail;

  const changeEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/enquire/logout", { method: "POST", credentials: "include" });
      setRegistration(null);
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
      router.push(`/enquire/${step}`);
    } else {
      router.push("/enquire/company");
    }
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    setHint(null);
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
        /* non-JSON error page */
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
    try {
      const res = await fetch("/api/enquire/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      let data: { error?: string; currentStep?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON */
      }
      if (!res.ok) {
        setError(data.error || `Invalid code (${res.status})`);
        return;
      }
      let draft = await hydrateAfterAuth();
      if (!draft) {
        await new Promise((r) => setTimeout(r, 100));
        draft = await hydrateAfterAuth();
      }
      if (!draft) {
        setError("Signed in, but your draft did not load. Please refresh and continue.");
        return;
      }
      setChangingEmail(false);
      // Stay on verify — active session shows "Just Verified" + Continue.
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !registration) return null;

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
              Just Verified
            </p>
            <p className="text-base break-all text-zinc-600">{registration!.email}</p>
          </div>
        </div>

        <p className={enquireMutedClass}>
          Your email is confirmed for this registration. Continue where you left off, or change
          email to start over with a different address.
        </p>

        <EnquireActions>
          <InteractiveHoverButton
            type="button"
            variant="solid"
            className="sm:w-auto"
            fullWidth
            onClick={continueRegistration}
          >
            Continue to {nextLabel}
          </InteractiveHoverButton>
        </EnquireActions>

        <button
          type="button"
          onClick={() => void changeEmail()}
          disabled={busy}
          className="text-brand-blue text-sm font-semibold tracking-wide uppercase underline-offset-2 hover:underline disabled:opacity-50"
        >
          Change email
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <p className={enquireMutedClass}>
        Enter your work email to receive a one-time access code. Returning suppliers can use the
        same email to resume a saved draft.
      </p>

      <EnquireField label="Email address" required>
        <input
          type="email"
          className={enquireInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          disabled={phase === "code"}
        />
      </EnquireField>

      {phase === "code" && (
        <EnquireField label="One-time access code" required>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className={enquireInputClass}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
          />
        </EnquireField>
      )}

      {hint && (
        <p role="status" className="text-brand-blue text-base font-medium">
          {hint}
        </p>
      )}

      <EnquireActions>
        {phase === "email" ? (
          <InteractiveHoverButton
            type="button"
            variant="solid"
            className="sm:w-auto"
            fullWidth
            pending={busy}
            disabled={!email.trim()}
            onClick={() => void requestCode()}
          >
            {busy ? "Sending…" : "Get Access Code"}
          </InteractiveHoverButton>
        ) : (
          <>
            <InteractiveHoverButton
              type="button"
              variant="outline"
              className="sm:w-auto"
              fullWidth
              disabled={busy}
              onClick={() => {
                setPhase("email");
                setCode("");
              }}
            >
              Change Email
            </InteractiveHoverButton>
            <InteractiveHoverButton
              type="button"
              variant="solid"
              className="sm:w-auto"
              fullWidth
              pending={busy}
              disabled={code.length !== 6}
              onClick={() => void verifyCode()}
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </InteractiveHoverButton>
          </>
        )}
      </EnquireActions>
    </div>
  );
}
