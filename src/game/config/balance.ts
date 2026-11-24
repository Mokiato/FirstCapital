// src/game/config/balance.ts
// Базовые множители и ограничения экономики.

export const BALANCE = {
  /** Стартовый баланс игрока */
  startingBalance: 100_000,

  /** Множители дохода бизнеса по уровням (уровень → множитель) */
  businessLevelRevenueMult: 1.15,    // +15% за уровень
  businessLevelStockMult: 1.10,      // +10% к расходу ресурсов за уровень
  businessLevelUtilitiesMult: 1.05,  // +5% к ЖКХ за уровень

  /** Стоимость улучшения бизнеса: startingInvestment × ratio × level */
  upgradeCostRatio: 0.5,

  /** Рекомендуемый оборотный капитал (месяцев фикс. расходов) */
  recommendedOperatingCapitalMonths: 1,

  /** Оценка бизнеса для капитала: месячная прибыль × множитель */
  businessAppraisalMultiplier: 12,

  /** Если прибыль отрицательная — оценка = стартовые вложения × этот множитель */
  businessAppraisalNegativeMult: 0.5,

  /** Рост стоимости транспорта в месяц (0.5%) */
  transportMonthlyGrowth: 0.005,

  /** Рост стоимости недвижимости в месяц (0.3%) */
  realEstateMonthlyGrowth: 0.003,

  /** Доля fixedCosts, которая приходится на аренду */
  rentShareOfFixed: 0.70,
  /** Доля fixedCosts, которая приходится на ЖКХ */
  utilitiesShareOfFixed: 0.30,

  /** Первый месяц дефицита: revenue × этот множитель */
  deficitRevenueMult: 0.5,
  /** Через сколько месяцев простоя увольняются сотрудники */
  fireStaffAfterIdleMonths: 3,
  /** Штраф за пропуск 1 ручной операции */
  manualOpPenalty: 0.20,

  /** Ёмкость B2C-рынка на тип бизнеса: pool = baseRevenue × mult (GDD §6.3).
   *  mult = 2.0: соло-бизнес выбирает таблицу целиком, 2-й такой же — тоже,
   *  3-й и далее — пропорциональное насыщение. */
  b2cMarketMult: 2.0,

  /** Потолки */
  maxWarehouseCapacity: 1_000_000,
  maxBusinessLevel: 20,
} as const;