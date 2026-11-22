import type { BondPosition, FundDefinition, FundPosition, Money } from '../domain/types';
import { moneyAdd, moneyMax, moneyMul, moneySub, ZERO_MONEY } from '../domain/money';

export function calculateMonthlyFundYield(annualYield: number): number {
  if (annualYield <= -1) return -1;
  return Math.pow(1 + annualYield, 1 / 12) - 1;
}

export function accrueFundMonth(position: FundPosition, definition: FundDefinition, random: () => number = Math.random): { position: FundPosition; income: Money; changeRate: number } {
  const expectedYield = calculateMonthlyFundYield(definition.annualYield);
  const noise = (random() * 2 - 1) * definition.monthlyVolatility;
  const changeRate = Math.max(-0.5, Math.min(0.5, expectedYield + noise));
  const nextValue = moneyMax(ZERO_MONEY, moneyMul(position.currentValue, 1 + changeRate));
  return { position: { ...position, currentValue: nextValue }, income: moneySub(nextValue, position.currentValue), changeRate };
}

export function addMoneyToFund(position: FundPosition | undefined, fundId: string, amount: Money): FundPosition {
  if (!position) return { fundId, invested: amount, currentValue: amount };
  return { ...position, invested: moneyAdd(position.invested, amount), currentValue: moneyAdd(position.currentValue, amount) };
}

export function withdrawFromFund(position: FundPosition, amount: Money): { ok: boolean; position: FundPosition; withdrawn: Money } {
  if (Number(position.currentValue) === 0 || Number(amount) <= 0) return { ok: false, position, withdrawn: ZERO_MONEY };
  const actual = moneyMax(ZERO_MONEY, moneySub(position.currentValue, amount));
  return { ok: true, position: { ...position, currentValue: actual }, withdrawn: moneySub(position.currentValue, actual) };
}

export function accrueBondMonth(position: BondPosition, annualCouponRate: number, faceValue: Money): { position: BondPosition; coupon: Money; matured: boolean } {
  const coupon = moneyMul(faceValue, (annualCouponRate / 12) * position.quantity);
  const monthsToMaturity = Math.max(0, position.monthsToMaturity - 1);
  return { position: { ...position, monthsToMaturity }, coupon, matured: monthsToMaturity === 0 };
}
