/**
 * Service Worker registration and lifecycle management.
 * Call registerServiceWorker() once on app mount.
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

/** Register the service worker. Safe to call in SSR (no-ops). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  // Never register or cache Service Worker in local development to prevent Turbopack HMR caching collisions
  if (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // Ignore dev cleanup errors
    }
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
      if (registration?.waiting) {
        applyUpdate();
      }
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    window.setInterval(() => {
      void checkForServiceWorkerUpdate();
    }, UPDATE_CHECK_INTERVAL_MS);

    await checkForServiceWorkerUpdate();

    return registration;
  } catch (error) {
    console.error("[PWA] Service worker registration failed:", error);
    return null;
  }
}

/** Get the current registration. */
export function getRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

/** Check if an update is available. */
export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

/** Subscribe to update availability changes. Returns an unsubscribe function. */
export function onUpdateAvailable(callback: UpdateCallback): () => void {
  updateListeners.add(callback);
  if (updateAvailable) callback(true);
  return () => updateListeners.delete(callback);
}

/** Apply a pending update by telling the waiting SW to skip waiting. */
export function applyUpdate(): void {
  const waiting = registration?.waiting;
  if (waiting) {
    waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }

  void checkForServiceWorkerUpdate();
}
