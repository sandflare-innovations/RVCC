"use client";

import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { revokeSession } from "@/lib/sign-out-client";
import { enquireMutedClass } from "@/sections/enquire/enquire-typography";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { type DraftRegistration, useEnquire } from "@/sections/enquire/EnquireContext";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";
import { ReviewDocument } from "@/sections/enquire/steps/ReviewStep";

const STEP_LABELS: Record<string, string> = {
  verify: "Verify",
  company: "Company Details",
  contacts: "Contacts",
  addresses: "Addresses",
  classifications: "Classifications",
  bank: "Bank Accounts",
  products: "Products & Services",
  questionnaire: "Questionnaire",
  attachments: "Documents",
  review: "Review & Submit",
  done: "Complete",
};

type VerifyOutcome =
  | { kind: "vendor"; redirectUrl: string }
  | {
      kind: "held";
      registration: DraftRegistration | null;
      referenceNumber: string | null;
      status: string;
    }
  | { kind: "rejected"; message: string; referenceNumber: string | null }
  | { kind: "register" }
  | null;

function RedirectCountdown({ url }: { url: string }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = url;
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, url]);

  return (
    <div className="max-w-lg space-y-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <ShieldCheck className="h-10 w-10 text-emerald-600" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-2xl tracking-[0.04em] text-zinc-950 uppercase sm:text-3xl">
          Verified Account
        </h2>
        <p className="text-base text-zinc-600">
          Your vendor portal access is active. Redirecting you automatically.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>
          Redirecting to vendor portal in{" "}
          <span className="font-semibold text-zinc-950 tabular-nums">{seconds}s</span>
        </span>
      </div>

      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="mx-auto sm:w-auto"
        fullWidth
        onClick={() => {
          window.location.href = url;
        }}
      >
        Go Now
      </InteractiveHoverButton>
    </div>
  );
}

function HeldView({
  registration,
  referenceNumber,
  status,
  onChangeEmail,
}: {
  registration: DraftRegistration | null;
  referenceNumber: string | null;
  status: string;
  onChangeEmail: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-zinc-950">
              Your Account is Already Registered
            </p>
            <p className="text-sm text-zinc-700">
              Status: <span className="font-bold text-amber-700">On Hold</span>
              {referenceNumber ? ` · ${referenceNumber}` : ""}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Your account has been verified successfully. On vendor opening for your company, RVCC
              will release the account access to the portal.
            </p>
          </div>
        </div>
      </div>

      {registration ? (
        <ReviewDocument registration={registration} />
      ) : (
        <p className="text-sm text-zinc-600">Registration data is not available at this time.</p>
      )}

      <button
        type="button"
        onClick={onChangeEmail}
        className="text-brand-blue text-sm font-semibold tracking-wide uppercase underline-offset-2 hover:underline"
      >
        Use a different email
      </button>
    </div>
  );
}

export function VerifyStep() {
  const router = useRouter();
  const { registration, loading, hydrateAfterAuth, setRegistration, setError } = useEnquire();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome>(null);

  const hasSession = Boolean(registration?.email) && !changingEmail;

  const changeEmail = useCallback(() => {
    setError(null);
    setRegistration(null);
    setChangingEmail(true);
    setOutcome(null);
    setEmail("");
    setCode("");
    setPhase("email");
    setHint(null);
    revokeSession("/api/enquire/logout");
  }, [setError, setRegistration]);

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
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError((data.error as string) || `Invalid code (${res.status})`);
        return;
      }

      const outcomeStr = data.outcome as string;

      if (outcomeStr === "vendor") {
        setOutcome({
          kind: "vendor",
          redirectUrl: (data.redirectUrl as string) || "/",
        });
        return;
      }

      if (outcomeStr === "held") {
        setOutcome({
          kind: "held",
          registration: (data.registration as DraftRegistration) ?? null,
          referenceNumber: (data.referenceNumber as string) ?? null,
          status: (data.status as string) ?? "SUBMITTED",
        });
        return;
      }

      if (outcomeStr === "rejected") {
        setOutcome({
          kind: "rejected",
          message: (data.message as string) || "Registration was not approved.",
          referenceNumber: (data.referenceNumber as string) ?? null,
        });
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
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !registration && !outcome) return null;

  if (outcome?.kind === "vendor") {
    return <RedirectCountdown url={outcome.redirectUrl} />;
  }

  if (outcome?.kind === "held") {
    return (
      <HeldView
        registration={outcome.registration}
        referenceNumber={outcome.referenceNumber}
        status={outcome.status}
        onChangeEmail={changeEmail}
      />
    );
  }

  if (outcome?.kind === "rejected") {
    return (
      <div className="max-w-lg space-y-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-5">
          <p className="text-lg font-semibold text-red-800">Registration Not Approved</p>
          <p className="mt-1 text-sm text-red-700">
            {outcome.message}
            {outcome.referenceNumber ? ` (${outcome.referenceNumber})` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={changeEmail}
          className="text-brand-blue text-sm font-semibold tracking-wide uppercase underline-offset-2 hover:underline"
        >
          Try a different email
        </button>
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
              User Verified
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
