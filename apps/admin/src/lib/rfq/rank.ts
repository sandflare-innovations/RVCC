export function rankQuotes<T extends { newPrice: string | number }>(
  quotes: T[]
): Array<T & { rank: number }> {
  const sorted = [...quotes].sort((a, b) => Number(a.newPrice) - Number(b.newPrice));

  let lastPrice: number | null = null;
  let lastRank = 0;

  return sorted.map((quote, index) => {
    const price = Number(quote.newPrice);
    const rank = lastPrice !== null && price === lastPrice ? lastRank : index + 1;
    lastPrice = price;
    lastRank = rank;
    return { ...quote, rank };
  });
}
