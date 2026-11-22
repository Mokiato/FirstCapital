import type { Money } from '../domain/types';
import {
  moneyAdd,
  moneyCmp,
  moneySub,
  ZERO_MONEY,
} from '../domain/money';

export type LedgerDirection = 'income' | 'expense';

export interface LedgerEntry {
  id: string;
  monthIndex: number;
  accountId: string;

  direction: LedgerDirection;
  category: string;

  amount: Money;
  description: string;

  relatedEntityId?: string;
}

export interface WalletTransactionInput {
  balance: Money;
  amount: Money;
  direction: LedgerDirection;

  monthIndex: number;
  accountId: string;
  category: string;
  description: string;

  allowNegative?: boolean;
  relatedEntityId?: string;
}

export type WalletTransactionResult =
  | {
      ok: true;
      balance: Money;
      entry: LedgerEntry;
    }
  | {
      ok: false;
      balance: Money;
      reason: string;
    };

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `ledger-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function applyWalletTransaction(
  input: WalletTransactionInput,
): WalletTransactionResult {
  if (moneyCmp(input.amount, ZERO_MONEY) < 0) {
    return {
      ok: false,
      balance: input.balance,
      reason: 'Сумма операции не может быть отрицательной.',
    };
  }

  if (
    input.direction === 'expense' &&
    !input.allowNegative &&
    moneyCmp(input.balance, input.amount) < 0
  ) {
    return {
      ok: false,
      balance: input.balance,
      reason: 'Недостаточно средств.',
    };
  }

  const nextBalance =
    input.direction === 'income'
      ? moneyAdd(input.balance, input.amount)
      : moneySub(input.balance, input.amount);

  const entry: LedgerEntry = {
    id: createId(),
    monthIndex: input.monthIndex,
    accountId: input.accountId,
    direction: input.direction,
    category: input.category,
    amount: input.amount,
    description: input.description,
    relatedEntityId: input.relatedEntityId,
  };

  return {
    ok: true,
    balance: nextBalance,
    entry,
  };
}

export function sumLedgerCategory(
  entries: LedgerEntry[],
  category: string,
  direction?: LedgerDirection,
): Money {
  return entries
    .filter(
      (entry) =>
        entry.category === category &&
        (!direction || entry.direction === direction),
    )
    .reduce(
      (total, entry) => moneyAdd(total, entry.amount),
      ZERO_MONEY,
    );
}