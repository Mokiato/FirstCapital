import type {
  Money,
  StockPosition,
} from '../domain/types';
import {
  moneyAdd,
  moneyCmp,
  moneyMax,
  moneyMul,
  moneySub,
  ZERO_MONEY,
} from '../domain/money';

export interface TradePolicy {
  commissionRate: number;
  capitalGainsTaxRate: number;
}

export interface TradeResult {
  cash: Money;
  position: StockPosition | null;

  grossAmount: Money;
  commission: Money;
  tax: Money;
  realizedPnl: Money;
}

function normalizeShares(shares: number): number {
  return Math.round(shares * 1_000_000) / 1_000_000;
}

export function buyShares(input: {
  cash: Money;
  companyId: string;
  currentPrice: Money;
  shares: number;
  existingPosition?: StockPosition;
  policy: TradePolicy;
}):
  | { ok: true; result: TradeResult }
  | { ok: false; reason: string } {
  const shares = normalizeShares(input.shares);

  if (!Number.isFinite(shares) || shares <= 0) {
    return {
      ok: false,
      reason: 'Количество акций должно быть больше нуля.',
    };
  }

  if (moneyCmp(input.currentPrice, ZERO_MONEY) <= 0) {
    return {
      ok: false,
      reason: 'Некорректная цена акции.',
    };
  }

  const grossAmount = moneyMul(input.currentPrice, shares);
  const commission = moneyMul(
    grossAmount,
    input.policy.commissionRate,
  );
  const totalCost = moneyAdd(grossAmount, commission);

  if (moneyCmp(input.cash, totalCost) < 0) {
    return {
      ok: false,
      reason: 'Недостаточно денег для покупки.',
    };
  }

  const oldPosition = input.existingPosition;
  const oldShares = oldPosition?.shares ?? 0;
  const nextShares = oldShares + shares;

  const oldCost = oldPosition
    ? moneyMul(oldPosition.averageBuyPrice, oldShares)
    : ZERO_MONEY;

  const totalBasis = moneyAdd(
    oldCost,
    moneyAdd(grossAmount, commission),
  );

  const averageBuyPrice =
    nextShares > 0
      ? moneyMul(totalBasis, 1 / nextShares)
      : input.currentPrice;

  const position: StockPosition = {
    companyId: input.companyId,
    shares: nextShares,
    averageBuyPrice,
    realizedPnl: oldPosition?.realizedPnl ?? ZERO_MONEY,
  };

  return {
    ok: true,
    result: {
      cash: moneySub(input.cash, totalCost),
      position,
      grossAmount,
      commission,
      tax: ZERO_MONEY,
      realizedPnl: ZERO_MONEY,
    },
  };
}

export function sellShares(input: {
  cash: Money;
  companyId: string;
  currentPrice: Money;
  shares: number;
  position: StockPosition;
  policy: TradePolicy;
}):
  | { ok: true; result: TradeResult }
  | { ok: false; reason: string } {
  const shares = normalizeShares(input.shares);

  if (!Number.isFinite(shares) || shares <= 0) {
    return {
      ok: false,
      reason: 'Количество акций должно быть больше нуля.',
    };
  }

  if (shares > input.position.shares) {
    return {
      ok: false,
      reason: 'В портфеле недостаточно таких акций.',
    };
  }

  const grossAmount = moneyMul(input.currentPrice, shares);
  const costBasis = moneyMul(
    input.position.averageBuyPrice,
    shares,
  );

  const commission = moneyMul(
    grossAmount,
    input.policy.commissionRate,
  );

  const taxableProfit = moneyMax(
    moneySub(grossAmount, costBasis),
    ZERO_MONEY,
  );

  const tax = moneyMul(
    taxableProfit,
    input.policy.capitalGainsTaxRate,
  );

  const netProceeds = moneySub(
    moneySub(grossAmount, commission),
    tax,
  );

  const realizedPnl = moneySub(
    moneySub(grossAmount, costBasis),
    moneyAdd(commission, tax),
  );

  const remainingShares = normalizeShares(
    input.position.shares - shares,
  );

  const nextPosition =
    remainingShares <= 0
      ? null
      : {
          ...input.position,
          shares: remainingShares,
          realizedPnl: moneyAdd(
            input.position.realizedPnl,
            realizedPnl,
          ),
        };

  return {
    ok: true,
    result: {
      cash: moneyAdd(input.cash, netProceeds),
      position: nextPosition,
      grossAmount,
      commission,
      tax,
      realizedPnl,
    },
  };
}