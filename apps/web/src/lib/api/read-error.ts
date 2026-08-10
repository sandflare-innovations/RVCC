/**
 * Extracts a usable message from a failed fetch response.
 *
 * The previous `data.error || "Sign in failed."` pattern collapsed every
 * outcome into one string: a 500 that returned HTML looked identical to a
 * wrong password, which made a production misconfiguration nearly impossible
 * to diagnose from the UI. This keeps the server's message when there is one
 * and otherwise reports the status so the cause is visible.
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string" && data.error.trim()) return data.error;
  } catch {
    /* body was not JSON — fall through to the status-based message */
  }

  if (res.status >= 500) {
    return `${fallback} The server returned ${res.status}. If this keeps happening, check the deployment logs and environment variables.`;
  }
  return `${fallback} (HTTP ${res.status})`;
}
