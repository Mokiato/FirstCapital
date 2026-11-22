import { useGameStore } from '../game/store';
import { getActiveHoliday, getTotalIncomePerSec } from '../game/selectors';
import { formatMoney } from '../utils/format';

export default function EventScreen() {
  const state = useGameStore();
  const holiday = getActiveHoliday(state);

  if (!holiday) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-white mb-2">Нет активных событий</h2>
        <p className="text-neutral-400">Следите за календарём — праздники появляются автоматически!</p>
      </div>
    );
  }

  const income = getTotalIncomePerSec(state);
  const boostedIncome = income;

  return (
    <div className="p-3 pb-6 md:p-6 max-w-[1200px] mx-auto">
      <div className={`rounded-3xl bg-gradient-to-br ${
        holiday.id === 'new_year' ? 'from-red-900 via-emerald-900 to-blue-900' :
        holiday.id === 'halloween' ? 'from-orange-900 via-purple-900 to-black' :
        holiday.id === 'march_8' ? 'from-pink-900 via-rose-900 to-purple-900' :
        holiday.id === 'victory_day' ? 'from-amber-900 via-red-900 to-neutral-900' :
        'from-sky-900 via-emerald-900 to-cyan-900'
      } p-8 ring-1 ring-white/20 shadow-2xl`}>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 drop-shadow-2xl">{holiday.emoji}</div>
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow">{holiday.name}</h1>
          <div className="inline-block rounded-full bg-white/20 backdrop-blur px-4 py-1 text-sm text-white">
            🎉 Праздничный бонус активен!
          </div>
        </div>

        <div className="rounded-2xl bg-black/30 backdrop-blur p-6 mb-6">
          <p className="text-center text-lg text-white mb-6">{holiday.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
              <div className="text-xs text-white/70 mb-1">Множитель дохода</div>
              <div className="text-3xl font-extrabold text-amber-400">×{holiday.multiplier}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
              <div className="text-xs text-white/70 mb-1">Доход с бонусом</div>
              <div className="text-xl font-bold text-emerald-400">{formatMoney(boostedIncome)}/с</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur col-span-2 md:col-span-1">
              <div className="text-xs text-white/70 mb-1">Статус</div>
              <div className="text-lg font-bold text-emerald-400">✓ Активно</div>
            </div>
          </div>
        </div>

        {state.forcedHoliday && (
          <div className="rounded-xl bg-amber-900/40 p-3 text-sm text-amber-200 text-center ring-1 ring-amber-500/30">
            ⚙️ Этот ивент активирован через DevTools. Отключите в настройках.
          </div>
        )}

        <div className="mt-6 text-center text-xs text-white/60">
          Праздники дают глобальный множитель на весь пассивный и активный доход
        </div>
      </div>
    </div>
  );
}