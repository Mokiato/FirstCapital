// src/game/simulation/clock.ts
// GDD v2.0 §3.1: пошаговая модель. 1 ход = 1 календарный месяц.
// Реалтайм (RAF-цикл, скорости, пауза, прогресс месяца) удалён полностью.

import type { ClockState } from '../domain/types';

export function createInitialClock(): ClockState {
  return { monthIndex: 0 };
}

/** Единственный способ продвинуть время: завершить текущий месяц. */
export function advanceMonth(clock: ClockState): ClockState {
  return { monthIndex: clock.monthIndex + 1 };
}

export function getMonthLabel(monthIndex: number): string {
  const currentMonth = (monthIndex % 12) + 1;
  const currentYear = Math.floor(monthIndex / 12) + 1;
  return `Год ${currentYear}, месяц ${currentMonth}`;
}