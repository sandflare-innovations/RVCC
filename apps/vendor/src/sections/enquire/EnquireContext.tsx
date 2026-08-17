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

const CACHE_KEY = "rvcc_register_draft_v1";

function emptyDraft(email: string): DraftRegistration {
  return {
    id: "local",
    email,
    status: "DRAFT",
    currentStep: "company",
    productCategories: [],
    company: {
      legalName: "",
      dbaName: "",
      country: "",
      taxIdentifiers: { vat: "", cr: "", tin: "" },
      organizationType: "",
      supplierType: "",
      website: "",
      yearEstablished: "",
      dunsNumber: "",
      description: "",
    },
    contacts: [
      {
        id: "c0",
        firstName: "",
        lastName: "",
        email,
        jobTitle: "",
        phone: "",
        mobile: "",
        isAdministrative: true,
        requestUserAccount: false,
      },
    ],
    addresses: [],
    classifications: [],
    bankAccounts: [],
    questionnaire: [],
  };
}

function readCache(): DraftRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftRegistration;
  } catch {
    return null;
  }
}

function writeCache(draft: DraftRegistration | null) {
  if (typeof window === "undefined") return;
  if (!draft) {
    localStorage.removeItem(CACHE_KEY);
    return;
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(draft));
}

export function clearRegisterCache() {
  writeCache(null);
}

type EnquireContextValue = {
  registration: DraftRegistration | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  gateMessage: string | null;
  unlockedThrough: EnquireStep;
  refresh: () => Promise<DraftRegistration | null>;
  hydrateAfterAuth: (email: string) => Promise<DraftRegistration | null>;
  saveDraft: (payload: Record<string, unknown>) => Promise<boolean>;
  advanceTo: (nextStep: string, payload: Record<string, unknown>) => void;
  setError: (msg: string | null) => void;
  setGateMessage: (msg: string | null) => void;
  setRegistration: React.Dispatch<React.SetStateAction<DraftRegistration | null>>;
  clearLocal: () => void;
};

const EnquireContext = createContext<EnquireContextValue | null>(null);

function mergePayload(
  prev: DraftRegistration,
  payload: Record<string, unknown>,
  nextStep?: string
): DraftRegistration {
  const next: DraftRegistration = { ...prev };
  if (typeof payload.company === "object" && payload.company) {
    next.company = {
      ...(prev.company || emptyDraft(prev.email).company!),
      ...payload.company,
    } as DraftRegistration["company"];
  }
  if (Array.isArray(payload.contacts))
    next.contacts = payload.contacts as DraftRegistration["contacts"];
  if (Array.isArray(payload.addresses))
    next.addresses = payload.addresses as DraftRegistration["addresses"];
  if (Array.isArray(payload.classifications)) {
    next.classifications = payload.classifications as DraftRegistration["classifications"];
  }
  if (Array.isArray(payload.bankAccounts)) {
    next.bankAccounts = payload.bankAccounts as DraftRegistration["bankAccounts"];
  }
  if (Array.isArray(payload.productCategories)) {
    next.productCategories = payload.productCategories as string[];
  }
  if (Array.isArray(payload.questionnaire)) {
    next.questionnaire = payload.questionnaire as DraftRegistration["questionnaire"];
  }
  if (nextStep) next.currentStep = nextStep;
  else if (typeof payload.step === "string") next.currentStep = payload.step;
  return next;
}

export function EnquireProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [registration, setRegistration] = useState<DraftRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<DraftRegistration | null> => {
    const cached = readCache();
    setRegistration(cached);
    setLoading(false);
    return cached;
  }, []);

  const hydrateAfterAuth = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    const existing = readCache();
    const draft =
      existing && existing.email.toLowerCase() === email.toLowerCase()
        ? existing
        : emptyDraft(email.toLowerCase());
    writeCache(draft);
    setRegistration(draft);
    setLoading(false);
    return draft;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearLocal = useCallback(() => {
    writeCache(null);
    setRegistration(null);
    setGateMessage(null);
  }, []);

  const saveDraft = useCallback(async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      setRegistration((prev) => {
        if (!prev) return prev;
        const next = mergePayload(prev, payload);
        writeCache(next);
        return next;
      });
      return true;
    } catch {
      setError("Could not save locally");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const advanceTo = useCallback(
    (nextStep: string, payload: Record<string, unknown>) => {
      setError(null);
      setRegistration((prev) => {
        if (!prev) return prev;
        const next = mergePayload(prev, payload, nextStep);
        writeCache(next);
        return next;
      });
      router.push(`/register/${nextStep}`);
    },
    [router]
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
      gateMessage,
      unlockedThrough,
      refresh,
      hydrateAfterAuth,
      saveDraft,
      advanceTo,
      setError,
      setGateMessage,
      setRegistration,
      clearLocal,
    }),
    [
      registration,
      loading,
      saving,
      error,
      gateMessage,
      unlockedThrough,
      refresh,
      hydrateAfterAuth,
      saveDraft,
      advanceTo,
      clearLocal,
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
    if (loading) return;
    if (step === "verify") return;
    if (!registration?.email) {
      router.replace("/register/verify");
    }
  }, [loading, registration, router, step]);
}
