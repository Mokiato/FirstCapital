import { RESOURCES_BY_ID } from '../../data/resources';
import type { ResourceGroup } from '../../data/resources';

/**
 * Дефолтные лимиты спроса NPC по группам ресурсов.
 * Один покупатель (NPC) — один общий лимит на ресурс за месяц.
 * Все каналы продажи (×0.7, ×0.4 авто-сбыт, ×0.4 ручная) делят его.
 */
const DEFAULT_BY_GROUP: Record<ResourceGroup, number> = {
  raw: 50_000,
  goods: 20_000,
  industrial: 5_000,
  fuel: 100_000,
  equipment: 100,
  food: 1_000,
};

/** Индивидуальные переопределения (если нужны). */
const OVERRIDES: Record<string, number> = {
  med_equipment: 20,
  it_equipment: 50,
  refrigeration: 200,
  automation: 500,
  windows: 500,
  electronics: 5_000,
  crude_oil: 200_000,
};

export function getNpcMonthlyDemand(resourceId: string): number {
  const def = RESOURCES_BY_ID[resourceId];
  if (!def) return 0;
  if (def.npcMonthlyDemand !== undefined) return def.npcMonthlyDemand;
  if (OVERRIDES[resourceId] !== undefined) return OVERRIDES[resourceId];
  return DEFAULT_BY_GROUP[def.group] ?? 5_000;
}

export function getRemainingNpcDemand(
  monthlyNpcSold: Record<string, number> | undefined,
  resourceId: string,
): number {
  const demand = getNpcMonthlyDemand(resourceId);
  const sold = monthlyNpcSold?.[resourceId] ?? 0;
  return Math.max(0, demand - sold);
}