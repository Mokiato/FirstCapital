// src/game/statistics/categories.ts
// Словари для отображения категорий журнала в UI.

export const CATEGORY_LABELS: Record<string, string> = {
  deal: 'Сделки',
  daily_bonus: 'Ежедневный бонус',
  quest: 'Квесты',
  achievement: 'Достижения',
  promo: 'Промокоды',
  game: 'Мини-игры',
  work: 'Работа по профессии',
  devtools: 'DevTools',
  case: 'Открытие кейсов',
  case_reward: 'Награды из кейсов',
  wheel: 'Колесо фортуны',
  stock_buy: 'Покупка акций',
  stock_sell: 'Продажа акций',
  property: 'Покупка недвижимости',
  transport: 'Покупка транспорта',
  collection: 'Коллекции',
  business_income: 'Доход бизнесов',
  business_purchase: 'Закупки бизнесов',
  salary: 'Зарплаты',
  tax: 'Налоги',
  rent: 'Аренда',
  utilities: 'Коммунальные',
  dividend: 'Дивиденды',
  coupon: 'Купоны',
  fund_income: 'Доход фондов',
  rental_income: 'Арендный доход',
  loan_disbursement: 'Получение кредита',
  loan_principal: 'Погашение кредита',
  loan_interest: 'Проценты по кредиту',
  contract_reward: 'Награды по контрактам',
  contract_penalty: 'Штрафы по контрактам',
  manual_transfer: 'Переводы',
  business_deposit: 'Пополнение кассы бизнеса',
  other: 'Прочее',
};

export const CATEGORY_ICONS: Record<string, string> = {
  deal: '🤝',
  daily_bonus: '🎁',
  quest: '📋',
  achievement: '🏆',
  promo: '🏷️',
  game: '🎮',
  work: '💼',
  devtools: '🛠️',
  case: '📦',
  case_reward: '✨',
  wheel: '🎡',
  stock_buy: '📉',
  stock_sell: '📈',
  property: '🏠',
  transport: '🚗',
  collection: '🖼️',
  business_income: '💰',
  business_purchase: '🛒',
  salary: '👥',
  tax: '🏛️',
  rent: '🏢',
  utilities: '💡',
  dividend: '💵',
  coupon: '📜',
  fund_income: '📊',
  rental_income: '🔑',
  loan_disbursement: '🏦',
  loan_principal: '💳',
  loan_interest: '📉',
  contract_reward: '📝',
  contract_penalty: '⚠️',
  manual_transfer: '↔️',
  business_deposit: '💰',
  other: '•',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '•';
}