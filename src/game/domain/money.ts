import Decimal from 'break_infinity.js';
import type { Money } from './types';

export type MoneyLike = Money | number | Decimal;

export const ZERO_MONEY: Money = '0';

export function toDecimal(value: MoneyLike | null | undefined): Decimal {
  if (value instanceof Decimal) {
    return value;
  }

  try {
    return new Decimal(String(value ?? '0'));
  } catch {
    return new Decimal(0);
  }
}

export function moneyAdd(a: MoneyLike, b: MoneyLike): Money {
  return toDecimal(a).add(toDecimal(b)).toString();
}

export function moneySub(a: MoneyLike, b: MoneyLike): Money {
  return toDecimal(a).sub(toDecimal(b)).toString();
}

export function moneyMul(a: MoneyLike, b: MoneyLike): Money {
  return toDecimal(a).mul(toDecimal(b)).toString();
}

export function moneyDiv(a: MoneyLike, b: MoneyLike): Money {
  const divisor = toDecimal(b);

  if (divisor.cmp(0) === 0) {
    return ZERO_MONEY;
  }

  return toDecimal(a).div(divisor).toString();
}

export function moneyCmp(a: MoneyLike, b: MoneyLike): number {
  return toDecimal(a).cmp(toDecimal(b));
}

export function moneyMin(a: MoneyLike, b: MoneyLike): Money {
  return moneyCmp(a, b) <= 0 ? toDecimal(a).toString() : toDecimal(b).toString();
}

export function moneyMax(a: MoneyLike, b: MoneyLike): Money {
  return moneyCmp(a, b) >= 0 ? toDecimal(a).toString() : toDecimal(b).toString();
}

export function moneyClampZero(value: MoneyLike): Money {
  return moneyMax(value, ZERO_MONEY);
}

export function moneySum(values: MoneyLike[]): Money {
  return values.reduce<Money>(
    (total, value) => moneyAdd(total, value),
    ZERO_MONEY,
  );
}

export function moneyToNumber(value: MoneyLike): number {
  return toDecimal(value).toNumber();
}

/**
 * Подписанный логарифм нужен для графиков капитала:
 * большие числа не превращают график в плоскую линию.
 */
export function moneyToSignedLog(value: MoneyLike): number {
  const decimal = toDecimal(value);
  const sign = decimal.cmp(0);

  if (sign === 0) {
    return 0;
  }

  return sign * decimal.abs().add(1).log10();
}

export function formatMoney(
  value: MoneyLike,
  currency = '₽',
): string {
  const decimal = toDecimal(value);
  const numberValue = decimal.toNumber();

  if (
    Number.isFinite(numberValue) &&
    Math.abs(numberValue) < 1_000_000_000_000_000
  ) {
    return `${new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0,
    }).format(numberValue)} ${currency}`;
  }

  return `${decimal.toString()} ${currency}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}