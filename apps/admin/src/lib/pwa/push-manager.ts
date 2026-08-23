/**
 * Push notification subscription management.
 * Handles VAPID-based push subscription lifecycle.
 */

import { getRegistration } from "./register-sw";

/**
 * Placeholder VAPID public key.
 * Replace with your actual VAPID public key from your push notification server.
 * Generate with: npx web-push generate-vapid-keys
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/** Check if the browser supports push notifications */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Get the current notification permission status */
export function getPushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission from the user */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications.
 * Returns the PushSubscription object to send to your backend.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
    console.warn("[PWA] Push not supported or VAPID key not configured");
    return null;
  }

  const permission = await requestPushPermission();
  if (permission !== "granted") {
    console.warn("[PWA] Push notification permission denied");
    return null;
  }

  const registration = getRegistration();
  if (!registration) {
    console.warn("[PWA] No service worker registration available");
    return null;
  }

  try {
    // Check for existing subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) return existingSub;

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    // Send subscription to backend
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error("[PWA] Push subscription failed:", error);
    return null;
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = getRegistration();
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const success = await subscription.unsubscribe();

    if (success) {
      // Notify backend to remove subscription
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
    }

    return success;
  } catch (error) {
    console.error("[PWA] Push unsubscription failed:", error);
    return false;
  }
}

/** Get current push subscription */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

// ─── Internal Helpers ──────────────────────────────────────────────

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch (error) {
    console.error("[PWA] Failed to send subscription to server:", error);
  }
}

/** Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
