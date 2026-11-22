// src/data/stocks.ts
// ПРОИЗВОДНЫЙ файл: единственный источник правды — companies.ts.
// Здесь только состояние акций (цена, история) и функция рыночного тика.
// Тик должен вызываться из симуляционного ядра (Блок 1), а не из App.tsx.

import { COMPANIES, type SectorId, type StockBehavior } from './companies';

export type { SectorId, StockBehavior };

export interface Stock {
  id: string;
  name: string;
  category: SectorId;
  sector: SectorId;
  behavior: StockBehavior;
  dividends: boolean;
  price: number;
  prevPrice: number;
  basePrice: number;
  /** Последние 100 точек цены (включая текущую) */
  history: number[];
  /** Устаревшее поле для совместимости с UI, если где-то используется */
    volatility?: number;
  /** @deprecated для старого UI, удаляется в Блоке 9 */
  emoji?: string;
  /** @deprecated для старого UI, удаляется в Блоке 9 */
  ticker?: string;
}

/** Волатильность за один рыночный тик (≈0.1 игрового месяца). */
export const BEHAVIOR_VOLATILITY: Record<StockBehavior, number> = {
  stable: 0.003,
  moderate: 0.008,
  volatile: 0.02,
  speculative: 0.05,
};

/** Стартовое состояние рынка — собирается из каталога компаний. */
export const STOCKS: Stock[] = COMPANIES.map(c => ({
  id: c.id,
  name: c.name,
  category: c.sector,
  sector: c.sector,
  behavior: c.stockBehavior,
  dividends: c.dividends,
  price: c.basePrice,
  prevPrice: c.basePrice,
  basePrice: c.basePrice,
  history: [c.basePrice],
  volatility: BEHAVIOR_VOLATILITY[c.stockBehavior],
  emoji: '📈',
  ticker: c.id.slice(0, 4).toUpperCase(),
}));

/**
 * Один рыночный тик: пересчитывает цены по типу поведения.
 * Возвращает НОВЫЙ массив (не мутирует старый — важно для Zustand).
 *
 * Примечание: небольшой положительный дрейф (+2% к случайному шуму)
 * чтобы стабильные бумаги не «умирали», а спекулятивные не уходили в 0.
 */
import { SECTORS } from './sectors';
export const STOCK_CATEGORY_LABELS: Record<SectorId, string> =
  Object.fromEntries(SECTORS.map((s) => [s.id, s.name])) as Record<SectorId, string>;