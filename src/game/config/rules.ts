// src/game/config/rules.ts
// Зафиксированные правила игры. Не изменяются в процессе игры.

export const RULES = {
  /** Оффлайн-доход отсутствует */
  offlineIncome: false,
  /** Время останавливается при закрытии игры */
  pauseOnClose: true,

  /** Скорости времени */
  speeds: [0, 1, 2, 4] as const,
  /** 1 месяц = 10 реальных минут при x1 */
  monthRealMsAtX1: 10 * 60 * 1000,
  /** Рыночный тик = 1 игровая минута = 0.1 месяца */
  marketTicksPerMonth: 10,

  /** Работа раз в игровой месяц */
  workCooldownMonths: 1,
  /** Энергия тратится только на работу по профессии */
  energyOnlyForWork: true,

  /** Крупные события */
  eventsAveragePerMonth: 1,
  /** Хранение новостей */
  newsRetentionMonths: 12,

  /** Бустеры удалены из игры */
  boostersEnabled: false,
  /** Покупки только за внутриигровую валюту */
  realMoneyPurchases: false,

  /** Город — отдельный режим, не влияет на экономику */
  cityIsSeparateMode: true,

  /** Максимум одновременно активных конкурентов */
  maxActiveCompetitors: 20,

  /** Сохранения несовместимы со старыми версиями */
  legacySaveCompatibility: false,
} as const;