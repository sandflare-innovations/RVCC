import React from "react";

import { motion } from "framer-motion";

/**
 * PageLoader: Used for route transitions and initial page loads.
 * Features a pulsing RVCC logo with a modern spinning ring.
 */
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-6 p-8">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="border-t-brand-blue absolute inset-0 rounded-full border-4 border-zinc-100"
        />
        {/* Inner pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="border-brand-blue/30 absolute inset-2 rounded-full border-2"
        />
        {/* RVCC Logo (using an image if available, fallback to styled text) */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm"
        >
          {/* Attempt to load the actual logo, with a stylized text fallback if it fails or isn't found */}
          <img
            src="/images/logo/logo.webp"
            alt="RVCC Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              // Hide broken image icon if logo isn't available on this route
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML =
                  '<span class="font-bold text-brand-blue text-xs tracking-tighter">RVCC</span>';
              }
            }}
          />
        </motion.div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm font-medium tracking-[0.15em] text-zinc-500 uppercase"
      >
        {text}
      </motion.p>
    </div>
  );
}

/**
 * SubmitLoader: Used for form submissions (buttons, etc).
 * Distinct from PageLoader — uses a modern, compact dot-bouncing animation.
 */
export function SubmitLoader({ text = "Processing" }: { text?: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span>{text}</span>
      <span className="flex items-center gap-1">
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        />
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        />
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        />
      </span>
    </span>
  );
}

/**
 * FullScreenLoader: Used for massive transitions or full app initialization.
 */
export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <PageLoader />
    </div>
  );
}
