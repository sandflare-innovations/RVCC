export type VendorPerformanceRow = {
  email: string;
  invited: number;
  submitted: number;
  won: number;
};

/**
 * Turns raw counts into the two rates staff actually act on.
 *
 * Guards every division: a supplier invited zero times is a real row on this
 * dashboard, and 0/0 would render as "NaN%".
 *
 * Sorted worst-responder first, then by how often they were invited. The point
 * of this table is to find suppliers who are invited constantly and never
 * reply, so those belong at the top rather than buried under good performers.
 */
export function summariseVendorPerformance(rows: VendorPerformanceRow[]) {
  return rows
    .map((r) => ({
      ...r,
      responseRate: r.invited === 0 ? 0 : Math.round((r.submitted / r.invited) * 100),
      winRate: r.submitted === 0 ? 0 : Math.round((r.won / r.submitted) * 100),
    }))
    .sort((a, b) => a.responseRate - b.responseRate || b.invited - a.invited);
}
