import type {
  Money,
} from '../domain/types';
import {
  moneyAdd,
  moneyMul,
  moneySub,
  moneySum,
} from '../domain/money';

export interface CapitalInput {
  cash: Money;

  businessValues: Money[];
  fundValues: Money[];
  bondValues: Money[];
  metalValues: Money[];

  stockPositions: Array<{
    shares: number;
    currentPrice: Money;
  }>;

  realEstateValues: Money[];
  transportValues: Money[];

  liabilities: Money[];
}

export interface CapitalBreakdown {
  cash: Money;
  businesses: Money;
  funds: Money;
  bonds: Money;
  metals: Money;
  stocks: Money;
  realEstate: Money;
  transport: Money;
  liabilities: Money;
  netWorth: Money;
}

export function calculateCapital(
  input: CapitalInput,
): CapitalBreakdown {
  const businesses = moneySum(input.businessValues);
  const funds = moneySum(input.fundValues);
  const bonds = moneySum(input.bondValues);
  const metals = moneySum(input.metalValues);
  const realEstate = moneySum(input.realEstateValues);
  const transport = moneySum(input.transportValues);

  const stocks = input.stockPositions.reduce(
    (total, position) =>
      moneyAdd(
        total,
        moneyMul(position.currentPrice, position.shares),
      ),
    '0',
  );

  const liabilities = moneySum(input.liabilities);

  const assets = [
    input.cash,
    businesses,
    funds,
    bonds,
    metals,
    stocks,
    realEstate,
    transport,
  ].reduce((total, amount) => moneyAdd(total, amount), '0');

  return {
    cash: input.cash,
    businesses,
    funds,
    bonds,
    metals,
    stocks,
    realEstate,
    transport,
    liabilities,
    netWorth: moneySub(assets, liabilities),
  };
}
