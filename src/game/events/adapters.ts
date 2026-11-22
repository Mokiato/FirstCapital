// src/game/events/adapters.ts
// Адаптер data/events.ts (EventTemplate из data) → domain/EventTemplate.
// Проблемы:
//   - в data: id: EventType, name, durationMonths: [min, max], effects: string
//   - в domain: title, weight, durationMonths: number, effects: EventEffect[]

import type {
  EventTemplate as DomainEventTemplate,
  EventEffect,
} from '../domain/types';
import {
  EVENT_TEMPLATES,
  type EventTemplate as DataEventTemplate,
} from '../../data/events';
import { STOCKS } from '../../data/stocks';

/** Веса по типу события — более частые сценарии выше. */
const WEIGHT_BY_TYPE: Record<string, number> = {
  raw_price_spike: 3,
  demand_boom: 4,
  inspection: 2,
  logistics_strike: 2,
  npc_success: 3,
  npc_fail: 3,
  seasonal_demand: 3,
  resource_shortage: 2,
  tax_audit: 1,
  festival: 2,
  employee_poach: 1,
  credit_downgrade: 1,
  oil_shock: 2,
  cat_barista: 3,
  heat_wave: 3,
  bread_meme: 3,
  container_stuck: 2,
  traffic_cleared: 2,
  logistics_tariffs: 3,
  energy_tariffs: 3,
  truck_stuck: 3,
  retail_closing: 2,
  factory_second_shift: 2,
  cat_conveyor: 2,
  bank_limits: 2,
  construction_prices: 3,
  grain_export: 2,
  courier_record: 3,
  office_workshops: 2,
  gromov_production: 3,
  gromov_checks: 2,
  gromov_traffic: 3,
};

/** Сектора, к которым применяется событие (по BusinessRuntime.sectorId). */
const SECTOR_BY_TYPE: Record<string, string[]> = {
  demand_boom: ['services', 'retail'],
  seasonal_demand: ['services'],
  festival: ['services'],
  logistics_strike: ['logistics'],
};

/**
 * Построить effects[] из data-шаблона.
 * Применяем только те, что умеет обрабатывать businessesProcessor:
 *   - sectorDemand (b2b: для ресторанов, магазинов)
 *   - resourcePrice (для закупок)
 *   - companyPrice (для акций)
 */
function buildEffects(t: DataEventTemplate): EventEffect[] {
  const effects: EventEffect[] = [];

  // Спрос в секторах
  if (t.id === 'demand_boom' || t.id === 'seasonal_demand' || t.id === 'festival') {
    const mult =
      t.id === 'festival' ? 1.4 : t.id === 'seasonal_demand' ? 1.3 : 1.25;
    for (const s of SECTOR_BY_TYPE[t.id] ?? []) {
      effects.push({ kind: 'sectorDemand', targetId: s, multiplier: mult });
    }
  }

  // Цены на ресурсы
  if (t.id === 'raw_price_spike' && t.affectedResources?.length) {
    for (const r of t.affectedResources) {
      effects.push({ kind: 'resourcePrice', targetId: r, multiplier: 1.3 });
    }
  }

  // Акции NPC
  if (t.id === 'npc_success' || t.id === 'npc_fail') {
    if (STOCKS.length > 0) {
      const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      effects.push({
        kind: 'companyPrice',
        targetId: stock.id,
        multiplier: t.id === 'npc_success' ? 1.15 : 0.8,
      });
    }
  }
  // ─── Мемные события (Фаза 4) ─────────────────────────
  if (t.id === 'oil_shock') {
    effects.push({ kind: 'resourcePrice', targetId: 'fuel', multiplier: 1.25 });
    effects.push({ kind: 'companyPrice', targetId: 'petrogrand', multiplier: 1.15 });
    effects.push({ kind: 'companyPrice', targetId: 'neftmagistral', multiplier: 1.15 });
    effects.push({ kind: 'companyPrice', targetId: 'oilfieldco', multiplier: 1.20 });
  }

  if (t.id === 'cat_barista') {
    // Кофейни/кафе — сектор services
    effects.push({ kind: 'sectorDemand', targetId: 'services', multiplier: 1.30 });
  }

  if (t.id === 'heat_wave') {
    effects.push({ kind: 'sectorDemand', targetId: 'retail', multiplier: 1.20 });
    effects.push({ kind: 'resourcePrice', targetId: 'drinks', multiplier: 1.40 });
  }

  if (t.id === 'bread_meme') {
    effects.push({ kind: 'sectorDemand', targetId: 'services', multiplier: 1.20 });
    effects.push({ kind: 'resourcePrice', targetId: 'flour', multiplier: 1.10 });
  }

  if (t.id === 'container_stuck') {
    effects.push({ kind: 'resourcePrice', targetId: 'electronics', multiplier: 1.15 });
    effects.push({ kind: 'resourcePrice', targetId: 'parts', multiplier: 1.15 });
  }
    // ─── Серьёзные события (Фаза 5) ─────────────────────
  if (t.id === 'traffic_cleared') {
    effects.push({ kind: 'sectorDemand', targetId: 'logistics', multiplier: 1.05 });
    effects.push({ kind: 'resourcePrice', targetId: 'fuel', multiplier: 0.98 });
  }

  if (t.id === 'logistics_tariffs' || t.id === 'energy_tariffs') {
    const mult = t.id === 'logistics_tariffs' ? 1.05 : 1.04;
    effects.push({ kind: 'resourcePrice', targetId: 'fuel', multiplier: mult });
  }

  if (t.id === 'truck_stuck') {
    effects.push({ kind: 'resourcePrice', targetId: 'sweets', multiplier: 1.03 });
    effects.push({ kind: 'resourcePrice', targetId: 'pastry', multiplier: 1.03 });
  }

  if (t.id === 'retail_closing' || t.id === 'gromov_checks') {
    const mult = t.id === 'retail_closing' ? 0.97 : 0.98;
    effects.push({ kind: 'sectorDemand', targetId: 'retail', multiplier: mult });
  }

  if (t.id === 'factory_second_shift' || t.id === 'gromov_production') {
    const mult = t.id === 'factory_second_shift' ? 1.10 : 1.04;
    effects.push({ kind: 'sectorDemand', targetId: 'production', multiplier: mult });
  }

  if (t.id === 'cat_conveyor') {
    effects.push({ kind: 'sectorDemand', targetId: 'production', multiplier: 0.95 });
  }

  if (t.id === 'bank_limits') {
    effects.push({ kind: 'companyPrice', targetId: 'capitaltrust', multiplier: 0.95 });
  }

  if (t.id === 'construction_prices') {
    effects.push({ kind: 'resourcePrice', targetId: 'building_mat', multiplier: 1.06 });
    effects.push({ kind: 'resourcePrice', targetId: 'windows', multiplier: 1.06 });
  }

  if (t.id === 'grain_export') {
    effects.push({ kind: 'resourcePrice', targetId: 'flour', multiplier: 0.95 });
  }

  if (t.id === 'courier_record') {
    effects.push({ kind: 'sectorDemand', targetId: 'logistics', multiplier: 1.05 });
  }

  if (t.id === 'office_workshops') {
    effects.push({ kind: 'sectorDemand', targetId: 'services', multiplier: 1.03 });
  }

  if (t.id === 'gromov_traffic') {
    effects.push({ kind: 'sectorDemand', targetId: 'logistics', multiplier: 1.05 });
    effects.push({ kind: 'resourcePrice', targetId: 'fuel', multiplier: 0.98 });
  }
  return effects;
}

function toDomain(t: DataEventTemplate): DomainEventTemplate {
  return {
    id: t.id,
    title: t.name,
    description: t.description,
    weight: WEIGHT_BY_TYPE[t.id] ?? 1,
    durationMonths: Math.max(
      1,
      Math.floor((t.durationMonths[0] + t.durationMonths[1]) / 2),
    ),
    effects: buildEffects(t),
  };
}

/** Готовые domain-шаблоны для rollMonthlyEvent. */
export const DOMAIN_EVENT_TEMPLATES: DomainEventTemplate[] =
  EVENT_TEMPLATES.map(toDomain);