/** Next.js proxy matcher. API uploads must stay out so large RFQ files are not buffered/truncated. */
export const ADMIN_PROXY_MATCHER =
  "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|offline.html|icons/|images/|fonts/|api/).*)";

export function adminProxyMatches(pathname: string): boolean {
  return new RegExp(`^${ADMIN_PROXY_MATCHER}$`).test(pathname);
}
