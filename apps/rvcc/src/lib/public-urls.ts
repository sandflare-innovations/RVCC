/** Absolute public URLs from env — never hardcode deploy hosts. */

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function joinUrl(base: string | undefined, path: string): string {
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  const b = base ? trimSlash(base) : "";
  if (!b) return p || "/";
  return `${b}${p}`;
}

/** Public site (marketing + portal) — `NEXT_PUBLIC_SITE_URL`. */
export function siteUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_SITE_URL, path);
}

/** Same host as site after unification; falls back to SITE_URL. */
export function vendorPortalUrl(path = ""): string {
  return joinUrl(
    process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || process.env.NEXT_PUBLIC_SITE_URL,
    path
  );
}

/** Admin portal — `NEXT_PUBLIC_ADMIN_PORTAL_URL`. */
export function adminPortalUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL, path);
}

export function enquireVerifyUrl(): string {
  return vendorPortalUrl("/register/verify");
}
