/**
 * Money helpers for VAT-aware procurement totals.
 * Ranking always uses the SAR equivalent, never a raw foreign amount.
 */
export type MoneyBreakdown = {
  unitPrice: number;
  quantity: number;
  vatRate: number;
  lineTotal: number;
  vatAmount: number;
  totalPrice: number;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeMoneyBreakdown(input: {
  unitPrice: number;
  quantity: number;
  vatRate?: number;
  vatAmount?: number | null;
}): MoneyBreakdown {
  const unitPrice = roundMoney(Number(input.unitPrice) || 0);
  const quantity = Number(input.quantity) > 0 ? Number(input.quantity) : 1;
  const vatRate = roundMoney(Number(input.vatRate) || 0);
  const lineTotal = roundMoney(unitPrice * quantity);
  const vatAmount =
    input.vatAmount != null && input.vatAmount !== undefined
      ? roundMoney(Number(input.vatAmount))
      : roundMoney(lineTotal * (vatRate / 100));
  const totalPrice = roundMoney(lineTotal + vatAmount);

  return { unitPrice, quantity, vatRate, lineTotal, vatAmount, totalPrice };
}

export function toSarAmount(totalPrice: number, exchangeRate: number): number {
  return roundMoney(totalPrice * (Number(exchangeRate) || 1));
}

export function parseMoney(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
