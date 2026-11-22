// src/components/StatisticsContent.tsx
// Блок статистики для встраивания в ProfileModal.

import { useMemo } from 'react';
import { useGameStore } from '../game/store';
import { calculateCapital } from '../game/economy/capital';
import { REAL_ESTATE } from '../data/realEstate';
import { TRANSPORT } from '../data/transport';
import { formatMoney, moneySub, moneyToNumber } from '../game/domain/money';
import { CapitalHistoryChart } from './CapitalHistoryChart';
import { categoryIcon, categoryLabel } from '../game/statistics/categories';

export function StatisticsContent() {
  const state = useGameStore();

  const {
    breakdown,
    businessCount,
    monthIncome,
    monthExpenses,
    incomeByCategory,
    expensesByCategory,
    capitalDelta,
    capitalDeltaPercent,
  } = useMemo(() => {
        // ── Оценка бизнесов (BusinessRuntime) ─────────────────────
    const businessValues: string[] = [];
    for (const runtime of state.businesses ?? []) {
      const cash = Number(runtime.cashBalance ?? 0);
      const monthlyGross =
        Number(runtime.baseMonthlyRevenue ?? 0) * (runtime.level ?? 1);
      const monthlyExpenses =
        Number(runtime.monthlyPayroll ?? 0) +
        Number(runtime.monthlyRent ?? 0) +
        Number(runtime.monthlyUtilities ?? 0) +
        Number(runtime.monthlyMaintenance ?? 0);
      const monthlyProfit = Math.max(0, monthlyGross - monthlyExpenses);
      businessValues.push(String(cash + monthlyProfit * 12));
    }
    const realEstateValues = state.ownedProperty
      .map((id) => {
        const def = REAL_ESTATE.find((r) => r.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    const transportValues = state.ownedTransport
      .map((id) => {
        const def = TRANSPORT.find((t) => t.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    const stockPositions = (state.marketPositions ?? []).map((pos) => {
      const company = state.marketCompanies.find((c) => c.id === pos.companyId);
      return {
        shares: pos.shares,
        currentPrice: company?.price ?? '0',
      };
    });

    // ── Стоимость склада (по закупочной цене) ──────────────
    const inventoryValue: string[] = [];
    for (const wh of state.warehouses ?? []) {
      for (const item of Object.values(wh.items ?? {})) {
        inventoryValue.push(
          String(Number(item.averageUnitCost ?? 0) * item.quantity),
        );
      }
    }

    const cap = calculateCapital({
      cash: state.balanceDecimal,
      businessValues,
      fundValues: inventoryValue, // склад учитывается в «funds» — ближайший бакет
      bondValues: [],
      metalValues: [],
      stockPositions,
      realEstateValues,
      transportValues,
      liabilities: [],
    });

    // ── Доход/расход за текущий месяц ──────────────────────────
    const monthIndex = state.totalGameMonths;
    const ledger = state.getMonthLedger(monthIndex);
    const byCategory = state.getMonthLedgerByCategory(monthIndex);

    // ── Изменение капитала: сравнение с предыдущим снимком ────
    const snapshots = state.capitalSnapshots ?? [];
    let capitalDelta = '0';
    let capitalDeltaPercent = 0;

    if (snapshots.length >= 2) {
      const prev = snapshots[snapshots.length - 2];
      const last = snapshots[snapshots.length - 1];
      capitalDelta = moneySub(last.capital, prev.capital);
      const prevNum = moneyToNumber(prev.capital);
      if (prevNum > 0) {
        capitalDeltaPercent =
          (moneyToNumber(capitalDelta) / prevNum) * 100;
      }
    }

    return {
      breakdown: cap,
      businessCount: (state.businesses ?? []).length,
      monthIncome: ledger.income,
      monthExpenses: ledger.expenses,
      incomeByCategory: byCategory.income,
      expensesByCategory: byCategory.expenses,
      capitalDelta,
      capitalDeltaPercent,
    };
  }, [state]);

  const snapshots = state.capitalSnapshots ?? [];

  return (
    <div className="space-y-4">
      {/* ── Карточки текущего состояния ──────────────────────── */}
      <div>
        <h3 className="mb-3 font-semibold text-[#332B2B]">📊 Статистика</h3>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Чистый капитал"
            value={formatMoney(breakdown.netWorth)}
            accent
          />
          <StatCard
            label="Изменение за месяц"
            value={`${Number(capitalDelta) >= 0 ? '+' : ''}${formatMoney(capitalDelta)}`}
            tone={Number(capitalDelta) >= 0 ? 'positive' : 'negative'}
            hint={
              snapshots.length >= 2
                ? `${capitalDeltaPercent >= 0 ? '+' : ''}${capitalDeltaPercent.toFixed(1)}%`
                : 'нет данных'
            }
          />
          <StatCard label="Наличные" value={formatMoney(breakdown.cash)} />
          <StatCard
            label="Доход за месяц"
            value={formatMoney(monthIncome)}
            tone="positive"
          />
          <StatCard
            label="Расходы за месяц"
            value={formatMoney(monthExpenses)}
            tone="negative"
          />
          <StatCard
            label="Бизнесы"
            value={`${businessCount} / 28`}
          />
          <StatCard
            label="Стоимость бизнесов"
            value={formatMoney(breakdown.businesses)}
          />
          <StatCard label="Акции" value={formatMoney(breakdown.stocks)} />
          <StatCard
            label="Недвижимость"
            value={formatMoney(breakdown.realEstate)}
          />
          <StatCard
            label="Транспорт"
            value={formatMoney(breakdown.transport)}
          />
          {(state.warehouses ?? []).length === 0 ? (
            <StatCard label="Склад" value={formatMoney('0')} />
          ) : (
            (state.warehouses ?? []).map((wh) => {
              const total = Object.values(wh.items ?? {}).reduce(
                (sum, item) =>
                  sum + Number(item.averageUnitCost ?? 0) * item.quantity,
                0,
              );
              return (
                <StatCard
                  key={wh.id}
                  label={`Склад · ${wh.customName}`}
                  value={formatMoney(total.toString())}
                />
              );
            })
          )}
          <StatCard
            label="Обязательства"
            value={formatMoney(breakdown.liabilities)}
          />
        </div>
      </div>

      {/* ── График капитала ───────────────────────────────────── */}
      <div>
        <h3 className="mb-3 font-semibold text-[#332B2B]">📈 Динамика капитала</h3>
        <CapitalHistoryChart points={snapshots} height={220} />
        <div className="mt-2 font-mono text-xs text-[#776E64]">
          Снимок раз в игровой месяц · {snapshots.length} / 120
        </div>
      </div>

      {/* ── Доходы по категориям ──────────────────────────────── */}
      <CategorySection
        title="💰 Доходы за месяц"
        data={incomeByCategory}
        emptyText="Доходов в этом месяце не было."
        tone="positive"
      />

      {/* ── Расходы по категориям ─────────────────────────────── */}
      <CategorySection
        title="💸 Расходы за месяц"
        data={expensesByCategory}
        emptyText="Расходов в этом месяце не было."
        tone="negative"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  tone,
  hint,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: 'positive' | 'negative';
  hint?: string;
}) {
  const valueClass = accent
    ? 'text-[#4A7C59]'
    : tone === 'positive'
      ? 'text-[#4A7C59]'
      : tone === 'negative'
        ? 'text-[#A84A4A]'
        : 'text-[#332B2B]';

  return (
    <div
      className={[
        'p-2 border',
        accent
          ? 'bg-[#8B5A3C]/10 border-[#8B5A3C]'
          : 'bg-[#FBF9F4] border-[#D8D0C4]',
      ].join(' ')}
    >
      <div className="text-xs text-[#776E64] uppercase tracking-widest">{label}</div>
      <div className={`mt-0.5 font-mono font-bold ${valueClass}`}>{value}</div>
      {hint && <div className="mt-0.5 font-mono text-[10px] text-[#776E64]">{hint}</div>}
    </div>
  );
}

function CategorySection({
  title,
  data,
  emptyText,
  tone,
}: {
  title: string;
  data: Record<string, string>;
  emptyText: string;
  tone: 'positive' | 'negative';
}) {
  const rows = Object.entries(data)
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-3 font-semibold text-[#332B2B]">{title}</h3>
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-3 text-center font-mono text-xs text-[#776E64]">
          {emptyText}
        </div>
      </div>
    );
  }

  const total = rows.reduce((sum, [, value]) => sum + Number(value), 0);
  const toneClass =
    tone === 'positive' ? 'text-[#4A7C59]' : 'text-[#A84A4A]';

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold text-[#332B2B]">{title}</h3>
        <span className={`font-mono text-sm font-bold ${toneClass}`}>
          {formatMoney(String(total))}
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map(([category, value]) => {
          const numeric = Number(value);
          const percent = total > 0 ? (numeric / total) * 100 : 0;
          return (
            <div key={category} className="border border-[#D8D0C4] bg-[#FBF9F4] p-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#332B2B]">
                  <span>{categoryIcon(category)}</span>
                  <span>{categoryLabel(category)}</span>
                </span>
                <span className={`font-mono font-semibold ${toneClass}`}>
                  {formatMoney(value)}
                </span>
              </div>
              <div className="h-1 overflow-hidden bg-[#D8D0C4]">
                <div
                  className={`h-full ${tone === 'positive' ? 'bg-[#4A7C59]' : 'bg-[#A84A4A]'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}