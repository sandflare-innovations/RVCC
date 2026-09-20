/** Keep in sync with the literal matcher in src/proxy.ts (Next requires a static string). */
export const ADMIN_PROXY_MATCHER =
  "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|offline.html|icons/|images/|fonts/|api/).*)";

export function adminProxyMatches(pathname: string): boolean {
  return new RegExp(`^${ADMIN_PROXY_MATCHER}$`).test(pathname);
}
