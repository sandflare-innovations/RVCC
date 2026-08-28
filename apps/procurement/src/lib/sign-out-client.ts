/** Fire-and-forget session revoke — never await; safe to call before navigation. */
export function revokeSession(logoutUrl: string): void {
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(logoutUrl, new Blob([], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  fetch(logoutUrl, { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
}

/** Instant sign-out: edge clears cookies via ?expired=1; API revoke runs in background. */
export function signOutInstant(loginExpiredPath: string, logoutUrl = "/api/logout"): void {
  revokeSession(logoutUrl);
  window.location.replace(loginExpiredPath);
}
