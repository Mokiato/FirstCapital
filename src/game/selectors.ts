// src/game/selectors.ts
// Селекторы поверх рантайм-состояния. GDD v2.0: 1 ход = 1 месяц,
// посекундных единиц, города, сделки и праздников нет.

import { TRANSPORT } from '../data/transport';
import { COMPANY_BY_ID } from '../data/companies';
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import type { MarketCompany, CompetitorRuntime } from './domain/types';
import type { GameState } from './store';

export interface SelectorState {
  /** Рантайм-состояние бизнесов (BusinessRuntime). */
  businesses: import('./domain/types').BusinessRuntime[];
  ownedProperty: string[];
  ownedTransport: string[];
}

/** Репутация от купленного транспорта (влияет на конкурентный спрос). */
export function getTransportReputation(state: SelectorState): number {
  return state.ownedTransport.reduce((acc, id) => {
    const def = TRANSPORT.find((t) => t.id === id);
    return acc + (def ? def.reputation : 0);
  }, 0);
}

export function getReputation(state: SelectorState): number {
  return Math.round(getTransportReputation(state));
}

export function getCompanyLevel(state: SelectorState): number {
  const businessLevels = (state.businesses ?? []).reduce(
    (acc, b) => acc + (b.level ?? 1),
    0,
  );
  const level =
    Math.floor(businessLevels / 5) +
    state.ownedProperty.length +
    state.ownedTransport.length;
  return Math.max(1, Math.min(100, level));
}

// ─── Рейтинг ──────────────────────────────────────────────────────────────

/** Капитал NPC-компании: оценка по размеру + доля рынка. */
export function getNpcCapital(company: MarketCompany): number {
  const def = COMPANY_BY_ID[company.id];
  const baseValuation =
    def?.size === 'large' ? 500_000_000 : 100_000_000;
  return baseValuation + company.marketShare * 2_000_000_000;
}

export interface RatingRow {
  rank: number;
  companyId: string;
  companyName: string;
  sectorId: string;
  capital: number;
  isPlayer: boolean;
}

/** Собрать рейтинг: игрок + топ-N NPC по капиталу. */
export function getCompanyRating(
  companies: MarketCompany[],
  playerCapital: number,
  playerCompanyName: string,
  limit = 30,
): RatingRow[] {
  const rows: Omit<RatingRow, 'rank'>[] = companies.map((c) => ({
    companyId: c.id,
    companyName: c.name,
    sectorId: c.sectorId,
    capital: getNpcCapital(c),
    isPlayer: false,
  }));

  rows.push({
    companyId: 'player',
    companyName: playerCompanyName,
    sectorId: 'player',
    capital: playerCapital,
    isPlayer: true,
  });

  rows.sort((a, b) => b.capital - a.capital);

  return rows.slice(0, limit + 1).map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Оценить давление конкурентов по секторам (для UI-индикатора). */
export function getCompetitorPressure(
  competitors: CompetitorRuntime[],
  sectors: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sector of sectors) {
    const rivals = competitors.filter((c) => c.sectorId === sector);
    if (rivals.length === 0) {
      out[sector] = 0;
    } else {
      const avgAggression =
        rivals.reduce((sum, c) => sum + c.aggressiveness, 0) / rivals.length;
      out[sector] = Math.round(avgAggression * 100);
    }
  }
  return out;
}

// ─── Бонусы офисных компаний ──────────────────────────────────────────────

export type OfficeBonuses = {
  constructionDiscount: number;
  itRevenue: number;
  taxReduction: number;
  hireQuality: number;
  fineReduction: number;
  purchaseDiscount: number;
  contractBonus: number;
  breakdownReduction: number;
  entertainmentRevenue: number;
  insuranceDiscount: number;
  demandBonus: number;
};

/**
 * Собирает бонусы от всех активных офисных компаний.
 * Одинаковые бонусы НЕ суммируются — берётся максимум.
 */
export function getOfficeBonuses(state: GameState): OfficeBonuses {
  const result: OfficeBonuses = {
    constructionDiscount: 0, itRevenue: 0, taxReduction: 0, hireQuality: 0,
    fineReduction: 0, purchaseDiscount: 0, contractBonus: 0, breakdownReduction: 0,
    entertainmentRevenue: 0, insuranceDiscount: 0, demandBonus: 0,
  };

  for (const ent of state.enterprises ?? []) {
    if (ent.type !== 'office' || ent.status !== 'operating') continue;
    const def = OFFICE_COMPANIES_BY_ID[ent.defId];
    if (!def) continue;
    for (const b of def.bonuses) {
      result[b.kind] = Math.max(result[b.kind], b.value);
    }
  }

  return result;
}