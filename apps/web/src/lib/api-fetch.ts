import "server-only";

function getBaseUrl(): string {
  return (process.env.API_URL || "").replace(/\/$/, "");
}

export interface ApiFetchOptions extends RequestInit {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
}

/**
 * Server-side fetch with API reachability check.
 * If API_URL is unset or the server is offline, returns null and logs warning.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: ApiFetchOptions,
  label: string = "content"
): Promise<T | null> {
  const configuredBase = getBaseUrl();
  if (!configuredBase) {
    console.warn(
      `\x1b[33m[API Offline: ${label}]\x1b[0m API_URL is not set. Returning empty state.`
    );
    return null;
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const targetUrl = `${configuredBase}${normalizedEndpoint}`;

  try {
    const res = await fetch(targetUrl, {
      ...options,
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // API server is offline or request timed out
  }

  console.warn(
    `\x1b[33m[API Offline: ${label}]\x1b[0m Could not connect to API at ${targetUrl}. Returning empty state.`
  );
  return null;
}

