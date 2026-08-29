/**
 * Service Worker registration and lifecycle management for RVCC Procurement.
 */

let registration: ServiceWorkerRegistration | null = null;
let updateAvailable = false;

type UpdateCallback = (available: boolean) => void;
const updateListeners = new Set<UpdateCallback>();

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function notifyUpdateAvailable() {
  updateAvailable = true;
  updateListeners.forEach((cb) => cb(true));
}

function trackInstallingWorker(worker: ServiceWorker) {
  worker.addEventListener("statechange", () => {
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      notifyUpdateAvailable();
    }
  });
}

/** Ask the browser to check for a newer /sw.js. */
export async function checkForServiceWorkerUpdate(): Promise<void> {
  try {
    await registration?.update();
  } catch (error) {
    console.warn("[PWA] Service worker update check failed:", error);
  }
}

/** Register the service worker. Safe to call in SSR. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration?.installing;
      if (newWorker) trackInstallingWorker(newWorker);
    });

    if (registration.installing) {
      trackInstallingWorker(registration.installing);
    }

    if (registration.waiting) {
      notifyUpdateAvailable();
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void checkForServiceWorkerUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);

    const intervalId = window.setInterval(() => {
      void checkForServiceWorkerUpdate();
    }, UPDATE_CHECK_INTERVAL_MS);

    window.addEventListener(
      "pagehide",
      () => {
        document.removeEventListener("visibilitychange", onVisible);
        window.clearInterval(intervalId);
      },
      { once: true }
    );

    return registration;
  } catch (error) {
    console.error("[PWA] Service worker registration failed:", error);
    return null;
  }
}

export function onUpdateAvailable(callback: UpdateCallback): () => void {
  updateListeners.add(callback);
  if (updateAvailable) {
    callback(true);
  }
  return () => {
    updateListeners.delete(callback);
  };
}

export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

export function applyUpdate(): void {
  if (!registration?.waiting) {
    window.location.reload();
    return;
  }
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}
