// src/game/simulation/clockStore.ts
// Пошаговое игровое время (GDD v2.0 §3.1). Время двигается только ходом игрока.

import { create } from 'zustand';
import type { ClockState } from '../domain/types';
import { advanceMonth, createInitialClock } from './clock';

interface ClockStore {
  clock: ClockState;

  /** Завершить текущий месяц. Возвращает индекс закрытого месяца. */
  nextMonth: () => number;
  /** Заменить clock (загрузка сохранения). */
  load: (clock: ClockState) => void;
  reset: () => void;
}

export const useClockStore = create<ClockStore>((set, get) => ({
  clock: createInitialClock(),

  nextMonth: () => {
    const next = advanceMonth(get().clock);
    set({ clock: next });
    return next.monthIndex;
  },

  load: (clock) => set({ clock: { monthIndex: clock.monthIndex } }),

  reset: () => set({ clock: createInitialClock() }),
}));