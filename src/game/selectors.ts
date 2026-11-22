import { BUSINESSES } from '../data/businesses';
import type { BusinessRuntime } from './domain/types';
import { REAL_ESTATE } from '../data/realEstate';
import { TRANSPORT } from '../data/transport';
import { CITY_BUILDINGS, RESEARCH_TREE } from '../data/cityBuildings';
import type { CityState } from '../types';
import { COMPANY_BY_ID } from '../data/companies';
import type { MarketCompany } from './domain/types';
import type { CompetitorRuntime } from './domain/types';

export interface SelectorState {
  /** Рантайм-состояние бизнесов (BusinessRuntime). */
  businesses: import('./domain/types').BusinessRuntime[];
  ownedProperty: string[];
  ownedTransport: string[];
  city: CityState;
  forcedHoliday?: string | null;
}

const SECTOR_BY_KIND: Record<string, string> = {
  service: 'services',
  retail: 'retail',
  production: 'production',
  logistics: 'logistics',
  office: 'office',
};

export function getHoldingMultiplier(state: SelectorState, sectorId: string): number {
  const owned = (state.businesses ?? []).filter((b) => {
    const def = BUSINESSES.find((d) => d.id === b.defId);
    if (!def) return false;
    return (SECTOR_BY_KIND[def.kind] ?? def.kind) === sectorId;
  });
  if (owned.length < 3) return 1;
  const mult = 1.25 + (owned.length - 3) * 0.05;
  return Math.min(mult, 2.0);
}

export function getPropertyMultiplier(state: SelectorState): number {
  const sum = state.ownedProperty.reduce((acc, id) => {
    const def = REAL_ESTATE.find((r) => r.id === id);
    return acc + (def ? def.bonusPercent : 0);
  }, 0);
  return 1 + sum / 100;
}

export function getTransportReputation(state: SelectorState): number {
  return state.ownedTransport.reduce((acc, id) => {
    const def = TRANSPORT.find((t) => t.id === id);
    return acc + (def ? def.reputation : 0);
  }, 0);
}

export function getCollectionBonus(_state: SelectorState) {
  return { income: 0, reputation: 0, speed: 0, deal: 0, offline: 0 };
}

export function getRuntimeMonthlyProfit(runtime: BusinessRuntime): number {
  const gross =
    Number(runtime.baseMonthlyRevenue ?? 0) * (runtime.level ?? 1);
  const expenses =
    Number(runtime.monthlyPayroll ?? 0) +
    Number(runtime.monthlyRent ?? 0) +
    Number(runtime.monthlyUtilities ?? 0) +
    Number(runtime.monthlyMaintenance ?? 0);
  return Math.max(0, gross - expenses);
}

export function getBaseIncomePerSec(state: SelectorState): number {
  let total = 0;
  for (const runtime of state.businesses ?? []) {
    const def = BUSINESSES.find((d) => d.id === runtime.defId);
    if (!def) continue;
    const sectorId = SECTOR_BY_KIND[def.kind] ?? def.kind;
    const holdingMult = getHoldingMultiplier(state, sectorId);
    const monthly = getRuntimeMonthlyProfit(runtime) * holdingMult;
    total += monthly / 600; // per second
  }
  return total;
}

export function getResearchIncomeBonus(state: SelectorState): number {
  return state.city.research.reduce((acc, id) => {
    const def = RESEARCH_TREE.find((r) => r.id === id);
    return acc + (def ? def.incomeBonus : 0);
  }, 0);
}

// ========== ПРАЗДНИКИ (Патч 1.1) ==========
import { getCurrentHoliday, getHolidayById } from '../utils/holidays';
import type { HolidayDef } from '../types';

export function getActiveHoliday(state: SelectorState): HolidayDef | null {
  // Приоритет: принудительный (из DevTools), затем календарный
  if (state.forcedHoliday) return getHolidayById(state.forcedHoliday);
  return getCurrentHoliday();
}

export function getHolidayMultiplier(state: SelectorState): number {
  const holiday = getActiveHoliday(state);
  return holiday ? holiday.multiplier : 1;
}

export function getTotalIncomePerSec(state: SelectorState): number {
  const base = getBaseIncomePerSec(state);
  const propertyMult = getPropertyMultiplier(state);
  const collection = getCollectionBonus(state);
  const researchBonus = 1 + getResearchIncomeBonus(state) / 100;
  const holidayMult = getHolidayMultiplier(state);

  return base * propertyMult * (1 + collection.income / 100) * researchBonus * holidayMult;
}

export function getCityStats(state: SelectorState) {
  let energy = 0;
  let water = 0;
  let buildingsCount = 0;
  for (const [id, count] of Object.entries(state.city.buildings)) {
    const def = CITY_BUILDINGS.find((b) => b.id === id);
    if (!def) continue;
    energy += def.energy * count;
    water += def.water * count;
    buildingsCount += count;
  }
  const employed = Math.round(state.city.population * 0.65);
  const unemployed = state.city.population - employed;
  const avgSalary = 25000 + state.city.happiness * 300;
  return { energy, water, buildingsCount, employed, unemployed, avgSalary };
}

export function getCityIncomePerSec(state: SelectorState): number {
  return state.city.population * (state.city.taxRate / 100) * 0.6;
}

export function getReputation(state: SelectorState): number {
  const transportRep = getTransportReputation(state);
  const collection = getCollectionBonus(state);
  return Math.round(transportRep * (1 + collection.reputation / 100));
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

/**
 * Скидка на кулдаун сделки от транспорта.
 * Суммируется `offlineBonusPercent` всех купленных машин (трактуем как
 * % сокращения кулдауна). Максимум 80%, чтобы кулдаун не обнулился.
 */
export function getDealCooldownReduction(state: SelectorState): number {
  const total = state.ownedTransport.reduce((acc, id) => {
    const def = TRANSPORT.find((t) => t.id === id);
    return acc + (def ? def.offlineBonusPercent : 0);
  }, 0);
  return Math.min(80, Math.max(0, total));
}

export function getDealCooldownMs(state: SelectorState): number {
  const BASE = 60 * 60 * 1000; // 60 минут
  const MIN = 5 * 60 * 1000;   // 5 минут — минимум
  const reductionPct = getDealCooldownReduction(state);
  const next = BASE * (1 - reductionPct / 100);
  return Math.max(MIN, Math.round(next));
}

export function getDealAmount(state: SelectorState): number {
  const income = getTotalIncomePerSec(state);
  const collection = getCollectionBonus(state);
  const dealBonus = 1 + collection.deal / 100;
  return income * 1800 * dealBonus;
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
  const rows: Omit<RatingRow, 'rank'>[] = companies
    .map((c) => ({
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

  return rows
    .slice(0, limit + 1)
    .map((r, i) => ({ ...r, rank: i + 1 }));
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
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import type { GameState } from './store';

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