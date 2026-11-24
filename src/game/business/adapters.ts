// src/game/business/adapters.ts
// Адаптеры между статическими данными (BusinessDef из data/businesses.ts)
// и рантайм-состоянием (BusinessRuntime из domain/types.ts).
// Здесь же — маппинг ResourceDef → ResourceDefinition для inventory.

import type {
  BusinessRuntime,
  Id,
  ResourceDefinition,
  ResourceKind,
  ResourceRequirement,
  Warehouse,
} from '../domain/types';
import type { BusinessDef, BusinessKind } from '../../data/businesses';
import type { ResourceDef } from '../../data/resources';
import { RESOURCES_BY_ID } from '../../data/resources';
import { createWarehouse } from '../logistics/inventory';
import { TAXES } from '../config/taxes';
import { getNpcUnitPrice, type PriceContext } from '../economy/pricing';


const SECTOR_BY_KIND: Record<BusinessKind, string> = {
  service: 'services',
  retail: 'retail',
  production: 'production',
  logistics: 'logistics',
  office: 'office',
};

const KIND_MAP: Record<string, ResourceKind> = {
  raw: 'raw',
  goods: 'finished',
  equipment: 'equipment',
  food: 'food',
  fuel: 'raw',
};

function mapResourceKind(group: string): ResourceKind {
  return KIND_MAP[group] ?? 'raw';
}

/** Преобразовать ResourceDef из data в ResourceDefinition из domain. */
export function resourceDefToDomain(res: ResourceDef): ResourceDefinition {
  return {
    id: res.id,
    name: res.name,
    category: res.group,
    unit: res.unit,
    kind: mapResourceKind(res.group),
    unitPrice: String(res.basePrice ?? 0),
  };
}

/** Извлечь ResourceRequirement[] из BusinessDef.keyResources. */
export function resourceRequirementsFromDef(def: BusinessDef): ResourceRequirement[] {
  return Object.entries(def.keyResources).map(([resourceId, unitsPerLevel]) => ({
    resourceId,
    unitsPerLevel,
  }));
}

/**
 * Создать BusinessRuntime из BusinessDef.
 * @param instanceId Уникальный ID экземпляра (позволяет несколько одинаковых).
 */
export function businessDefToRuntime(
  def: BusinessDef,
  opts: {
    instanceId?: Id;
    level?: number;
    premisesMode?: 'rent' | 'owned';
  } = {},
): BusinessRuntime {
  const level = opts.level ?? 1;
  const premisesMode = opts.premisesMode ?? 'rent';
  const instanceId =
    opts.instanceId ?? `biz_${def.id}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

  // Аренда = 70% fixedCosts, ЖКХ = 30%, обслуживание = 5% fixedCosts
  const rentMonthly = premisesMode === 'rent'
    ? String(def.fixedCosts * 0.7)
    : '0';
  const utilitiesMonthly = String(def.fixedCosts * 0.3);
  const maintenanceMonthly = String(def.fixedCosts * 0.05);

  return {
    id: instanceId,
    defId: def.id,
    name: def.name,
    sectorId: SECTOR_BY_KIND[def.kind] ?? def.kind,
    level,
    status: 'operating',
    cashBalance: '0',
    baseMonthlyRevenue: String(def.baseRevenue),
    demandMultiplier: 1,
    productivityMultiplier: 1,
    monthlyPayroll: '0', // обновляется в payrollProcessor по фактическим сотрудникам
    monthlyRent: rentMonthly,
    monthlyUtilities: utilitiesMonthly,
    monthlyMaintenance: maintenanceMonthly,
    taxRate: TAXES.businessProfit,
    resourceNeeds: resourceRequirementsFromDef(def),
    monthsWithoutSupply: 0,
    monthsStopped: 0,
    accruedLiabilities: '0',
  };
}

/** Начальный склад для открытия бизнеса — сток на 1 месяц. */
export function startingWarehouseFor(
  def: BusinessDef,
  capacity = 10_000,
): Warehouse {
  const w = createWarehouse(capacity);
  for (const [id, qty] of Object.entries(def.keyResources)) {
    const res = RESOURCES_BY_ID[id];
    if (!res) continue;
    w.items[id] = {
      resourceId: id,
      quantity: qty,
      averageUnitCost: String(res.basePrice ?? 0),
    };
  }
  return w;
}

/** Найти BusinessDef по BusinessRuntime (через defId). */
export function findDefForRuntime(
  runtime: BusinessRuntime,
  allDefs: BusinessDef[],
): BusinessDef | undefined {
  if (runtime.defId) return allDefs.find((d) => d.id === runtime.defId);
  // Fallback: попробуем угадать по id (для старых снимков)
  return allDefs.find((d) => runtime.id.startsWith(`biz_${d.id}_`));
}
// ── Оценка стоимости открытия ────────────────────────────────────────────────

export interface OpeningCostEstimate {
  equipment: number;
  /** Разовое оборудование (requiredEquipment) по 1.00 × P_market. */
  requiredEquipment: number;
  /** Стартовый запас keyResources на 1 месяц по 1.00 × P_market. */
  initialResources: number;
  premises: number;
  firstMonthRent: number;
  firstMonthUtilities: number;
  operatingCapital: number;
  total: number;
}

export function estimateOpeningCost(
  def: BusinessDef,
  premisesMode: 'rent' | 'owned',
  operatingCapital: number,
  priceCtx?: PriceContext,
  procurementDiscount = 0,
): OpeningCostEstimate {
  const ctx: PriceContext = priceCtx ?? { marketIndex: 1, activeEvents: [], monthIndex: 0 };
  const unitPrice = (id: string) => getNpcUnitPrice(id, ctx, procurementDiscount);

  const equipment = def.startingEquipment ?? def.fixedCosts * 2;
  const premises =
    premisesMode === 'owned'
      ? def.premisesPrice ?? def.fixedCosts * 24
      : 0;
  const firstMonthRent = premisesMode === 'rent' ? def.fixedCosts * 0.7 : 0;
  const firstMonthUtilities = def.fixedCosts * 0.3;

  let requiredEquipment = 0;
  for (const [id, qty] of Object.entries(def.requiredEquipment ?? {})) {
    requiredEquipment += unitPrice(id) * qty;
  }
  let initialResources = 0;
  for (const [id, qty] of Object.entries(def.keyResources)) {
    initialResources += unitPrice(id) * qty;
  }

  const total =
    equipment + requiredEquipment + initialResources +
    premises + firstMonthRent + firstMonthUtilities + operatingCapital;

  return {
    equipment,
    requiredEquipment,
    initialResources,
    premises,
    firstMonthRent,
    firstMonthUtilities,
    operatingCapital,
    total,
  };
}