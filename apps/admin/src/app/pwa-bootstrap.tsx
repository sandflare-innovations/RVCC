import Script from "next/script";

import { PWA_BOOTSTRAP_SCRIPT } from "@/lib/pwa/bootstrap-script";

/** Runs before React so beforeinstallprompt is captured in time. */
export function PwaBootstrap() {
  return (
    <Script id="pwa-bootstrap" strategy="beforeInteractive">
      {PWA_BOOTSTRAP_SCRIPT}
    </Script>
  );
}
