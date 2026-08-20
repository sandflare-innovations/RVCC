/** True when running on Cloudflare Workers (not local Node). */
export function isCloudflareWorkerRuntime(): boolean {
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    return true;
  }
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function";
}
