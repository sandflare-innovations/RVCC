import "server-only";

/**
 * Normalize API_URL for BFF clients.
 * Must be the API host only — never include `/enquire`, `/admin`, or `/vendor`.
 */
export function apiRoot(): string {
  let base = process.env.API_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!base) {
    throw new Error(
      "Set API_URL to your unified API host (e.g. https://rvcc-api.rvcc.workers.dev)"
    );
  }
  // Common misconfiguration on Vercel: API_URL=https://…/enquire
  base = base.replace(/\/(enquire|admin|vendor)$/, "");
  return base;
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_URL?.trim());
}
