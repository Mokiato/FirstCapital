// src/game/economy/capex.ts
// GDD v2.0 §7.3: строительно-монтажный CAPEX-контур.
// Открытие объекта требует материальный пакет: со склада (0 ₽ денежной оплаты)
// или с рынка (1.00 × P_market). Денежную часть снижают Строительная компания
// (−15%) и Проектное бюро (−10%), совокупный кап 25% (§12.2).

import { RESOURCES_BY_ID } from '../../data/resources';
import { getNpcUnitPrice, type PriceContext } from './pricing';
import type { WarehouseRuntime } from '../domain/warehouseTypes';

export type CapexSource = 'warehouse' | 'market';

export interface CapexLine {
  resourceId: string;
  name: string;
  unit: string;
  qty: number;
  available: number;
  source: CapexSource;
  unitPrice: number;
  moneyCost: number;
}

export interface CapexPlan {
  lines: CapexLine[];
  marketTotal: number;
  warehouseUnits: number;
  discountPct: number;
}

const SMALL = { construction_mix: 10, furniture: 4, refrigeration: 1, lighting: 4 };
const LARGE = { construction_mix: 40, furniture: 15, refrigeration: 4, lighting: 20, windows: 8 };
const OFFICE = { construction_mix: 15, furniture: 10, windows: 8, lighting: 12, it_equipment: 1 };

const PACKAGES: Record<string, Record<string, number>> = {
  // ─── Малый сервис / кафе / розница ───
  coffee_shop: { ...SMALL }, tea_house: { ...SMALL },
  bakery: { ...SMALL }, confectionery: { ...SMALL },
  grocery_store: { ...SMALL }, clothing_store: { ...SMALL }, sport_store: { ...SMALL },
  electronics_store: { ...SMALL, it_equipment: 1 },
  carwash: { construction_mix: 10, furniture: 4, lighting: 4 },
  autoservice: { construction_mix: 10, furniture: 4, lighting: 4, metal_structures: 2 },

  // ─── Крупный сервис ───
  restaurant: { ...LARGE }, fitness: { ...LARGE }, hotel: { ...LARGE },
  cinema: { ...LARGE, it_equipment: 2 },

  // ─── Медицина ───
  pharmacy: { construction_mix: 12, furniture: 6, refrigeration: 2 },
  clinic: {
    construction_mix: 12, furniture: 6, refrigeration: 2,
    med_equipment: 1, automation: 2, lighting: 15, windows: 8,
  },

  // ─── Промышленность, логистика, НПЗ ───
  courier_service:   { construction_mix: 30, metal_structures: 10, automation: 2, filters: 4, lighting: 10 },
  logistics_company: { construction_mix: 40, metal_structures: 14, automation: 3, filters: 6, lighting: 12 },
  construction_co:   { construction_mix: 50, metal_structures: 18, automation: 4, filters: 6, lighting: 14 },
  oil_extraction:    { construction_mix: 60, metal_structures: 20, automation: 4, filters: 8, lighting: 16 },
  oil_refinery:      { construction_mix: 80, metal_structures: 25, automation: 6, filters: 10, lighting: 20 },
  prod_recycling:         { construction_mix: 30, metal_structures: 10, automation: 2, filters: 4, lighting: 10 },
  prod_packaging:         { construction_mix: 35, metal_structures: 12, automation: 2, filters: 4, lighting: 12 },
  prod_construction_mix:  { construction_mix: 40, metal_structures: 14, automation: 3, filters: 5, lighting: 12 },
  prod_cleaning:          { construction_mix: 35, metal_structures: 12, automation: 3, filters: 5, lighting: 12 },
  prod_soda:              { construction_mix: 45, metal_structures: 16, automation: 3, filters: 6, lighting: 14 },
  prod_metal:             { construction_mix: 50, metal_structures: 18, automation: 4, filters: 6, lighting: 14 },
  prod_med_supplies:      { construction_mix: 45, metal_structures: 16, automation: 3, filters: 6, lighting: 14 },
  prod_furniture:         { construction_mix: 50, metal_structures: 18, automation: 4, filters: 6, lighting: 14 },
  prod_lighting:          { construction_mix: 55, metal_structures: 20, automation: 4, filters: 8, lighting: 16 },
  prod_autoparts:         { construction_mix: 60, metal_structures: 22, automation: 5, filters: 8, lighting: 16 },
  prod_windows:           { construction_mix: 65, metal_structures: 22, automation: 5, filters: 8, lighting: 18 },
  prod_filters:           { construction_mix: 60, metal_structures: 22, automation: 5, filters: 8, lighting: 16 },
  prod_automation:        { construction_mix: 70, metal_structures: 25, automation: 6, filters: 9, lighting: 18 },
  prod_refrigeration:     { construction_mix: 80, metal_structures: 25, automation: 6, filters: 10, lighting: 20 },

  // ─── 11 офисов холдинга ───
  off_hr_bureau: { ...OFFICE },
  off_accounting_bureau: { ...OFFICE },
  off_procurement_center: { ...OFFICE },
  off_analytics_center: { ...OFFICE },
  off_insurance_bureau: { ...OFFICE },
  off_legal_bureau: { ...OFFICE },
  off_quality_lab: { ...OFFICE },
  off_engineering_service: { ...OFFICE },
  off_project_bureau: { ...OFFICE },
  off_system_integrator: { ...OFFICE, it_equipment: 2 },
  off_game_studio: { ...OFFICE, it_equipment: 2 },
};

/** Пакет объекта; для собственного здания +2 windows (§7.3). */
export function getCapexPackage(defId: string, ownedBuilding: boolean): Record<string, number> {
  const pkg = { ...(PACKAGES[defId] ?? { ...SMALL }) };
  if (ownedBuilding) pkg.windows = (pkg.windows ?? 0) + 2;
  return pkg;
}

/** Скидка на денежно-монтажную часть: стройкомпания −15% + проектное бюро −10%, кап 25%. */
export function getCapexDiscount(o: { hasConstructionCo: boolean; hasProjectBureau: boolean }): number {
  return Math.min(0.25, (o.hasConstructionCo ? 0.15 : 0) + (o.hasProjectBureau ? 0.10 : 0));
}

export interface BuildCapexOpts {
  procurementDiscount?: number;
  capexDiscount?: number;
  overrides?: Record<string, CapexSource>;
}

export function buildCapexPlan(
  pkg: Record<string, number>,
  warehouses: WarehouseRuntime[],
  ctx: PriceContext,
  opts: BuildCapexOpts = {},
): CapexPlan {
  const capexDiscount = opts.capexDiscount ?? 0;
  const lines: CapexLine[] = [];
  let marketTotal = 0;
  let warehouseUnits = 0;

  for (const [resourceId, qty] of Object.entries(pkg)) {
    if (qty <= 0) continue;
    const res = RESOURCES_BY_ID[resourceId];
    const available = (warehouses ?? []).reduce(
      (s, w) => s + (w.items[resourceId]?.quantity ?? 0), 0,
    );
    const source = opts.overrides?.[resourceId] ?? (available >= qty ? 'warehouse' : 'market');
    const unitPrice =
      getNpcUnitPrice(resourceId, ctx, opts.procurementDiscount ?? 0) * (1 - capexDiscount);
    const moneyCost = source === 'market' ? unitPrice * qty : 0;
    if (source === 'market') marketTotal += moneyCost;
    else warehouseUnits += qty;
    lines.push({
      resourceId, name: res?.name ?? resourceId, unit: res?.unit ?? 'шт',
      qty, available, source, unitPrice, moneyCost,
    });
  }

  return {
    lines,
    marketTotal: Math.round(marketTotal),
    warehouseUnits,
    discountPct: Math.round(capexDiscount * 100),
  };
}

/** Списывает CAPEX со складов по порядку; возвращает обновлённые склады. */
export function consumeCapexFromWarehouses(
  warehouses: WarehouseRuntime[],
  plan: CapexPlan,
): WarehouseRuntime[] {
  const need: Record<string, number> = {};
  for (const l of plan.lines) {
    if (l.source === 'warehouse') need[l.resourceId] = (need[l.resourceId] ?? 0) + l.qty;
  }
  if (Object.keys(need).length === 0) return warehouses;

  return (warehouses ?? []).map((w) => {
    const items = { ...w.items };
    let changed = false;
    for (const [resId, total] of Object.entries(need)) {
      if (total <= 0) continue;
      const item = items[resId];
      if (!item || item.quantity <= 0) continue;
      const take = Math.min(item.quantity, total);
      need[resId] = total - take;
      changed = true;
      const left = item.quantity - take;
      if (left <= 0.000001) delete items[resId];
      else items[resId] = { ...item, quantity: left };
    }
    return changed ? { ...w, items } : w;
  });
}