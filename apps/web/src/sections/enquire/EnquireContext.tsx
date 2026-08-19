"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type { EnquireStep } from "@/lib/enquire-constants";

export type DraftRegistration = {
  id: string;
  email: string;
  status: string;
  currentStep: string;
  referenceNumber?: string | null;
  productCategories: string[];
  company: {
    legalName: string;
    dbaName: string;
    country: string;
    taxIdentifiers: { vat?: string; cr?: string; tin?: string } | Record<string, string>;
    organizationType: string;
    supplierType: string;
    website: string;
    yearEstablished: string;
    dunsNumber: string;
    description: string;
  } | null;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    phone: string;
    mobile: string;
    isAdministrative: boolean;
    requestUserAccount: boolean;
  }>;
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
    purposes: string[];
  }>;
  classifications: Array<{
    id: string;
    classification: string;
    certificateNumber: string;
    certifyingAgency: string;
    effectiveDate: string;
    expirationDate: string;
  }>;
  bankAccounts: Array<{
    id: string;
    country: string;
    bankName: string;
    branchName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    routingNumber: string;
    currency: string;
  }>;
  questionnaire: Array<{ questionKey: string; answer: string }>;
  attachments: Array<{
    id: string;
    section: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  }>;
};

type EnquireContextValue = {
  registration: DraftRegistration | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  unlockedThrough: EnquireStep;
  refresh: () => Promise<DraftRegistration | null>;
  /** After OTP verify: load draft before navigating so we never bounce to verify. */
  hydrateAfterAuth: () => Promise<DraftRegistration | null>;
  /** Blocking save — use for "Save for Later". */
  saveDraft: (payload: Record<string, unknown>) => Promise<boolean>;
  /**
   * Instant Next: navigate immediately, persist in the background.
   * Never blocks the UI on network.
   */
  advanceTo: (nextStep: string, payload: Record<string, unknown>) => void;
  setError: (msg: string | null) => void;
  setRegistration: React.Dispatch<React.SetStateAction<DraftRegistration | null>>;
};

const EnquireContext = createContext<EnquireContextValue | null>(null);

export function EnquireProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [registration, setRegistration] = useState<DraftRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveGen = useRef(0);
  const registrationRef = useRef<DraftRegistration | null>(null);
  registrationRef.current = registration;

  const refresh = useCallback(async (): Promise<DraftRegistration | null> => {
    try {
      const res = await fetch("/api/enquire/draft", { credentials: "include" });
      if (!res.ok) {
        // Keep an existing draft on transient failures — never fake a logout.
        return registrationRef.current;
      }
      const data = await res.json();
      const next = (data.registration as DraftRegistration | null) ?? null;
      setRegistration(next);
      if (next) setError(null);
      return next;
    } catch (e) {
      console.error(e);
      return registrationRef.current;
    } finally {
      setLoading(false);
    }
  }, []);

  const hydrateAfterAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    return refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patchDraft = useCallback(async (payload: Record<string, unknown>) => {
    const send = async () => {
      const res = await fetch("/api/enquire/draft", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    };

    let { res, data } = await send();
    if (res.status === 401) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      ({ res, data } = await send());
    }

    if (!res.ok) {
      return {
        ok: false as const,
        error: (data as { error?: string }).error || "Save failed",
        status: res.status,
      };
    }
    return {
      ok: true as const,
      registration: (data as { registration?: DraftRegistration }).registration,
      status: res.status,
    };
  }, []);

  const saveDraft = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const result = await patchDraft(payload);
        if (!result.ok) {
          setError(result.error);
          return false;
        }
        if (result.registration) setRegistration(result.registration);
        return true;
      } catch {
        setError("Save failed");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [patchDraft]
  );

  const advanceTo = useCallback(
    (nextStep: string, payload: Record<string, unknown>) => {
      setError(null);
      // Unlock the step train immediately.
      setRegistration((prev) => (prev ? { ...prev, currentStep: nextStep } : prev));
      router.push(`/enquire/${nextStep}`);

      // Persist off the critical path — never gate navigation on this.
      const gen = ++saveGen.current;
      void (async () => {
        try {
          const result = await patchDraft({ ...payload, step: nextStep });
          if (gen !== saveGen.current) return;
          if (!result.ok) {
            if (result.status === 401 && registrationRef.current) {
              void refresh();
              return;
            }
            setError(result.error);
            return;
          }
          if (result.registration) setRegistration(result.registration);
        } catch {
          if (gen === saveGen.current)
            setError("Could not save progress — you can retry Save for Later.");
        }
      })();
    },
    [patchDraft, router]
  );

  const unlockedThrough = useMemo<EnquireStep>(() => {
    if (!registration) return "verify";
    return (registration.currentStep as EnquireStep) || "company";
  }, [registration]);

  const value = useMemo(
    () => ({
      registration,
      loading,
      saving,
      error,
      unlockedThrough,
      refresh,
      hydrateAfterAuth,
      saveDraft,
      advanceTo,
      setError,
      setRegistration,
    }),
    [
      registration,
      loading,
      saving,
      error,
      unlockedThrough,
      refresh,
      hydrateAfterAuth,
      saveDraft,
      advanceTo,
    ]
  );

  return <EnquireContext.Provider value={value}>{children}</EnquireContext.Provider>;
}

export function useEnquire() {
  const ctx = useContext(EnquireContext);
  if (!ctx) throw new Error("useEnquire must be used within EnquireProvider");
  return ctx;
}

export function useRequireSession(step: EnquireStep) {
  const { registration, loading } = useEnquire();
  const router = useRouter();

  useEffect(() => {
    // Wait until the first draft hydrate finishes — never bounce mid-load.
    if (loading) return;
    if (step === "verify") return;
    if (!registration) {
      router.replace("/enquire/verify");
    }
  }, [loading, registration, router, step]);
}
