/**
 * Next PR-YYYY-NNN after the highest existing suffix.
 * Count-based numbering collides when rows were soft-deleted but still unique.
 */
export function nextReferenceNumber(year: number, existingRefs: string[]): string {
  const prefix = `PR-${year}-`;
  let maxNum = 0;
  for (const ref of existingRefs) {
    if (!ref.startsWith(prefix)) continue;
    const parsed = Number.parseInt(ref.slice(prefix.length), 10);
    if (Number.isFinite(parsed) && parsed > maxNum) maxNum = parsed;
  }
  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
}
