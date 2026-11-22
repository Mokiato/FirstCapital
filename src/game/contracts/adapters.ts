// src/game/contracts/adapters.ts
// Генератор контрактов из data/contracts.ts (CONTRACT_TEMPLATES).

import type { ContractRuntime } from '../domain/types';
import { computeContractReward, type ContractSize } from '../../data/contracts';
import { RESOURCES } from '../../data/resources';
import { STOCKS } from '../../data/stocks';

const AVAILABLE_RESOURCES = RESOURCES.filter((r) => r.group !== 'equipment');

export function generateContracts(
  currentMonth: number,
  count = 2,
): ContractRuntime[] {
  const out: ContractRuntime[] = [];
  if (AVAILABLE_RESOURCES.length === 0) return out;

  for (let i = 0; i < count; i++) {
    const resource =
      AVAILABLE_RESOURCES[Math.floor(Math.random() * AVAILABLE_RESOURCES.length)];
    const size: ContractSize = Math.random() < 0.7 ? 'small' : 'large';
    const durationRange = size === 'small' ? [3, 3] : [6, 12];
    const duration =
      durationRange[0] +
      Math.floor(Math.random() * (durationRange[1] - durationRange[0] + 1));

    const quantity =
      size === 'small'
        ? 10 + Math.floor(Math.random() * 40)
        : 50 + Math.floor(Math.random() * 200);

    // Базовая месячная выручка для расчёта награды — 100k
    const { reward } = computeContractReward(size, 100_000, duration);

    const client =
      STOCKS.length > 0
        ? STOCKS[Math.floor(Math.random() * STOCKS.length)]
        : null;

    out.push({
      id: `contract_${currentMonth}_${Date.now()}_${i}_${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      title: client ? `${client.name}: ${resource.name}` : `Контракт: ${resource.name}`,
      description: `Доставить ${quantity} ${resource.unit} «${resource.name}» за ${duration} мес.`,
      clientCompanyId: client?.id,
      resourceId: resource.id,
      requiredQuantity: quantity,
      deliveredQuantity: 0,
      reward: String(Math.round(reward)),
      createdAtMonth: currentMonth,
      deadlineMonth: currentMonth + duration,
      status: 'available',
    });
  }

  return out;
}