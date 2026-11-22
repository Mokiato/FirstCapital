import type { HolidayDef } from '../types';

export const HOLIDAYS: HolidayDef[] = [
  { id: 'new_year', name: 'Новый год', emoji: '🎄',
    description: 'Время подарков и праздничных бонусов! Весь доход увеличен.',
    multiplier: 1.2, start: { month: 12, day: 14 }, end: { month: 1, day: 10 } },
  { id: 'march_8', name: '8 Марта', emoji: '💐',
    description: 'Международный женский день — специальные бонусы!',
    multiplier: 1.15, start: { month: 3, day: 1 }, end: { month: 3, day: 14 } },
  { id: 'victory_day', name: '9 Мая', emoji: '🎖️',
    description: 'День Победы — праздничные бонусы для всех!',
    multiplier: 1.2, start: { month: 5, day: 3 }, end: { month: 5, day: 16 } },
  { id: 'summer_start', name: '1 День лета', emoji: '☀️',
    description: 'Лето пришло — бизнес расцветает!',
    multiplier: 1.15, start: { month: 5, day: 24 }, end: { month: 6, day: 6 } },
  { id: 'halloween', name: 'Хэллоуин', emoji: '🎃',
    description: 'Страшно выгодный период — не пропустите!',
    multiplier: 1.25, start: { month: 10, day: 26 }, end: { month: 11, day: 6 } },
];

export function getCurrentHoliday(date: Date = new Date()): HolidayDef | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  for (const h of HOLIDAYS) {
    const { start, end } = h;
    if (start.month > end.month) {
      const afterStart = month > start.month || (month === start.month && day >= start.day);
      const beforeEnd = month < end.month || (month === end.month && day <= end.day);
      if (afterStart || beforeEnd) return h;
    } else {
      const afterStart = month > start.month || (month === start.month && day >= start.day);
      const beforeEnd = month < end.month || (month === end.month && day <= end.day);
      if (afterStart && beforeEnd) return h;
    }
  }
  return null;
}

export function getHolidayById(id: string | null): HolidayDef | null {
  if (!id) return null;
  return HOLIDAYS.find((h) => h.id === id) ?? null;
}