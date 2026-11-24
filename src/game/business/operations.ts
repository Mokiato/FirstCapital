import type {
  BusinessRuntime,
  Money,
} from '../domain/types';
import {
  moneyAdd,
  moneyCmp,
  moneyMax,
  moneyMul,
  moneySub,
  ZERO_MONEY,
} from '../domain/money';

export interface BusinessMonthContext {
  supplied: boolean;
  consumedResourceCost: Money;
  /** Себестоимость потреблённого сырья (для расчёта EBIT). */
  resourceCost?: Money;
  /** B2C: выручка = распределённая квота спроса (GDD §6.3). Замещает baseRevenue. */
  allocatedRevenue?: Money;

  eventMultiplier?: number;

  /**
   * Разрешить вручную перезапустить остановленный бизнес.
   */
  manualResume?: boolean;
}

export interface BusinessSettlement {
  business: BusinessRuntime;

  revenue: Money;
  resourceCost: Money;
  operatingCosts: Money;
  tax: Money;
  profit: Money;
  stoppedThisMonth: boolean;
  shouldDismissStaff: boolean;
  reason?: string;
}

export function settleBusinessMonth(
  business: BusinessRuntime,
  context: BusinessMonthContext,
): BusinessSettlement {
  if (business.status === 'closed') {
    return {
      business,
      revenue: ZERO_MONEY,
      resourceCost: ZERO_MONEY,
      operatingCosts: ZERO_MONEY,
      tax: ZERO_MONEY,
      profit: ZERO_MONEY,
      stoppedThisMonth: false,
      shouldDismissStaff: false,
    };
  }

  const hadSupplyShortage = !context.supplied;
  const nextMonthsWithoutSupply = hadSupplyShortage
    ? business.monthsWithoutSupply + 1
    : 0;

  const forcedStopForSupply =
    hadSupplyShortage && business.monthsWithoutSupply >= 1;

  const canResume =
    context.manualResume === true &&
    moneyCmp(business.cashBalance, ZERO_MONEY) >= 0;

  const canOperate =
    !forcedStopForSupply &&
    (business.status === 'operating' || canResume);

  const supplyMultiplier = hadSupplyShortage ? 0.5 : 1;
  const eventMultiplier = context.eventMultiplier ?? 1;

  let revenue: Money = ZERO_MONEY;

  if (canOperate) {
    if (context.allocatedRevenue !== undefined) {
      // B2C: квота уже содержит уровень, штат, производительность и рыночные
      // множители (события/конкуренты/офисы). Дефицит снабжения режет её вдвое.
      revenue = moneyMul(context.allocatedRevenue, supplyMultiplier * eventMultiplier);
    } else {
      // Legacy (B2B-производства в BUSINESSES) — до пакета 4.2.
      const baseRevenue = moneyMul(
        business.baseMonthlyRevenue,
        business.level,
      );
      const combinedMultiplier =
        business.demandMultiplier *
        business.productivityMultiplier *
        supplyMultiplier *
        eventMultiplier;

      revenue = moneyMul(baseRevenue, combinedMultiplier);
    }
  }

  const resourceCost = context.resourceCost ?? context.consumedResourceCost;

  const operatingCosts = [
    business.monthlyPayroll,
    business.monthlyRent,
    business.monthlyUtilities,
    business.monthlyMaintenance,
  ].reduce((total, cost) => moneyAdd(total, cost), ZERO_MONEY);

  // GDD §9.3: EBIT = Выручка − Себестоимость − ФОТ − Аренда/ЖКХ − Обслуживание
  // Налог 15% берётся только с положительного EBIT.
  const profitBeforeTax = moneySub(
    moneySub(revenue, resourceCost),
    operatingCosts,
  );

  const taxableProfit = moneyMax(profitBeforeTax, ZERO_MONEY);
  const tax = moneyMul(taxableProfit, business.taxRate);
  const profit = moneySub(profitBeforeTax, tax);

  /*
   * Закупка товара списывается в момент закупки.
   * Поэтому cashBalance здесь меняется на выручку и денежные
   * расходы предприятия, но не списывает второй раз себестоимость.
   */
  const nextCashBalance = moneySub(
    moneyAdd(business.cashBalance, revenue),
    moneyAdd(operatingCosts, tax),
  );

  const insolvent = moneyCmp(nextCashBalance, ZERO_MONEY) < 0;
  const stoppedThisMonth =
    forcedStopForSupply || insolvent || !canOperate;

  const nextStatus = stoppedThisMonth ? 'stopped' : 'operating';
  const nextMonthsStopped = stoppedThisMonth
    ? business.monthsStopped + 1
    : 0;

  const shouldDismissStaff = nextMonthsStopped >= 3;
  const nextBusiness: BusinessRuntime = {
    ...business,
    status: nextStatus,
    cashBalance: nextCashBalance,
    monthsWithoutSupply: nextMonthsWithoutSupply,
    monthsStopped: nextMonthsStopped,
  };

  return {
    business: nextBusiness,
    revenue,
    resourceCost,
    operatingCosts,
    tax,
    profit,
    stoppedThisMonth,
    shouldDismissStaff,
    reason: forcedStopForSupply
      ? 'Нет необходимых товаров второй месяц подряд.'
      : insolvent
        ? 'Бизнесу не хватает средств на обязательные расходы.'
        : undefined,
  };
}