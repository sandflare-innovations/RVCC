"use client";

import { useEffect, useState } from "react";

/**
 * PWA Splash Screen — shown only when the app is opened in standalone (installed) mode.
 * Displays a branded loading experience with the RVCC logo and a smooth fade-out
 * once the app has hydrated.
 */
export function PwaSplash() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show splash in standalone (PWA) mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error — Safari-specific
      window.navigator.standalone === true;

    setIsStandalone(standalone);

    if (standalone) {
      // Start fade-out after a brief delay to let content load
      const fadeTimer = setTimeout(() => setFadeOut(true), 1200);
      // Remove from DOM after animation completes
      const removeTimer = setTimeout(() => setVisible(false), 1800);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    } else {
      setVisible(false);
    }
  }, []);

  if (!isStandalone || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-600 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes splash-logo-pulse {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.05); opacity: 1; }
            }
            @keyframes splash-ring-expand {
              0% { transform: scale(0.8); opacity: 0.6; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            @keyframes splash-progress {
              0% { width: 0%; }
              70% { width: 80%; }
              100% { width: 100%; }
            }
            @keyframes splash-dot-bounce {
              0%, 100% { transform: translateY(0); opacity: 0.4; }
              50% { transform: translateY(-4px); opacity: 1; }
            }
            .splash-logo {
              animation: splash-logo-pulse 2s ease-in-out infinite;
            }
            .splash-ring {
              animation: splash-ring-expand 2s ease-out infinite;
            }
            .splash-ring-delayed {
              animation: splash-ring-expand 2s ease-out infinite 0.6s;
            }
            .splash-progress-bar {
              animation: splash-progress 1.2s ease-out forwards;
            }
            .splash-dot {
              animation: splash-dot-bounce 1.4s ease-in-out infinite;
            }
            .splash-dot:nth-child(2) { animation-delay: 0.15s; }
            .splash-dot:nth-child(3) { animation-delay: 0.3s; }
          `,
        }}
      />

      <div className="flex flex-col items-center gap-8">
        {/* Logo with expanding rings */}
        <div className="relative">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="splash-ring absolute h-20 w-20 rounded-full border-2 border-[#0073bc]/20" />
            <div className="splash-ring-delayed absolute h-20 w-20 rounded-full border-2 border-[#0073bc]/10" />
          </div>

          {/* Logo circle */}
          <div className="splash-logo relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0073bc] to-[#005a94] shadow-xl shadow-[#0073bc]/20">
            <img
              src="/images/logo/logo.webp"
              alt=""
              className="h-12 w-12 object-contain brightness-0 invert"
              draggable={false}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            RVCC Admin
          </h1>
          <p className="mt-1 text-xs font-medium text-zinc-400">
            Vendor Management Portal
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="splash-progress-bar h-full rounded-full bg-gradient-to-r from-[#0073bc] to-[#0094eb]" />
          </div>

          {/* Loading dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <div className="splash-dot h-1.5 w-1.5 rounded-full bg-[#0073bc]" />
            <div className="splash-dot h-1.5 w-1.5 rounded-full bg-[#0073bc]" />
            <div className="splash-dot h-1.5 w-1.5 rounded-full bg-[#0073bc]" />
          </div>
        </div>
      </div>
    </div>
  );
}
