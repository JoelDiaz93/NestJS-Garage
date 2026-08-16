export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  tax: number;
  total: number;
}

export const roundMoney = (value: number): number =>
  Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));

export function calculateQuoteTotals(
  lineTotals: number[],
  taxRate: number,
  discountPct = 0,
): QuoteTotals {
  const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0));
  const discountAmount = roundMoney(subtotal * (discountPct / 100));
  const taxableBase = roundMoney(Math.max(0, subtotal - discountAmount));
  const tax = roundMoney(taxableBase * taxRate);
  const total = roundMoney(taxableBase + tax);

  return { subtotal, discountAmount, taxableBase, tax, total };
}
