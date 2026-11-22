import type {
  InventoryItem,
  Money,
  ResourceDefinition,
  ResourceRequirement,
  Warehouse,
} from '../domain/types';
import {
  moneyAdd,
  moneyCmp,
  moneyDiv,
  moneyMul,
  moneySub,
  ZERO_MONEY,
} from '../domain/money';

export type InventoryResult =
  | {
      ok: true;
      warehouse: Warehouse;
      balance: Money;
      spent: Money;
    }
  | {
      ok: false;
      reason: string;
      warehouse: Warehouse;
      balance: Money;
    };

export interface ResourceConsumptionResult {
  warehouse: Warehouse;
  supplied: boolean;
  missingResources: Array<{
    resourceId: string;
    required: number;
    available: number;
  }>;
  consumedValue: Money;
}

export function createWarehouse(capacity = 100): Warehouse {
  return {
    capacity,
    items: {},
  };
}

export function getWarehouseUsedCapacity(
  warehouse: Warehouse,
): number {
  return Object.values(warehouse.items).reduce(
    (total, item) => total + item.quantity,
    0,
  );
}

export function purchaseResource(
  warehouse: Warehouse,
  resource: ResourceDefinition,
  quantity: number,
  balance: Money,
): InventoryResult {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      ok: false,
      reason: 'Укажите количество больше нуля.',
      warehouse,
      balance,
    };
  }

  const usedCapacity = getWarehouseUsedCapacity(warehouse);
  const freeCapacity = warehouse.capacity - usedCapacity;

  if (quantity > freeCapacity) {
    return {
      ok: false,
      reason: 'На складе недостаточно места.',
      warehouse,
      balance,
    };
  }

  const spent = moneyMul(resource.unitPrice, quantity);

  if (moneyCmp(balance, spent) < 0) {
    return {
      ok: false,
      reason: 'Недостаточно средств.',
      warehouse,
      balance,
    };
  }

  const oldItem = warehouse.items[resource.id];
  const oldQuantity = oldItem?.quantity ?? 0;
  const oldValue = oldItem
    ? moneyMul(oldItem.averageUnitCost, oldQuantity)
    : ZERO_MONEY;

  const newQuantity = oldQuantity + quantity;
  const newTotalValue = moneyAdd(oldValue, spent);

  const averageUnitCost =
    newQuantity > 0
      ? moneyDiv(newTotalValue, newQuantity)
      : resource.unitPrice;

  const item: InventoryItem = {
    resourceId: resource.id,
    quantity: newQuantity,
    averageUnitCost,
  };

  return {
    ok: true,
    warehouse: {
      ...warehouse,
      items: {
        ...warehouse.items,
        [resource.id]: item,
      },
    },
    balance: moneySub(balance, spent),
    spent,
  };
}

export function removeResource(
  warehouse: Warehouse,
  resourceId: string,
  quantity: number,
): {
  ok: boolean;
  warehouse: Warehouse;
  removed: number;
  reason?: string;
} {
  const item = warehouse.items[resourceId];

  if (!item || quantity <= 0 || item.quantity < quantity) {
    return {
      ok: false,
      warehouse,
      removed: 0,
      reason: 'Недостаточно товара на складе.',
    };
  }

  const remaining = item.quantity - quantity;
  const items = { ...warehouse.items };

  if (remaining <= 0.000001) {
    delete items[resourceId];
  } else {
    items[resourceId] = {
      ...item,
      quantity: remaining,
    };
  }

  return {
    ok: true,
    warehouse: {
      ...warehouse,
      items,
    },
    removed: quantity,
  };
}

export function consumeMonthlyResources(
  warehouse: Warehouse,
  requirements: ResourceRequirement[],
  businessLevel: number,
): ResourceConsumptionResult {
  let nextWarehouse = warehouse;
  let consumedValue: Money = ZERO_MONEY;
  const missingResources: ResourceConsumptionResult['missingResources'] = [];

  for (const requirement of requirements) {
    const required = requirement.unitsPerLevel * businessLevel;
    const item = nextWarehouse.items[requirement.resourceId];
    const available = item?.quantity ?? 0;
    const consumed = Math.min(required, available);

    if (consumed < required) {
      missingResources.push({
        resourceId: requirement.resourceId,
        required,
        available,
      });
    }

    if (consumed <= 0 || !item) {
      continue;
    }

    consumedValue = moneyAdd(
      consumedValue,
      moneyMul(item.averageUnitCost, consumed),
    );

    const result = removeResource(
      nextWarehouse,
      requirement.resourceId,
      consumed,
    );

    if (result.ok) {
      nextWarehouse = result.warehouse;
    }
  }

  return {
    warehouse: nextWarehouse,
    supplied: missingResources.length === 0,
    missingResources,
    consumedValue,
  };
}
export interface WarehouseWithdrawResult {
  ok: boolean;
  withdrawn: number;
  unitCost: number;
  totalCost: number;
  reason?: string;
}

/**
 * Взять ресурс со склада по учётной (средневзвешенной) стоимости.
 * Деньги не списывает — вызывающий код должен сам решить, нужно ли это.
 * Используется для внутреннего перемещения «склад игрока → бизнес/предприятие».
 */
export interface WarehouseWithdrawResult {
  ok: boolean;
  warehouse: Warehouse;
  withdrawn: number;
  unitCost: number;
  totalCost: number;
  reason?: string;
}

/**
 * Взять ресурс со склада по учётной (средневзвешенной) стоимости.
 * Возвращает обновлённый склад. Деньги не двигает.
 */
export function withdrawFromWarehouse(
  warehouse: Warehouse,
  resourceId: string,
  requestedQty: number,
): WarehouseWithdrawResult {
  const item = warehouse.items[resourceId];
  if (!item || item.quantity <= 0 || requestedQty <= 0) {
    return { ok: false, warehouse, withdrawn: 0, unitCost: 0, totalCost: 0, reason: 'Нет на складе' };
  }
  const qty = Math.min(requestedQty, item.quantity);
  const unitCost = Number(item.averageUnitCost ?? 0);
  const removal = removeResource(warehouse, resourceId, qty);
  if (!removal.ok) {
    return { ok: false, warehouse, withdrawn: 0, unitCost: 0, totalCost: 0, reason: removal.reason };
  }
  return {
    ok: true,
    warehouse: removal.warehouse,
    withdrawn: qty,
    unitCost,
    totalCost: qty * unitCost,
  };
}