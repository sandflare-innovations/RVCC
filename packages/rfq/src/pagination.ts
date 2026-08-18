/**
 * One page size for every list in both portals. Twenty-five fits a laptop
 * screen without scrolling the header away, and keeps a list render inside
 * the 800ms budget on the heaviest table we have.
 */
export const PAGE_SIZE = 25;

/**
 * Page numbers arrive from the URL, so they arrive untrusted. Anything that is
 * not a positive integer reads as page one rather than throwing: a hand-edited
 * URL should show the first page, not an error screen.
 */
export function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Takes an already-parsed page number. Call parsePage on the URL value first. */
export function pageWindow(page: number): { skip: number; take: number } {
  return { skip: (Math.max(1, page) - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** At least one, so an empty list reads "Page 1 of 1" rather than "of 0". */
export function pageCount(total: number, size: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}
