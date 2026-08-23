/**
 * Bootstraps PWA install + service worker before React hydrates so we never
 * miss the browser's beforeinstallprompt event.
 */
export const PWA_BOOTSTRAP_SCRIPT = `
(function () {
  if (typeof window === "undefined") return;

  window.__RVCC_DEFERRED_INSTALL__ = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__RVCC_DEFERRED_INSTALL__ = e;
    window.dispatchEvent(new Event("rvcc:pwa-install-available"));
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    });
  }
})();
`;
