"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

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

function syncDeferredFromWindow() {
  if (typeof window === "undefined") return;
  if (window.__RVCC_DEFERRED_INSTALL__) {
    deferredPrompt = window.__RVCC_DEFERRED_INSTALL__;
    notifyPromptListeners();
  }
}

function notifyPromptListeners() {
  promptListeners.forEach((cb) => cb());
}

function subscribeToPrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => promptListeners.delete(listener);
}

function getDeferredPromptSnapshot() {
  if (typeof window === "undefined") return null;
  return deferredPrompt ?? window.__RVCC_DEFERRED_INSTALL__ ?? null;
}

if (typeof window !== "undefined") {
  syncDeferredFromWindow();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.__RVCC_DEFERRED_INSTALL__ = deferredPrompt;
    notifyPromptListeners();
  });

  window.addEventListener("rvcc:pwa-install-available", syncDeferredFromWindow);
}

function checkIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    // @ts-expect-error — Safari-specific property
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function useInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const deferred = useSyncExternalStore(
    subscribeToPrompt,
    getDeferredPromptSnapshot,
    () => null
  );

  const canInstall = deferred !== null;

  useEffect(() => {
    setMounted(true);
    setIsInstalled(checkIsInstalled());
    syncDeferredFromWindow();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const installedHandler = () => {
      setIsInstalled(true);
      deferredPrompt = null;
      window.__RVCC_DEFERRED_INSTALL__ = null;
      notifyPromptListeners();
    };

    const mql = window.matchMedia("(display-mode: standalone)");
    const mqlHandler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };

    window.addEventListener("appinstalled", installedHandler);
    mql.addEventListener("change", mqlHandler);

    return () => {
      window.removeEventListener("appinstalled", installedHandler);
      mql.removeEventListener("change", mqlHandler);
    };
  }, [mounted]);

  const promptInstall = useCallback(async () => {
    if (isInstalled) return;

    const prompt = deferredPrompt ?? window.__RVCC_DEFERRED_INSTALL__;
    if (!prompt) return;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch {
      // Browser blocked the prompt — no custom fallback UI.
    } finally {
      deferredPrompt = null;
      window.__RVCC_DEFERRED_INSTALL__ = null;
      notifyPromptListeners();
    }
  }, [isInstalled]);

  return {
    mounted,
    /** Native browser install prompt is ready */
    canInstall,
    isInstalled,
    /** Show install CTA until installed; enabled once the browser prompt is ready */
    showInstallButton: mounted && !isInstalled,
    promptInstall,
  };
}
