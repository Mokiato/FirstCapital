import { useState } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '../game/store';
import { CITY_BUILDINGS, CITY_CATEGORY_LABELS, RESEARCH_TREE } from '../data/cityBuildings';
import { getCityIncomePerSec, getCityStats } from '../game/selectors';
import { formatMoney, formatNumber } from '../utils/format';

type SubTab = 'dashboard' | 'build' | 'finance' | 'research';

export default function CityScreen() {
  const state = useGameStore();
  const [sub, setSub] = useState<SubTab>('dashboard');
  const stats = getCityStats(state);
  const incomePerSec = getCityIncomePerSec(state);

  // Если разрешения нет — показываем экран покупки
  if (!state.city.constructionPermit) {
    return (
      <div className="p-3 pb-6">
        <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-emerald-950 p-6 ring-1 ring-emerald-700/40">
          <div className="mb-6 text-center">
            <div className="text-7xl mb-3">🏗️</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Построить свой город
            </h2>
            <p className="text-sm text-neutral-400 leading-6 max-w-md mx-auto">
              Купите разрешение на строительство, чтобы открыть режим города.
              Вы сможете строить дома, инфраструктуру и заводы, привлекать
              жителей и собирать налоги в городскую казну.
            </p>
          </div>

          <div className="mb-4 space-y-2 rounded-xl bg-black/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Разрешение на строительство</span>
              <span className="font-semibold text-amber-400">
                {formatMoney(5_000_000)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Ваш баланс</span>
              <span className="font-semibold text-white">
                {formatMoney(state.balance)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const result = state.buyConstructionPermit();
              if (!result.ok && result.reason) {
                toast.error(result.reason);
              }
            }}
            disabled={state.balance < 5_000_000}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 py-3 font-bold text-white transition-all hover:from-emerald-400 hover:to-emerald-600 active:scale-95 disabled:from-neutral-700 disabled:to-neutral-800 disabled:text-neutral-500"
          >
            {state.balance < 5_000_000
              ? `Недостаточно средств (${formatMoney(state.balance)} / ${formatMoney(5_000_000)})`
              : `Купить разрешение · ${formatMoney(5_000_000)}`}
          </button>

          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Городская казна и строительство не влияют на основной бизнес.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 pb-6">
      <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 ring-1 ring-emerald-900/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-white">🏙️ {state.city.name}</div>
            <div className="text-xs text-neutral-400">{stats.buildingsCount < 10 ? 'Посёлок' : stats.buildingsCount < 30 ? 'Городок' : 'Большой город'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">Казна города</div>
            <div className="font-bold text-amber-400">{formatMoney(state.city.treasury)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <MiniStat label="Население" value={formatNumber(state.city.population)} />
          <MiniStat label="Счастье" value={`${state.city.happiness}%`} />
          <MiniStat label="Доход казны" value={`${formatMoney(incomePerSec)}/с`} />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-neutral-900 p-1 text-xs">
        {([
          ['dashboard', 'Статистика'],
          ['build', 'Строить'],
          ['finance', 'Финансы'],
          ['research', 'Исследования'],
        ] as [SubTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`flex-1 rounded-lg py-2 font-semibold ${sub === t ? 'bg-emerald-600 text-white' : 'text-neutral-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'dashboard' && (
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Работают" value={formatNumber(stats.employed)} />
          <MiniStat label="Безработные" value={formatNumber(stats.unemployed)} />
          <MiniStat label="Средняя зарплата" value={formatMoney(stats.avgSalary)} />
          <MiniStat label="Налоги" value={`${state.city.taxRate}%`} />
          <MiniStat label="Зданий" value={`${stats.buildingsCount}`} />
          <MiniStat label={stats.energy >= 0 ? 'Энергия (профицит)' : 'Энергия (дефицит)'} value={`${stats.energy >= 0 ? '+' : ''}${stats.energy}`} color={stats.energy >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <MiniStat label={stats.water >= 0 ? 'Вода (профицит)' : 'Вода (дефицит)'} value={`${stats.water >= 0 ? '+' : ''}${stats.water}`} color={stats.water >= 0 ? 'text-sky-400' : 'text-red-400'} />
          <MiniStat label="Дороги" value={`${(state.city.buildings['cb_road'] || 0) * 150} м`} />
        </div>
      )}

      {sub === 'build' && (
        <div className="space-y-4">
          {Object.entries(CITY_CATEGORY_LABELS).map(([cat, label]) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold text-neutral-300">{label}</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {CITY_BUILDINGS.filter((b) => b.category === cat).map((b) => {
                  const count = state.city.buildings[b.id] || 0;
                  const canAfford = state.city.treasury >= b.price;
                  return (
                    <div key={b.id} className="rounded-xl bg-neutral-900 p-3 text-center ring-1 ring-emerald-900/30 transition-all duration-200 hover:scale-[1.02] hover:ring-emerald-600/50">
                      <div className="text-2xl">{b.emoji}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-white">{b.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        {b.population > 0 && `+${b.population} нас. `}
                        {b.happiness !== 0 && `${b.happiness > 0 ? '+' : ''}${b.happiness}% счастья`}
                      </div>
                      {count > 0 && <div className="text-[10px] text-amber-400">Построено: {count}</div>}
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          state.buyCityBuilding(b.id);
                          toast.success(`Построено: «${b.name}»`, {
                            description: `+${b.population} население`,
                          });
                        }}
                        className="mt-2 w-full rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500"
                      >
                        {formatMoney(b.price)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === 'finance' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-emerald-900/30">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-neutral-300">Налоговая ставка</span>
              <span className="font-bold text-amber-400">{state.city.taxRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={state.city.taxRate}
              onChange={(e) => state.setCityTaxRate(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Высокие налоги увеличивают доход казны, но могут снижать счастье жителей. Используйте казну для строительства города.
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-900 p-4 ring-1 ring-emerald-900/30">
            <h3 className="mb-2 text-sm font-semibold text-white">Бюджет</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MiniStat label="Казна" value={formatMoney(state.city.treasury)} />
              <MiniStat label="Доход/сек" value={formatMoney(incomePerSec)} />
            </div>
          </div>
        </div>
      )}

      {sub === 'research' && (
        <div className="space-y-2">
          <p className="rounded-xl bg-neutral-900 p-3 text-xs text-neutral-400 ring-1 ring-emerald-900/30">
            Исследования приобретаются за квинты 🟡 и дают постоянный бонус ко всему доходу бизнесов.
          </p>
          {RESEARCH_TREE.map((r) => {
            const done = state.city.research.includes(r.id);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-neutral-900 p-3 ring-1 ring-emerald-900/30 transition-all duration-200 hover:ring-emerald-600/50">
                <span className="text-2xl">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{r.name}</div>
                  <div className="text-xs text-emerald-400">{r.description}</div>
                </div>
                <button
                  disabled={done || state.balance < r.cost}
                  onClick={() => {
                    state.buyResearch(r.id);
                    toast.success(`Исследование изучено: «${r.name}»`, {
                      description: r.description,
                    });
                  }}
                  className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-sky-500 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  {done ? 'Изучено' : `${formatMoney(r.cost)}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-neutral-900 p-2 ring-1 ring-emerald-900/20">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}
