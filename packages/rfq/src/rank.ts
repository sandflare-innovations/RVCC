/**
 * Standard competition ranking over price, ascending.
 *
 * Never stored: a stored rank goes stale the moment a participant edits their
 * price before the deadline.
 *
 * Prices arrive as strings from Postgres NUMERIC. They are compared as numbers
 * — string order would put "100" before "9" — but the original value is
 * returned untouched so no precision is lost on the way to the screen.
 */
export function rankQuotes<T extends { newPrice: string | number }>(
  quotes: T[]
): Array<T & { rank: number }> {
  // Copied before sorting: callers pass query results they may still be using.
  const sorted = [...quotes].sort((a, b) => Number(a.newPrice) - Number(b.newPrice));

  let lastPrice: number | null = null;
  let lastRank = 0;

  return sorted.map((quote, index) => {
    const price = Number(quote.newPrice);
    // Ties share a rank; the rank after a tie skips, so two firsts are
    // followed by third rather than second.
    const rank = lastPrice !== null && price === lastPrice ? lastRank : index + 1;
    lastPrice = price;
    lastRank = rank;
    return { ...quote, rank };
  });
}
