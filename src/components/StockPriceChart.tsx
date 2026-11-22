import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MarketCompany, PricePoint } from '../game/domain/types';
import { formatMoney } from '../game/domain/money';
import { COMPANY_NAMES_RU } from '../data/companies';

interface StockPriceChartProps {
  company: MarketCompany;
  height?: number;
}

interface ChartRow {
  minuteIndex: number;
  monthIndex: number;
  rawPrice: string;
  displayPrice: number;
}

export function StockPriceChart({ company, height = 260 }: StockPriceChartProps) {
  const data: ChartRow[] = company.history.map((point: PricePoint) => ({
    minuteIndex: point.minuteIndex,
    monthIndex: point.monthIndex,
    rawPrice: point.price,
    // Линейная шкала вместо логарифмической — иначе колебания ±10-20%
    // выглядят как плоская линия на графике.
    displayPrice: Number(point.price),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-400">
        История цены пока не собрана. Подождите несколько секунд.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-white/10 bg-slate-950 p-3">
      <div className="mb-3 text-sm font-semibold text-white">
        Цена акции: {COMPANY_NAMES_RU[company.id] || company.name}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid stroke="#D8D0C4" strokeDasharray="3 3" />
          <XAxis
            dataKey="minuteIndex"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={25}
          />
          <YAxis
            dataKey="displayPrice"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => {
              if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
              return String(Math.round(v));
            }}
          />
          <Tooltip
            content={(props: any) => {
              const row = props.active
                ? (props.payload?.[0]?.payload as ChartRow | undefined)
                : undefined;
              if (!row) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-slate-900 p-3 text-xs text-white shadow-xl">
                  <div>Цена: {formatMoney(row.rawPrice)}</div>
                  <div className="mt-1 text-slate-400">
                    Игровой месяц: {row.monthIndex + 1}
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="displayPrice"
            stroke="#8B5A3C"
            strokeWidth={2}
            // Показываем точки, пока истории мало — иначе одна точка не видна.
            dot={data.length < 15 ? { r: 3, fill: '#38bdf8' } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}