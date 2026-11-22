// src/game/finance/adapters.ts
// Конвертация data/finance.ts → domain/types.ts

import type {
  FundDefinition,
  BondDefinition,
  MetalPosition,
} from '../domain/types';
import {
  FUNDS,
  BONDS,
  METALS,
  METALS_BY_ID,
  type MetalId,
} from '../../data/finance';

/** Месячная доходность → годовая (сложный процент). */
function monthlyToAnnual(monthlyYield: number): number {
  return Math.pow(1 + monthlyYield, 12) - 1;
}

/** Купон в месяц → годовой (простой). */
function monthlyCouponToAnnual(monthly: number): number {
  return monthly * 12;
}

export function buildFundDefinitions(): FundDefinition[] {
  return FUNDS.map((f) => ({
    id: f.id,
    name: f.name,
    annualYield: monthlyToAnnual(f.monthlyYield),
    monthlyVolatility: f.volatility,
  }));
}

export const FUND_DEFINITIONS_BY_ID: Record<string, FundDefinition> =
  Object.fromEntries(buildFundDefinitions().map((f) => [f.id, f]));

export function buildBondDefinitions(): BondDefinition[] {
  return BONDS.map((b) => ({
    id: b.id,
    name: b.name,
    annualCouponRate: monthlyCouponToAnnual(b.monthlyCoupon),
    maturityMonths: b.termMonths,
    faceValue: String(b.faceValue),
    purchasePrice: String(b.faceValue),
  }));
}

export const BOND_DEFINITIONS_BY_ID: Record<string, BondDefinition> =
  Object.fromEntries(buildBondDefinitions().map((b) => [b.id, b]));

/** Начальная позиция металла (цена = basePrice). */
export function createMetalPosition(
  metalId: string,
  quantity: number,
): MetalPosition {
  const def = METALS_BY_ID[metalId as MetalId];
  return {
    metalId,
    quantity,
    currentPrice: String(def?.basePrice ?? 0),
  };
}

/** Изменение цены металла за месяц по волатильности. */
export function tickMetalPrice(
  metalId: string,
  currentPrice: string,
  random: () => number = Math.random,
): string {
  const def = METALS_BY_ID[metalId as MetalId];
  if (!def) return currentPrice;
  const noise = (random() * 2 - 1) * def.volatility;
  const next = Math.max(1, Number(currentPrice) * (1 + noise));
  return String(Math.round(next * 100) / 100);
}

/** Описание металла по id. */
export function getMetalDef(metalId: string) {
  return METALS_BY_ID[metalId as MetalId];
}

export function getAllMetals() {
  return METALS;
}