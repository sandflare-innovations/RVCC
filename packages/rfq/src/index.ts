export { rankQuotes } from "./rank";
export { summariseVendorPerformance, type VendorPerformanceRow } from "./kpi";

/**
 * The vendor authenticated in the supplier portal.
 *
 * The sealed-bidding rule: every participant query filters by this id, taken
 * from the session — never from a URL parameter or request body. Written that
 * way, one vendor cannot load another's quote by guessing an id. A UI that
 * merely hides it is not enforcement.
 */
export type Participant = { vendorUserId: string };
