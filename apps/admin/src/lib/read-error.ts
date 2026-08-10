/**
 * Extracts a usable message from a failed fetch response.
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string" && data.error.trim()) return data.error;
  } catch {
    /* body was not JSON */
  }

  if (res.status >= 500) {
    return `${fallback} The server returned ${res.status}. If this keeps happening, check the deployment logs and environment variables.`;
  }
  return `${fallback} (HTTP ${res.status})`;
}
