import type { CapitalSnapshot } from '../game/domain/types';
import { formatMoney } from '../game/domain/money';
import { CapitalHistoryChart } from '../components/CapitalHistoryChart';

export interface StatisticsMetric {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}

interface StatisticsScreenProps {
  metrics: StatisticsMetric[];
  capitalHistory: CapitalSnapshot[];
}

export function StatisticsScreen({
  metrics,
  capitalHistory,
}: StatisticsScreenProps) {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="mt-1 text-sm text-slate-400">
          Финансовое состояние и история компании
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const toneClass =
            metric.tone === 'positive'
              ? 'text-emerald-400'
              : metric.tone === 'negative'
                ? 'text-rose-400'
                : 'text-white';

          return (
            <article
              key={metric.id}
              className="rounded-xl border border-white/10 bg-slate-900 p-4"
            >
              <div className="text-sm text-slate-400">{metric.label}</div>
              <div className={`mt-2 text-xl font-bold ${toneClass}`}>
                {metric.value}
              </div>
              {metric.description && (
                <div className="mt-2 text-xs text-slate-500">
                  {metric.description}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <CapitalHistoryChart points={capitalHistory} />

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">
          Что включено в капитал
        </h2>
        <p className="text-sm leading-6 text-slate-400">
          Капитал рассчитывается из денег, инвестиций, акций, недвижимости,
          транспорта и стоимости бизнесов за вычетом долгов. Казна отдельного
          города в капитал игрока не входит.
        </p>
      </section>
    </main>
  );
}

export function formatStatisticMoney(value: string): string {
  return formatMoney(value);
}