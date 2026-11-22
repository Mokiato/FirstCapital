// src/game/config/credit.ts

export interface CreditRateBand {
  maxRating: number;
  monthlyRate: number;
  limitCoefficient: number;
}

export const CREDIT = {
  startRating: 100,
  maxRating: 1000,
  minRating: 0,

  /** Полосы ставок по рейтингу */
  bands: [
    { maxRating: 300,  monthlyRate: 0.03, limitCoefficient: 2 }, // 36% годовых
    { maxRating: 700,  monthlyRate: 0.02, limitCoefficient: 3 }, // 24% годовых
    { maxRating: 1000, monthlyRate: 0.01, limitCoefficient: 5 }, // 12% годовых
  ] as CreditRateBand[],

  /** Сроки кредита в игровых месяцах */
  terms: [3, 6, 12] as const,

  /** Максимум активных кредитов */
  maxActiveLoans: 1,

  /** Штраф за просрочку — % к остатку долга */
  latePenalty: 0.10,

  /** Изменения рейтинга */
  ratingChanges: {
    paymentOnTime: 50,
    earlyPayoff: 75,
    fullPayoff: 100,
    missPayment: -150,
    default: 0,
  },
} as const;

export function creditBandFor(rating: number): CreditRateBand {
  for (const b of CREDIT.bands) {
    if (rating <= b.maxRating) return b;
  }
  return CREDIT.bands[CREDIT.bands.length - 1];
}

/** Лимит кредита = netMonthlyProfit × limitCoefficient. Никаких доп. ×3. */
export function creditLimitFor(netMonthlyProfit: number, rating: number): number {
  const band = creditBandFor(rating);
  return Math.max(0, netMonthlyProfit * band.limitCoefficient);
}