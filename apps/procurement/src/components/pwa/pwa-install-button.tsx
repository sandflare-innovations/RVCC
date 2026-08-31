"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

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

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function getPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return globalDeferredPrompt ?? window.__RVCC_DEFERRED_INSTALL__ ?? null;
}

function setPrompt(next: BeforeInstallPromptEvent | null) {
  globalDeferredPrompt = next;
  if (typeof window !== "undefined") {
    window.__RVCC_DEFERRED_INSTALL__ = next;
  }
  promptListeners.forEach((cb) => cb());
}

function subscribeToPrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => promptListeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setPrompt(e as BeforeInstallPromptEvent);
  });
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function PwaInstallButton() {
  const [mounted, setMounted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const deferredPrompt = useSyncExternalStore(subscribeToPrompt, getPrompt, () => null);

  useEffect(() => {
    setMounted(true);

    // 1. Immediate Standalone Check
    if (checkIsStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 2. Check getInstalledRelatedApps API (supported in Chromium/Edge browsers)
    if ("getInstalledRelatedApps" in navigator) {
      (navigator as any)
        .getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            setIsInstalled(true);
          }
        })
        .catch(() => {
          /* ignore error */
        });
    }

    // 3. Listen for app installation completion event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    const prompt = getPrompt();
    if (!prompt) {
      alert(
        "To install RVCC Procurement Portal:\n• On Chrome / Edge: Click the install icon in the URL address bar or 'Install App' from the browser menu.\n• On iOS Safari: Tap Share -> 'Add to Home Screen'."
      );
      return;
    }

    setIsPrompting(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn("[PWA] Install prompt failed:", err);
    } finally {
      setIsPrompting(false);
      setPrompt(null);
    }
  }, []);

  // Do not render before mount (prevent SSR hydration mismatch), or if already installed/standalone
  if (!mounted || isInstalled || checkIsStandalone()) {
    return null;
  }

  // Only display the install button when the browser confirms installation is available via beforeinstallprompt
  if (!deferredPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      disabled={isPrompting}
      title="Install RVCC Procurement as App"
      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#0073bc] bg-[#0073bc]/5 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-[#0073bc] shadow-2xs transition-all hover:bg-[#0073bc] hover:text-white active:scale-95 disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{isPrompting ? "Installing..." : "Install App"}</span>
    </button>
  );
}
