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
