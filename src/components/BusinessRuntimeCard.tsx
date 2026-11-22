// src/components/BusinessRuntimeCard.tsx
import { useState } from 'react';
import type { BusinessRuntime } from '../game/domain/types';
import type { BusinessDef } from '../data/businesses';
import { formatMoney } from '../game/domain/money';
import { useGameStore } from '../game/store';
import { BALANCE } from '../game/config/balance';

const KIND_EMOJI: Record<string, string> = {
  service: '🍽️',
  retail: '🛒',
  production: '🏭',
  logistics: '🚚',
  office: '💼',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  operating: { label: 'Работает', cls: 'bg-emerald-900/60 text-emerald-400' },
  stopped: { label: 'Остановлен', cls: 'bg-rose-900/60 text-rose-400' },
  closed: { label: 'Закрыт', cls: 'bg-neutral-800 text-neutral-500' },
};

export function BusinessRuntimeCard({
  runtime,
  def,
  onManage,
}: {
  runtime: BusinessRuntime;
  def: BusinessDef;
  onManage: () => void;
}) {
  const state = useGameStore();
  const emoji = KIND_EMOJI[def.kind] ?? '🏢';
  const statusInfo = STATUS_LABEL[runtime.status] ?? STATUS_LABEL.operating;
  const [imgError, setImgError] = useState(false);

  const upgradeCost = Math.round(
    (def.startingEquipment ?? def.fixedCosts * 2) *
      BALANCE.upgradeCostRatio *
      runtime.level,
  );  const canUpgrade = state.balance >= upgradeCost;

  return (
    <div className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-emerald-900/30">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-3xl overflow-hidden">
          {!imgError ? (
            <img
              src={`/assets/businesses/${def.id}.png`}
              alt={def.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{runtime.name}</div>
          <div className="text-xs text-neutral-400">
            Уровень {runtime.level} · {def.kind}
          </div>
          <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusInfo.cls}`}>
            {statusInfo.label}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-neutral-800/60 p-2">
          <div className="text-neutral-500">Баланс бизнеса</div>
          <div className="font-bold text-white">
            {formatMoney(runtime.cashBalance)}
          </div>
        </div>
        <div className="rounded-lg bg-neutral-800/60 p-2">
          <div className="text-neutral-500">Выручка базовая</div>
          <div className="font-bold text-emerald-400">
            {formatMoney(runtime.baseMonthlyRevenue)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onManage}
          className="flex-1 rounded-lg bg-neutral-800 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700 active:scale-95"
        >
          Управлять
        </button>
        <button
          disabled={!canUpgrade}
          onClick={() => state.upgradeBusinessRuntime(runtime.id)}
          className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-700 py-2 text-sm font-bold text-white transition hover:from-amber-400 hover:to-amber-600 active:scale-95 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500"
        >
          Улучшить · {formatMoney(upgradeCost)}
        </button>
      </div>
    </div>
  );
}