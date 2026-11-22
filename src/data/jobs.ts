// src/data/jobs.ts
// СТАРЫЙ файл профессий — используется старым UI (WorkCard.tsx).
// Новые 16 профессий — в careers.ts. Файлы живут параллельно,
// пока UI карьеры не будет переписан (Блок 7+).

import type { JobDef } from '../types';

const LEVELS = [1, 5, 10, 20, 30, 40, 50, 65, 80];

function makeTitles(names: readonly string[]): any[] {
  return names.map((name, i) => ({
    name,
    requiredLevel: LEVELS[i] ?? i * 10 + 1,
  }));
}

export const JOBS: JobDef[] = [
  {
    id: 'waiter', name: 'Официант', icon: '🍽️', category: 'service',
    baseIncome: 1, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Стажёр', 'Помощник официанта', 'Официант', 'Старший официант', 'Метрдотель', 'Управляющий залом', 'Менеджер ресторана', 'Директор сети', 'Владелец ресторана']),
  },
  {
    id: 'courier', name: 'Курьер', icon: '🚚', category: 'logistics',
    baseIncome: 50, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Курьер-стажёр', 'Курьер', 'Старший курьер', 'Координатор доставки', 'Логист', 'Менеджер логистики', 'Руководитель службы доставки', 'Директор логистики', 'Владелец службы доставки']),
  },
  {
    id: 'loader', name: 'Грузчик', icon: '📦', category: 'logistics',
    baseIncome: 100, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Разнорабочий', 'Грузчик', 'Старший грузчик', 'Бригадир', 'Кладовщик', 'Заведующий складом', 'Менеджер склада', 'Директор логистического хаба', 'Владелец логистического парка']),
  },
  {
    id: 'cashier', name: 'Кассир', icon: '💰', category: 'retail',
    baseIncome: 200, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Стажёр', 'Кассир', 'Старший кассир', 'Администратор зала', 'Менеджер смены', 'Управляющий магазином', 'Региональный менеджер', 'Директор сети', 'Владелец ритейл-холдинга']),
  },
  {
    id: 'sales', name: 'Менеджер по продажам', icon: '💼', category: 'business',
    baseIncome: 500, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Sales Intern', 'Младший менеджер', 'Менеджер по продажам', 'Старший менеджер', 'Аккаунт-менеджер', 'Руководитель отдела продаж', 'Директор по продажам', 'Коммерческий директор', 'Владелец корпорации']),
  },
  {
    id: 'programmer', name: 'Программист', icon: '💻', category: 'it',
    baseIncome: 2000, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Intern', 'Junior Developer', 'Middle Developer', 'Senior Developer', 'Тимлид', 'Архитектор ПО', 'CTO', 'Технический директор корпорации', 'Владелец IT-корпорации']),
  },
  {
    id: 'marketer', name: 'Маркетолог', icon: '📊', category: 'marketing',
    baseIncome: 5000, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Ассистент', 'Младший маркетолог', 'Маркетолог', 'Старший маркетолог', 'Маркетинг-менеджер', 'Head of Marketing', 'Директор по маркетингу', 'CMO', 'Владелец империи рекламы']),
  },
  {
    id: 'architect', name: 'Архитектор', icon: '🏛️', category: 'construction',
    baseIncome: 10000, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Чертежник', 'Помощник архитектора', 'Архитектор', 'Ведущий архитектор', 'Главный архитектор проекта', 'Директор проектного бюро', 'Директор строительной компании', 'Владелец строительного холдинга', 'Владелец строительной империи']),
  },
  {
    id: 'analyst', name: 'Аналитик', icon: '📈', category: 'finance',
    baseIncome: 50000, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Ассистент', 'Младший аналитик', 'Аналитик', 'Старший аналитик', 'Ведущий аналитик', 'Портфельный менеджер', 'Директор по инвестициям', 'Управляющий партнёр', 'Владелец инвестбанка']),
  },
  {
    id: 'executive', name: 'Топ-менеджер', icon: '👔', category: 'business',
    baseIncome: 200000, requirement: { type: 'companyLevel', value: 0 },
    titles: makeTitles(['Исполнительный директор', 'Вице-президент', 'Операционный директор', 'Финансовый директор', 'Генеральный директор', 'Председатель совета директоров', 'Президент корпорации', 'Глава холдинга', 'Император бизнеса']),
  },
];

export const getXpRequired = (level: number): number =>
  Math.floor(100 * Math.pow(level, 1.5));

export const getCurrentTitle = (level: number, titles: any[]): any => {
  let result = titles[0];
  for (const t of titles) {
    if (level >= t.requiredLevel) result = t;
    else break;
  }
  return result;
};

export const getTitleForLevel = getCurrentTitle;

export const getJobMultiplier = (level: number): number => {
  if (level >= 100) return 10;
  if (level >= 90) return 7.5;
  if (level >= 70) return 5;
  if (level >= 50) return 3.5;
  if (level >= 35) return 2.5;
  if (level >= 20) return 2;
  if (level >= 10) return 1.5;
  if (level >= 5) return 1.2;
  return 1;
};
