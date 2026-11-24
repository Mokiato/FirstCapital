import type { Money } from './types';

export type WarehouseSize = 'small' | 'medium' | 'large' | 'huge';

export type WarehouseRole = 'manager' | 'hr' | 'accountant' | 'storekeeper' | 'loader' | 'driver';

export interface WarehouseEmployee {
  id: string;
  warehouseId: string;
  role: WarehouseRole;
  name: string;
  monthlySalary: number;
  monthsEmployed: number;
}

export interface WarehouseItem {
  resourceId: string;
  quantity: number;
  averageUnitCost: Money;
  arrivedAtMonth?: number; // для сроков годности (позже)
}

export type WarehouseMode = 'personal' | 'rent';

export interface WarehouseEvent {
  kind: 'theft' | 'fire' | 'pipe_burst' | 'equipment_break';
  month: number;
  cost: number; // стоимость устранения
  resolved: boolean;
}

/** Строка счёта за обслуживание своего парка (GDD §5.3). */
export interface FleetInvoiceLine {
  resourceId: string;
  /** Требуется всего (дробно). */
  required: number;
  /** Берём со склада бесплатно. */
  fromStock: number;
  /** Докупаем у NPC по 1.00 × P_market. */
  toBuy: number;
  unitPrice: number;
  purchaseCost: number;
}

export interface FleetInvoice {
  /** Месяц, за который выставлен счёт. */
  month: number;
  /** Перевезённый объём, ₽ по учётной себестоимости. */
  volume: number;
  lines: FleetInvoiceLine[];
  /** Итого докупка у NPC (со склада — 0 ₽). */
  purchaseTotal: number;
  /** Наёмный тариф, начисляемый при неоплате. */
  hiredFallback: number;
}

export interface WarehouseRuntime {
  id: string;
  customName: string;
  size: WarehouseSize;
  capacity: number;
  items: Record<string, WarehouseItem>;
  employees: WarehouseEmployee[];
  hasTrucks: boolean;
  mode: WarehouseMode;
  blockedUntilMonth?: number;
  activeEvent?: WarehouseEvent;
  lastEventMonth?: number;
  /** Сколько мест зарезервировано бизнесами, привязанными к складу. */
  reserved: Record<string, number>; // businessId -> quantity
  /** Месяц, когда склад был куплен (для условия «старше 6 мес»). */
  createdAtMonth?: number;
  /** Перевезённый объём за текущий месяц (₽ по учёту), обнуляется при закрытии. */
  fleetVolumeMonth?: number;
  /** Неоплаченный счёт за обслуживание парка → парк не работает. */
  fleetInvoice?: FleetInvoice;
  /** Месяцев подряд без выплаты зарплат персоналу склада. */
  payrollArrearsMonths?: number;
}

// ─── Аренда недвижимости ─────────────────────────────────
export interface RentalOffer {
  id: string;
  name: string;
  rentPrice: number;
  duration: number; // месяцев
}

export interface RentedProperty {
  id: string; // id недвижимости
  tenantName: string;
  rentPrice: number;
  monthsLeft: number;
  totalMonths: number;
}
/** Куда идёт заказ из Оптового магазина. */
export type CartTarget =
  | { type: 'warehouse'; warehouseId: string }
  | { type: 'business'; businessId: string };

/** Один товар в корзине. */
export interface CartItem {
  resourceId: string;
  quantity: number;
}