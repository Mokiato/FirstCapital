import type {
  MarketCompany,
  PricePoint,
} from '../domain/types';
import {
  moneyCmp,
  moneyDiv,
  moneyMax,
  moneyMul,
} from '../domain/money';

const MIN_SHARE_PRICE = '0.01';
// GDD v2.0 §3.1: 1 тик = 1 месяц, 12 тиков в год. Суб-тики удалены.
const GAME_MONTHS_PER_YEAR = 12;

// Волатильность за ОДИН МЕСЯЧНЫЙ тик. Старые значения были рассчитаны
// на 120 тиков/год; пересчитаны ×√10, чтобы годовая волатильность
// сохранилась при переходе на 12 тиков/год.
const VOLATILITY_BY_PROFILE: Record<
  MarketCompany['volatility'],
  number
> = {
  stable: 0.003,
  moderate: 0.013,
  volatile: 0.038,
  speculative: 0.11,
};

export interface MarketTickOptions {
  minuteIndex: number;
  monthIndex: number;
  random?: () => number;
  companySignals?: Record<string, number>;
}

export function tickMarket(
  companies: MarketCompany[],
  options: MarketTickOptions,
): MarketCompany[] {
  const random = options.random ?? Math.random;
  const companySignals = options.companySignals ?? {};

  return companies.map((company) => {
    const randomNoise =
      (random() * 2 - 1) *
      VOLATILITY_BY_PROFILE[company.volatility];

    const annualGrowth = Math.max(
      -0.95,
      Math.min(5, company.annualGrowth),
    );

    const ticksPerYear = GAME_MONTHS_PER_YEAR;

    const baseDrift =
      Math.pow(1 + annualGrowth, 1 / ticksPerYear) - 1;

    const companySignal =
      companySignals[company.id] ?? 0;

    const returnThisTick =
      baseDrift + randomNoise + companySignal;

    const multiplier = Math.max(
      0.05,
      Math.min(1.5, 1 + returnThisTick),
    );

    const nextPrice = moneyMax(
      MIN_SHARE_PRICE,
      moneyMul(company.price, multiplier),
    );

    const relativeChange = Number(
      moneyDiv(nextPrice, company.price),
    );

    const lastChangePct = Number.isFinite(relativeChange)
      ? (relativeChange - 1) * 100
      : 0;

    const nextPoint: PricePoint = {
      minuteIndex: options.minuteIndex,
      monthIndex: options.monthIndex,
      price: nextPrice,
    };

    return {
      ...company,
      price: nextPrice,
      lastChangePct,
      history: [...company.history, nextPoint].slice(-100),
    };
  });
}

/**
 * Редкие крупные колебания спекулятивных акций.
 * Вызывается один раз в конце игрового месяца.
 */
export function applySpeculativeMonthShock(
  company: MarketCompany,
  random: () => number = Math.random,
): MarketCompany {
  if (company.volatility !== 'speculative') {
    return company;
  }

  const roll = random();

  let multiplier = 1;

  if (roll < 0.01) {
    multiplier = 10;
  } else if (roll > 0.99) {
    multiplier = 0.2;
  }

  if (multiplier === 1) {
    return company;
  }

  const oldPrice = company.price;
  const nextPrice = moneyMax(
    MIN_SHARE_PRICE,
    moneyMul(oldPrice, multiplier),
  );

  return {
    ...company,
    price: nextPrice,
    lastChangePct:
      multiplier === 10 ? 900 : -80,
  };
}

export function calculateMonthlyDividendPerShare(
  company: MarketCompany,
): string {
  const monthlyYield =
    company.annualDividendYield /
    GAME_MONTHS_PER_YEAR;

  return moneyMul(company.price, monthlyYield);
}

export function getCompanyPriceChange(
  company: MarketCompany,
): number {
  if (company.history.length < 2) {
    return 0;
  }

  const previous =
    company.history[company.history.length - 2];

  if (moneyCmp(previous.price, '0') <= 0) {
    return 0;
  }

  const ratio = Number(
    moneyDiv(company.price, previous.price),
  );

  return Number.isFinite(ratio)
    ? (ratio - 1) * 100
    : 0;
}