"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
import { useEnquire } from "@/sections/enquire/EnquireContext";
import { EnquireField, enquireInputClass } from "@/sections/enquire/EnquireField";
import { enquireMutedClass } from "@/sections/enquire/enquire-typography";

export function VerifyStep() {
  const router = useRouter();
  const { hydrateAfterAuth, setError } = useEnquire();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

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
      const next = data.currentStep || "company";
      // Cookie is on this response — hydrate draft BEFORE navigating so
      // useRequireSession never sees a null session and bounces back here.
      let draft = await hydrateAfterAuth();
      if (!draft) {
        await new Promise((r) => setTimeout(r, 100));
        draft = await hydrateAfterAuth();
      }
      if (!draft) {
        setError("Signed in, but your draft did not load. Please refresh and continue.");
        return;
      }
      router.push(`/enquire/${draft.currentStep || next}`);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

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
