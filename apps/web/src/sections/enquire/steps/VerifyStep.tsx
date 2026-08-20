"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { revokeSession } from "@/lib/sign-out-client";
import {
  type DraftRegistration,
  useEnquire,
} from "@/sections/enquire/EnquireContext";
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
  | { kind: "held"; registration: DraftRegistration | null; referenceNumber: string | null; status: string }
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
        <ShieldCheck className="h-12 w-12 text-emerald-600" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-3xl tracking-tight text-zinc-950 uppercase">
          Verified Account
        </h2>
        <p className="text-zinc-500">
          Your vendor portal access is active. Redirecting you automatically.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>
          Redirecting to vendor portal in{" "}
          <span className="font-semibold tabular-nums text-zinc-950">{seconds}s</span>
        </span>
      </div>

      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="mx-auto"
        onClick={() => {
          window.location.href = url;
        }}
      >
        Go to Portal Now
      </InteractiveHoverButton>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-zinc-950">
              Account Already Registered
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
                On Hold
              </span>
              {referenceNumber && <span className="font-mono text-zinc-500">{referenceNumber}</span>}
            </div>
            <p className="text-sm leading-relaxed text-zinc-600">
              Your account has been verified successfully. Once vendor registration opens for your company, RVCC
              will release account access to the portal.
            </p>
          </div>
        </div>
      </div>

      {registration ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <ReviewDocument registration={registration} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Registration data is not available at this time.
        </p>
      )}

      <button
        type="button"
        onClick={onChangeEmail}
        className="text-brand-blue text-sm font-semibold tracking-wide uppercase transition-all hover:text-blue-800"
      >
        &larr; Use a different email
      </button>
    </motion.div>
  );
}

export function VerifyStep() {
  const router = useRouter();
  const { registration, loading, hydrateAfterAuth, setRegistration, setError, error } = useEnquire();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const newCode = code.split("");
    newCode[index] = value;
    const updatedCode = newCode.join("").slice(0, 6);
    setCode(updatedCode);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      setCode(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

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

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || busy) return;

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
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error — is the site running? Try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6 || busy) return;

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

  const renderFormContent = () => {
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-red-900">Registration Not Approved</p>
                <p className="text-sm leading-relaxed text-red-700">
                  {outcome.message}
                  {outcome.referenceNumber ? ` (${outcome.referenceNumber})` : ""}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={changeEmail}
            className="text-brand-blue text-sm font-semibold tracking-wide uppercase transition-all hover:text-blue-800"
          >
            &larr; Try a different email
          </button>
        </motion.div>
      );
    }

    if (hasSession) {
      const nextStep = registration!.currentStep;
      const nextLabel =
        nextStep && nextStep !== "verify"
          ? STEP_LABELS[nextStep] || "Registration"
          : "Company Details";

      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-sm">
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Success Icon */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100/50" />
              <CheckCircle2 className="relative z-10 h-10 w-10 text-emerald-500" aria-hidden="true" />
            </div>
            
            <div className="space-y-3">
              <h2 className="font-heading text-brand-blue text-4xl tracking-tight uppercase">User Verified</h2>
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 shadow-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">{registration!.email}</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-zinc-500">
              Your email is confirmed. You can continue where you left off, or change your email to start over.
            </p>

            <div className="flex w-full flex-col gap-4 pt-4">
              <InteractiveHoverButton
                type="button"
                variant="solid"
                fullWidth
                onClick={continueRegistration}
              >
                Continue to {nextLabel}
              </InteractiveHoverButton>
              
              <button
                type="button"
                onClick={() => void changeEmail()}
                disabled={busy}
                className="w-full text-center text-xs font-bold tracking-[0.1em] text-zinc-400 uppercase transition-colors hover:text-zinc-800 disabled:opacity-50"
              >
                Change Email Address
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="font-heading text-brand-blue text-6xl tracking-tight uppercase">
            {phase === "email" ? "Verify Email" : "Enter Code"}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-500">
            {phase === "email"
              ? "Enter your work email to receive a one-time access code. Returning suppliers can use the same email to resume a saved draft."
              : "We've sent a 6-digit access code to your email. Please enter it below to verify your identity."}
          </p>
        </div>

        <form onSubmit={phase === "email" ? requestCode : verifyCode} className="space-y-6">
          <AnimatePresence mode="wait">
            {phase === "email" ? (
              <motion.div
                key="email-phase"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <input
                    id="email"
                    type="email"
                    required
                    className="focus:border-brand-blue focus:ring-brand-blue/10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base transition-all outline-none focus:bg-white focus:ring-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
                <InteractiveHoverButton
                  type="submit"
                  variant="solid"
                  fullWidth
                  pending={busy}
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                >
                  {busy ? "Sending Code..." : "Get Access Code"}
                </InteractiveHoverButton>
              </motion.div>
            ) : (
              <motion.div
                key="code-phase"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="code" className="text-xs font-bold tracking-[0.1em] text-zinc-400 uppercase">
                      6-Digit Code
                    </label>
                    <span className="text-xs font-medium text-zinc-500">{email}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="focus:border-brand-blue focus:ring-brand-blue/10 h-14 w-12 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-2xl font-bold text-brand-blue transition-all outline-none focus:bg-white focus:ring-4 sm:h-16 sm:w-14 sm:text-3xl"
                        value={code[index] || ""}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                      />
                    ))}
                  </div>
                </div>

                {hint && (
                  <div role="status" className="text-brand-blue text-center text-sm font-medium">
                    {email.toLowerCase().includes("@gmail.com") ? (
                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 hover:underline"
                      >
                        {hint} ↗
                      </a>
                    ) : (
                      <p>{hint}</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <InteractiveHoverButton
                    type="submit"
                    variant="solid"
                    fullWidth
                    pending={busy}
                    disabled={code.length !== 6}
                  >
                    {busy ? "Verifying..." : "Verify & Continue"}
                  </InteractiveHoverButton>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPhase("email");
                      setCode("");
                      setHint(null);
                      setError(null);
                    }}
                    className="w-full text-center text-xs font-bold tracking-[0.1em] text-zinc-400 uppercase transition-colors hover:text-zinc-800 disabled:opacity-50"
                  >
                    Change Email Address
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    );
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-white md:flex-row md:p-4 gap-4">
      {/* Left Panel - Branding (Hidden on small screens) */}
      <div className="relative hidden w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-zinc-950 p-12 md:flex md:w-5/12 lg:w-3/7 xl:p-16">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/projects/13.webp"
            alt="RVCC Building"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/images/logo/logo.webp"
            alt="RVCC"
            width={120}
            height={120}
            className="brightness-0 invert"
          />
        </div>

        {/* Copy */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="space-y-1">
            <p className="text-brand-blue w-fit rounded-sm bg-white px-3 py-1 text-xs font-black tracking-[0.2em] uppercase shadow-sm mb-4">
              Supplier Portal
            </p>
            <h1 className="font-heading text-6xl leading-[0.6] tracking-tight text-white uppercase xl:text-8xl">
              Shape Reality<br />With Us
            </h1>
          </div>
          <p className="text-xl leading-relaxed font-medium text-zinc-200">
            Join our network of premium suppliers and partners. Securely access the RVCC procurement portal to manage your company profile and track pre-qualifications.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="relative flex w-full flex-1 flex-col justify-center bg-white px-6 py-12 md:w-7/12 lg:w-4/7 lg:px-16 xl:px-24">

        {/* Mobile Header (Shows only on small screens) */}
        <div className="absolute top-8 left-6 md:hidden">
          <Image
            src="/images/logo/logo.webp"
            alt="RVCC"
            width={100}
            height={100}
          />
        </div>

        <div className="mx-auto w-full max-w-md pt-16 md:pt-0">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-4 backdrop-blur-sm">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <span className="text-sm font-medium leading-relaxed text-red-800">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {renderFormContent()}
        </div>
      </div>
    </div>
  );
}
