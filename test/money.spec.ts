import { calculateQuoteTotals, roundMoney } from '../src/common/money';

describe('money helpers', () => {
  it('rounds monetary values to two decimals', () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });

  it('calculates discount and tax on the discounted base', () => {
    expect(calculateQuoteTotals([100, 50], 0.15, 10)).toEqual({
      subtotal: 150,
      discountAmount: 15,
      taxableBase: 135,
      tax: 20.25,
      total: 155.25,
    });
  });
});
