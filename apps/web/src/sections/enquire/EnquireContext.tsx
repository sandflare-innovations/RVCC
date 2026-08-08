"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
};

type EnquireContextValue = {
  registration: DraftRegistration | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  unlockedThrough: EnquireStep;
  refresh: () => Promise<void>;
  saveDraft: (payload: Record<string, unknown>) => Promise<boolean>;
  setError: (msg: string | null) => void;
};

const EnquireContext = createContext<EnquireContextValue | null>(null);

export function EnquireProvider({ children }: { children: React.ReactNode }) {
  const [registration, setRegistration] = useState<DraftRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/enquire/draft", { credentials: "include" });
      if (!res.ok) {
        setRegistration(null);
        return;
      }
      const data = await res.json();
      setRegistration(data.registration ?? null);
    } catch (e) {
      console.error(e);
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDraft = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/enquire/draft", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return false;
      }
      setRegistration(data.registration);
      return true;
    } catch {
      setError("Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

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
      saveDraft,
      setError,
    }),
    [registration, loading, saving, error, unlockedThrough, refresh, saveDraft]
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
    if (loading) return;
    if (step === "verify") return;
    if (!registration) {
      router.replace("/enquire/verify");
    }
  }, [loading, registration, router, step]);
}
