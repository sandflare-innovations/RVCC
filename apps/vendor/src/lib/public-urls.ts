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

/** Marketing / Surface origin (`NEXT_PUBLIC_SITE_URL`), e.g. https://rvcc-prod.vercel.app */
export function siteUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_SITE_URL, path);
}

/** Vendor portal origin (`NEXT_PUBLIC_VENDOR_PORTAL_URL`), e.g. https://rvcc-app.vercel.app */
export function vendorPortalUrl(path = ""): string {
  return joinUrl(process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL, path);
}

/** Canonical start of E-Vendor registration. */
export function enquireVerifyUrl(): string {
  return siteUrl("/enquire/verify");
}
