// src/game/simulation/clockStore.ts
// Отдельный стор для игрового времени. Не смешивается с gameStore:
// время — это мета-состояние, а не игровые данные.

import { create } from 'zustand';
import type { ClockState } from '../domain/types';
import {
  advanceClock,
  createInitialClock,
  setClockPaused,
  setClockSpeed,
} from './clock';

interface ClockStore {
  clock: ClockState;

  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setSpeed: (speed: number) => void;
  /** Продвинуть время на deltaMs, вернуть массив завершённых месяцев. */
  advance: (deltaMs: number) => number[];
  /** Заменить clock целиком (для загрузки сохранения). */
  load: (clock: ClockState) => void;
  reset: () => void;
}

export const useClockStore = create<ClockStore>((set, get) => ({
  clock: createInitialClock(),

  setPaused: (paused) =>
    set({ clock: setClockPaused(get().clock, paused) }),

  togglePause: () =>
    set({ clock: setClockPaused(get().clock, !get().clock.paused) }),

  setSpeed: (speed) =>
    set({ clock: setClockSpeed(get().clock, speed) }),

  advance: (deltaMs) => {
    const { clock, completedMonths } = advanceClock(get().clock, deltaMs);
    if (completedMonths.length > 0 || clock.monthProgressMs !== get().clock.monthProgressMs) {
      set({ clock });
    }
    return completedMonths;
  },

  load: (clock) => set({ clock }),

  reset: () => set({ clock: createInitialClock() }),
}));