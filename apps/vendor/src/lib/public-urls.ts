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

/** Marketing site — `NEXT_PUBLIC_SITE_URL` (prod: rvcc-enquiry / local: :3000). */
export function siteUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_SITE_URL, path);
}

/** Vendor portal — `NEXT_PUBLIC_VENDOR_PORTAL_URL` (prod: rvcc-app / local: :3002). */
export function vendorPortalUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL, path);
}

/** Admin portal — `NEXT_PUBLIC_ADMIN_PORTAL_URL` (prod: rvcc-admin / local: :3001). */
export function adminPortalUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL, path);
}

export function enquireVerifyUrl(): string {
  return siteUrl("/enquire/verify");
}
