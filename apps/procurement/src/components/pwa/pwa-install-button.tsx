"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running standalone
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction alert for desktop Chrome/Safari if prompt isn't directly triggered
      alert(
        "To install RVCC Procurement Portal:\n• On Chrome / Edge: Click the install icon in the URL address bar or 'Install App' from the browser menu.\n• On iOS Safari: Tap Share -> 'Add to Home Screen'."
      );
    }
  };

  if (isInstalled) return null;

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      title="Install RVCC Procurement as App"
      className="flex items-center gap-1.5 rounded-full border border-[#0073bc] bg-[#0073bc]/5 px-3.5 py-1.5 text-xs font-bold text-[#0073bc] hover:bg-[#0073bc] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Install App</span>
    </button>
  );
}
