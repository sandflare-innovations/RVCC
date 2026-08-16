export type AwardableQuote = { id: string; newPrice: string; vendorEmail: string };

/**
 * Validates the chosen quote and captures the moment of decision.
 *
 * Kept free of database and Worker imports so it is testable from the repo root
 * — workers/ are not npm workspaces and cannot resolve `postgres` there.
 *
 * The losing prices are recorded deliberately: quotes stay editable until the
 * deadline, so without a snapshot the audit trail could not explain why this
 * one was chosen.
 */
export function describeAward(quotes: AwardableQuote[], quoteId: string) {
  const winner = quotes.find((q) => q.id === quoteId);
  if (!winner) {
    throw new Error("That is not a submitted quote on this requirement.");
  }

  return {
    winner,
    winningPrice: winner.newPrice,
    losingPrices: quotes.filter((q) => q.id !== quoteId).map((q) => q.newPrice),
  };
}
