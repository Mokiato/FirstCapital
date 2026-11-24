// src/game/logistics/fleet.ts
// GDD v2.0 §5.3: свой парк обнуляет наценку доставки, но потребляет расходники.

import type {
  WarehouseRuntime, WarehouseItem, FleetInvoice, FleetInvoiceLine,
} from '../domain/warehouseTypes';
import { getNpcUnitPrice, LOGISTICS, type PriceContext } from '../economy/pricing';

/** Расходники на каждые 100 000 ₽ перевезённого объёма. */
export const FLEET_CONSUMPTION_PER_100K: Record<string, number> = {
  fuel: 45,
  parts: 0.3,
  lubricants: 1.0,
};

export const FLEET_VOLUME_UNIT = 100_000;

/**
 * Парк работает только при трёх условиях:
 * грузовик куплен + нанят водитель + нет неоплаченного счёта.
 */
export function isFleetOperational(wh: WarehouseRuntime | undefined | null): boolean {
  if (!wh || !wh.hasTrucks) return false;
  if (wh.fleetInvoice) return false;
  return wh.employees.some((e) => e.role === 'driver');
}

/** Требуемые расходники для объёма (дробные, списываются точно). */
export function getFleetConsumables(volume: number): Record<string, number> {
  if (volume <= 0) return {};
  const k = volume / FLEET_VOLUME_UNIT;
  const out: Record<string, number> = {};
  for (const [id, per] of Object.entries(FLEET_CONSUMPTION_PER_100K)) {
    out[id] = per * k;
  }
  return out;
}

/** Счёт: что берём со склада, что докупаем у NPC. */
export function buildFleetInvoice(
  wh: WarehouseRuntime,
  volume: number,
  month: number,
  ctx: PriceContext,
  procurementDiscount = 0,
): FleetInvoice {
  const need = getFleetConsumables(volume);
  const lines: FleetInvoiceLine[] = [];
  let purchaseTotal = 0;

  for (const [resourceId, required] of Object.entries(need)) {
    const onStock = wh.items[resourceId]?.quantity ?? 0;
    const fromStock = Math.min(onStock, required);
    const toBuy = Math.max(0, required - fromStock);
    const unitPrice = getNpcUnitPrice(resourceId, ctx, procurementDiscount);
    const purchaseCost = toBuy * unitPrice;
    purchaseTotal += purchaseCost;
    lines.push({ resourceId, required, fromStock, toBuy, unitPrice, purchaseCost });
  }

  return {
    month,
    volume,
    lines,
    purchaseTotal,
    hiredFallback: Math.max(LOGISTICS.minDeliveryFee, volume * LOGISTICS.hiredExternal),
  };
}

/**
 * Оплата счёта: списываем со склада фактически доступное, нехватку докупаем
 * по цене, зафиксированной в счёте. Деньги проводит вызывающая сторона.
 */
export function settleFleetInvoice(
  wh: WarehouseRuntime,
  invoice: FleetInvoice,
): { items: Record<string, WarehouseItem>; purchaseCost: number } {
  const items = { ...wh.items };
  let purchaseCost = 0;

  for (const line of invoice.lines) {
    const available = items[line.resourceId]?.quantity ?? 0;
    const fromStock = Math.min(available, line.required);
    const toBuy = Math.max(0, line.required - fromStock);
    purchaseCost += toBuy * line.unitPrice;

    if (fromStock > 0) {
      const item = items[line.resourceId];
      if (item) {
        const left = item.quantity - fromStock;
        if (left <= 0.000001) delete items[line.resourceId];
        else items[line.resourceId] = { ...item, quantity: left };
      }
    }
  }

  return { items, purchaseCost };
}