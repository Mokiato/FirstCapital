// src/data/finance.ts
// Фонды, облигации и металлы. Стартовые цены и параметры.

export interface FundDef {
  id: string;
  name: string;
  description: string;
  /** Ожидаемая доходность в месяц (0.008 = 0.8%) */
  monthlyYield: number;
  /** Волатильность стоимости (0.02 = 2% в месяц) */
  volatility: number;
  /** Минимальный взнос */
  minInvestment: number;
  /** Период блокировки в месяцах (0 = вывод в любой момент) */
  lockupMonths: number;
}

export const FUNDS: FundDef[] = [
  { id: 'conservative_fund', name: 'Консервативный фонд', description: 'Облигации и депозиты',    monthlyYield: 0.008, volatility: 0.005, minInvestment: 10_000,  lockupMonths: 0 },
  { id: 'balanced_fund',     name: 'Сбалансированный фонд', description: '50/50 акции и облигации', monthlyYield: 0.012, volatility: 0.02,  minInvestment: 50_000,  lockupMonths: 0 },
  { id: 'growth_fund',       name: 'Фонд роста',            description: 'Акции роста',             monthlyYield: 0.018, volatility: 0.04,  minInvestment: 100_000, lockupMonths: 0 },
  { id: 'aggressive_fund',   name: 'Агрессивный фонд',      description: 'Высокорисковые активы',    monthlyYield: 0.025, volatility: 0.07,  minInvestment: 200_000, lockupMonths: 3 },
];

export const FUNDS_BY_ID: Record<string, FundDef> = Object.fromEntries(FUNDS.map(f => [f.id, f]));

export interface BondDef {
  id: string;
  name: string;
  /** Номинал */
  faceValue: number;
  /** Купон: % от номинала в месяц */
  monthlyCoupon: number;
  /** Срок в месяцах */
  termMonths: number;
  /** Волатильность рыночной цены */
  volatility: number;
}

export const BONDS: BondDef[] = [
  { id: 'ofz_short',   name: 'ОФЗ-3м',        faceValue: 1000, monthlyCoupon: 0.006, termMonths: 3,  volatility: 0.003 },
  { id: 'ofz_mid',     name: 'ОФЗ-12м',       faceValue: 1000, monthlyCoupon: 0.007, termMonths: 12, volatility: 0.005 },
  { id: 'corp_aa',     name: 'Корп. облигации AA', faceValue: 1000, monthlyCoupon: 0.010, termMonths: 12, volatility: 0.010 },
  { id: 'corp_bbb',    name: 'Корп. облигации BBB', faceValue: 1000, monthlyCoupon: 0.015, termMonths: 24, volatility: 0.020 },
];

export const BONDS_BY_ID: Record<string, BondDef> = Object.fromEntries(BONDS.map(b => [b.id, b]));

export type MetalId = 'gold' | 'silver' | 'platinum' | 'diamond';

export interface MetalDef {
  id: MetalId;
  name: string;
  unit: string;
  basePrice: number;
  /** Месячная волатильность (0.03 = 3%) */
  volatility: number;
}

export const METALS: MetalDef[] = [
  { id: 'gold',     name: 'Золото',  unit: 'г',      basePrice: 7_500,  volatility: 0.03 },
  { id: 'silver',   name: 'Серебро', unit: 'г',      basePrice: 90,     volatility: 0.04 },
  { id: 'platinum', name: 'Платина', unit: 'г',      basePrice: 3_200,  volatility: 0.05 },
  { id: 'diamond',  name: 'Алмазы',  unit: 'карат',  basePrice: 25_000, volatility: 0.06 },
];

export const METALS_BY_ID: Record<MetalId, MetalDef> = Object.fromEntries(
  METALS.map(m => [m.id, m]),
) as Record<MetalId, MetalDef>;