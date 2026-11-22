import type { ClockState } from '../domain/types';

export const GAME_MONTH_DURATION_MS = 10 * 60 * 1000;

export const DEFAULT_SPEEDS = [0, 1, 3, 6] as const;

export interface ClockAdvanceResult {
  clock: ClockState;
  completedMonths: number[];
}

export function createInitialClock(): ClockState {
  return {
    monthIndex: 0,
    monthProgressMs: 0,
    speed: 1,
    paused: false,
  };
}

export function advanceClock(
  clock: ClockState,
  realDeltaMs: number,
): ClockAdvanceResult {
  if (clock.paused || clock.speed <= 0 || realDeltaMs <= 0) {
    return {
      clock,
      completedMonths: [],
    };
  }

  const safeDelta = Number.isFinite(realDeltaMs)
    ? Math.max(0, realDeltaMs)
    : 0;

  const gameDelta = safeDelta * clock.speed;
  const totalProgress = clock.monthProgressMs + gameDelta;

  const monthsCompleted = Math.floor(
    totalProgress / GAME_MONTH_DURATION_MS,
  );

  const monthProgressMs =
    totalProgress % GAME_MONTH_DURATION_MS;

  const completedMonths = Array.from(
    { length: monthsCompleted },
    (_, index) => clock.monthIndex + index + 1,
  );

  return {
    clock: {
      ...clock,
      monthIndex: clock.monthIndex + monthsCompleted,
      monthProgressMs,
    },
    completedMonths,
  };
}

export function setClockPaused(
  clock: ClockState,
  paused: boolean,
): ClockState {
  return {
    ...clock,
    paused,
  };
}

export function setClockSpeed(
  clock: ClockState,
  speed: number,
): ClockState {
  // GDD: только 0 (пауза), 1, 3, 6. Остальные значения игнорируем,
  // чтобы кнопки в UI всегда соответствовали реальной скорости.
  const allowed = [0, 1, 3, 6];
  return {
    ...clock,
    speed: allowed.includes(speed) ? speed : clock.speed,
  };
}

export function getMonthLabel(monthIndex: number): string {
  const currentMonth = monthIndex % 12 + 1;
  const currentYear = Math.floor(monthIndex / 12) + 1;

  return `Год ${currentYear}, месяц ${currentMonth}`;
}

export function getMonthProgress(clock: ClockState): number {
  return Math.max(
    0,
    Math.min(
      1,
      clock.monthProgressMs / GAME_MONTH_DURATION_MS,
    ),
  );
}