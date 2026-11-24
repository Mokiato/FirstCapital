// src/game/economy/pricing.ts
// GDD v2.0 §5: единая рыночная цена и пять каналов торговли.

import { RESOURCES_BY_ID } from '../../data/resources';
import { getResourcePriceMultiplier } from '../events/eventEngine';
import type { ActiveEvent } from '../domain/types';

/** Каналы к P_market: закупка у NPC / плановый B2B / слив сверх спроса. */
export const CHANNEL = {
  npcBuy: 1.0,
  b2bSell: 0.9,
  dumpSell: 0.45,
} as const;

/** Логистика (GDD §5.3). Свой парк обнуляет наценку. */
export const LOGISTICS = {
  hiredExternal: 0.12,
  hiredInternal: 0.05,
  minDeliveryFee: 2_500,
} as const;

export const PROCUREMENT_DISCOUNT_CAP = 0.20;
export const EVENT_PRICE_MULT_CAP = 2.5;
export const MARKET_INDEX_MIN = 0.90;
export const MARKET_INDEX_MAX = 1.10;

export interface PriceContext {
  marketIndex: number;
  activeEvents: ActiveEvent[];
  monthIndex: number;
}

/** P_market = basePrice × marketIndex × ∏ событий (с мягким капом ×2.5). */
export function getMarketPrice(resourceId: string, ctx: PriceContext): number {
  const base = Number(RESOURCES_BY_ID[resourceId]?.basePrice ?? 0);
  if (base <= 0) return 0;
  const eventMult = Math.min(
    EVENT_PRICE_MULT_CAP,
    getResourcePriceMultiplier(ctx.activeEvents ?? [], resourceId, ctx.monthIndex),
  );
  return base * (ctx.marketIndex ?? 1) * eventMult;
}

export function getProcurementDiscount(raw: number): number {
  return Math.min(PROCUREMENT_DISCOUNT_CAP, Math.max(0, raw));
}

/** Канал 1: закупка у NPC, 1.00 × P_market × (1 − скидка), без доставки. */
export function getNpcUnitPrice(resourceId: string, ctx: PriceContext, discount = 0): number {
  return getMarketPrice(resourceId, ctx) * CHANNEL.npcBuy * (1 - getProcurementDiscount(discount));
}

/** Канал 3: плановая оптовая продажа B2B. */
export function getB2BUnitPrice(resourceId: string, ctx: PriceContext): number {
  return getMarketPrice(resourceId, ctx) * CHANNEL.b2bSell;
}

/** Канал 5: слив сверх месячного спроса / принудительный выкуп. */
export function getDumpUnitPrice(resourceId: string, ctx: PriceContext): number {
  return getMarketPrice(resourceId, ctx) * CHANNEL.dumpSell;
}

/** Наёмная доставка: +12%, но не менее 2 500 ₽ за поставку. Свой парк — 0 ₽. */
export function getExternalDeliveryFee(goodsCost: number, hasOwnTransport: boolean): number {
  if (hasOwnTransport || goodsCost <= 0) return 0;
  return Math.max(LOGISTICS.minDeliveryFee, goodsCost * LOGISTICS.hiredExternal);
}

/** Внутренняя поставка со склада в свой бизнес: +5% себестоимости, свой парк — 0 ₽. */
export function getInternalDeliveryFee(batchCost: number, hasOwnTransport: boolean): number {
  if (hasOwnTransport || batchCost <= 0) return 0;
  return batchCost * LOGISTICS.hiredInternal;
}

/** Плавный макроцикл 0.90–1.10: синусоида ~36 мес + шум, с инерцией. */
export function nextMarketIndex(
  current: number,
  monthIndex: number,
  random: () => number = Math.random,
): number {
  const target = 1 + 0.08 * Math.sin((2 * Math.PI * monthIndex) / 36);
  const noise = (random() * 2 - 1) * 0.01;
  const next = (current ?? 1) + (target - (current ?? 1)) * 0.35 + noise;
  return Math.max(MARKET_INDEX_MIN, Math.min(MARKET_INDEX_MAX, next));
}