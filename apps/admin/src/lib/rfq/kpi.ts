export type VendorPerformanceRow = {
  email: string;
  invited: number;
  submitted: number;
  won: number;
};

export function summariseVendorPerformance(rows: VendorPerformanceRow[]) {
  return rows
    .map((r) => ({
      ...r,
      responseRate: r.invited === 0 ? 0 : Math.round((r.submitted / r.invited) * 100),
      winRate: r.submitted === 0 ? 0 : Math.round((r.won / r.submitted) * 100),
    }))
    .sort((a, b) => a.responseRate - b.responseRate || b.invited - a.invited);
}
