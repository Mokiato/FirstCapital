import type { Money } from './types';
import type { EmployeeRuntime } from './types';

export type EnterpriseType = 'production' | 'office';

/**
 * Рантайм производства или офисной компании.
 * Не путать с BusinessRuntime: производство требует промпомещения,
 * офисная компания — офиса. Поля похожи на BusinessRuntime.
 */
export interface EnterpriseRuntime {
  id: string;
  type: EnterpriseType;
  /** Ссылка на PRODUCTIONS[id] или OFFICE_COMPANIES[id]. */
  defId: string;
  /** Ссылка на ownedProperty[id] (category='industrial' или 'office'). */
  premisesId: string;
  level: number;
  status: 'operating' | 'stopped' | 'closed';
  cashBalance: Money;
  inventory: Record<string, { quantity: number; averageUnitCost: Money }>;
  employees: EmployeeRuntime[];
  monthlyPayroll: Money;
  monthlyRent: Money;
  monthlyUtilities: Money;
  monthlyMaintenance: Money;
  taxRate: number;
  baseMonthlyRevenue: Money;
  demandMultiplier: number;
  productivityMultiplier: number;
  startedAtMonth: number;
  /** Сколько месяцев подряд не удалось выплатить зарплату. При >= 3 — все увольняются. */
  monthsWithoutPayroll?: number;
  /** Сколько месяцев подряд не хватало ресурсов. */
  monthsWithoutSupply?: number;
  /** Расходы, отражённые в учёте, но пока не оплаченные (например, невыплаченная зарплата). */
  accruedLiabilities?: Money;
  /**
   * Распределение продукции производства (только для type='production'):
   * resourceId → { toWarehouse: шт, toSell: шт }.
   * Остаток (произведено − склад − продажа) → авто-продажа.
   */
  productionDistribution?: Record<string, { toWarehouse: number; toSell: number }>;
    /** ID склада, к которому привязано предприятие (для отгрузки продукции). */
  linkedWarehouseId?: string;
}