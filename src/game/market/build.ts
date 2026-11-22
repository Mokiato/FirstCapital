// src/game/market/build.ts
// Собирает MarketCompany[] из COMPANIES (data/companies.ts).
// Единственное место, где живёт начальное состояние рынка.

import type { MarketCompany } from '../domain/types';
import { COMPANIES } from '../../data/companies';

/** Годовой рост по типу поведения. */
const ANNUAL_GROWTH_BY_BEHAVIOR: Record<string, number> = {
  stable: 0.08,
  moderate: 0.15,
  volatile: 0.25,
  speculative: 0.40,
};

/** Годовая дивидендная доходность (только если dividends: true). */
const ANNUAL_DIVIDEND_BY_BEHAVIOR: Record<string, number> = {
  stable: 0.04,
  moderate: 0.03,
  volatile: 0.02,
  speculative: 0.0,
};

export function buildMarketCompanies(): MarketCompany[] {
  return COMPANIES.map((c) => ({
    id: c.id,
    name: c.name,
    sectorId: c.sector,
    price: String(c.basePrice),
    history: [
      { minuteIndex: 0, monthIndex: 0, price: String(c.basePrice) },
    ],
    lastChangePct: 0,
    volatility: c.stockBehavior,
    annualGrowth: ANNUAL_GROWTH_BY_BEHAVIOR[c.stockBehavior] ?? 0.1,
    annualDividendYield: c.dividends
      ? ANNUAL_DIVIDEND_BY_BEHAVIOR[c.stockBehavior] ?? 0
      : 0,
    monthlyRevenue: '0',
    monthlyProfit: '0',
    debt: '0',
    reputation: 50 + Math.floor(Math.random() * 30),
    marketShare:
      c.size === 'large'
        ? 0.15 + Math.random() * 0.15
        : 0.03 + Math.random() * 0.08,
    competitorEligible: c.roles.includes('competitor'),
    isActiveCompetitor: false,
  }));
}