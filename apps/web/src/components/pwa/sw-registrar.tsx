"use client";

import { useEffect } from "react";

import { registerServiceWorker } from "@/lib/pwa/register-sw";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}
