import type { ContractRuntime, Money, Warehouse } from '../domain/types';
import { moneyAdd, moneyCmp, ZERO_MONEY } from '../domain/money';
import { removeResource } from '../logistics/inventory';

export function acceptContract(contract: ContractRuntime, currentMonth: number): ContractRuntime {
  if (contract.status !== 'available') return contract;
  if (currentMonth > contract.deadlineMonth) return { ...contract, status: 'failed' };
  return { ...contract, status: 'active' };
}

export function deliverContractGoods(input: {
  contract: ContractRuntime; warehouse: Warehouse; requestedQuantity: number; currentMonth: number; balance: Money;
}): { ok: true; contract: ContractRuntime; warehouse: Warehouse; balance: Money; deliveredNow: number; completed: boolean } | { ok: false; reason: string; contract: ContractRuntime; warehouse: Warehouse; balance: Money } {
  const { contract } = input;
  if (contract.status !== 'active') return { ok: false, reason: 'Контракт не активен.', contract, warehouse: input.warehouse, balance: input.balance };
  if (input.currentMonth > contract.deadlineMonth) return { ok: false, reason: 'Срок контракта истёк.', contract: { ...contract, status: 'failed' }, warehouse: input.warehouse, balance: input.balance };
  const remaining = contract.requiredQuantity - contract.deliveredQuantity;
  const quantity = Math.min(remaining, input.requestedQuantity);
  if (quantity <= 0) return { ok: false, reason: 'Нечего доставлять.', contract, warehouse: input.warehouse, balance: input.balance };
  const removal = removeResource(input.warehouse, contract.resourceId, quantity);
  if (!removal.ok) return { ok: false, reason: removal.reason ?? 'Не удалось списать товар.', contract, warehouse: input.warehouse, balance: input.balance };
  const deliveredQuantity = contract.deliveredQuantity + quantity;
  const completed = deliveredQuantity >= contract.requiredQuantity;
  const nextContract: ContractRuntime = { ...contract, deliveredQuantity, status: completed ? 'completed' : 'active' };
  const nextBalance = completed ? moneyAdd(input.balance, contract.reward) : input.balance;
  return { ok: true, contract: nextContract, warehouse: removal.warehouse, balance: nextBalance, deliveredNow: quantity, completed };
}

export function expireContracts(contracts: ContractRuntime[], currentMonth: number): ContractRuntime[] {
  return contracts.map((c) => (c.status === 'active' && currentMonth > c.deadlineMonth) ? { ...c, status: 'failed' } : c);
}

export function getContractProgress(contract: ContractRuntime): number {
  if (contract.requiredQuantity <= 0) return 0;
  return Math.max(0, Math.min(1, contract.deliveredQuantity / contract.requiredQuantity));
}

export function hasContractDeadlinePassed(contract: ContractRuntime, currentMonth: number): boolean {
  return contract.status === 'active' && currentMonth > contract.deadlineMonth && moneyCmp(contract.reward, ZERO_MONEY) >= 0;
}
