"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __RVCC_DEFERRED_INSTALL__?: BeforeInstallPromptEvent | null;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function getPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return deferredPrompt ?? window.__RVCC_DEFERRED_INSTALL__ ?? null;
}

function setPrompt(next: BeforeInstallPromptEvent | null) {
  deferredPrompt = next;
  if (typeof window !== "undefined") {
    window.__RVCC_DEFERRED_INSTALL__ = next;
  }
  notifyPromptListeners();
}

function notifyPromptListeners() {
  promptListeners.forEach((cb) => cb());
}

function subscribeToPrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => promptListeners.delete(listener);
}

if (typeof window !== "undefined") {
  setPrompt(window.__RVCC_DEFERRED_INSTALL__ ?? null);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setPrompt(e as BeforeInstallPromptEvent);
  });

  window.addEventListener("rvcc:pwa-install-available", () => {
    setPrompt(window.__RVCC_DEFERRED_INSTALL__ ?? deferredPrompt);
  });
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // @ts-expect-error — Safari-specific property
    window.navigator.standalone === true
  );
}

async function waitForPrompt(timeoutMs = 4000): Promise<BeforeInstallPromptEvent | null> {
  const existing = getPrompt();
  if (existing) return existing;

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.ready;
    } catch {
      /* ignore */
    }
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const prompt = getPrompt();
    if (prompt) return prompt;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return getPrompt();
}

export function useInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [inStandalone, setInStandalone] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const [checked, setChecked] = useState(false);

  const deferred = useSyncExternalStore(subscribeToPrompt, getPrompt, () => null);
  const canInstall = deferred !== null;

  // On mount: check standalone mode + detect if PWA is already installed.
  // The browser only fires `beforeinstallprompt` when the app is NOT installed.
  // If it never fires, the app is already installed.
  useEffect(() => {
    setMounted(true);
    const standalone = checkIsStandalone();
    setInStandalone(standalone);

    if (standalone) {
      setChecked(true);
      return;
    }

    setPrompt(getPrompt());
    void waitForPrompt();

    // After waiting for beforeinstallprompt, if it never fired the app is installed
    const timer = setTimeout(() => {
      if (!getPrompt()) {
        setIsInstalled(true);
      }
      setChecked(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // If beforeinstallprompt fires before the 5s timer, mark checked immediately
  // so the install button appears right away.
  useEffect(() => {
    if (!mounted || checked) return;
    if (canInstall) {
      setChecked(true);
    }
  }, [mounted, checked, canInstall]);

  useEffect(() => {
    if (!mounted) return;

    const installedHandler = () => {
      setIsInstalled(true);
      setPrompt(null);
    };

    const mql = window.matchMedia("(display-mode: standalone)");
    const mqlHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setInStandalone(true);
        setIsInstalled(true);
      }
    };

    window.addEventListener("appinstalled", installedHandler);
    mql.addEventListener("change", mqlHandler);

    return () => {
      window.removeEventListener("appinstalled", installedHandler);
      mql.removeEventListener("change", mqlHandler);
    };
  }, [mounted]);

  const promptInstall = useCallback(async () => {
    if (isInstalled || prompting) return;

    setPrompting(true);
    try {
      const prompt = await waitForPrompt();
      if (!prompt) return;

      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch {
      /* Browser blocked the native prompt */
    } finally {
      setPrompt(null);
      setPrompting(false);
    }
  }, [isInstalled, prompting]);

  return {
    mounted,
    canInstall,
    isInstalled,
    inStandalone,
    prompting,
    showInstallButton: mounted && checked && !isInstalled && !inStandalone,
    promptInstall,
  };
}
