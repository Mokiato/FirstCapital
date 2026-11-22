import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CapitalSnapshot } from '../game/domain/types';
import { formatMoney, moneyToSignedLog } from '../game/domain/money';

interface CapitalHistoryChartProps { points: CapitalSnapshot[]; height?: number; }
interface ChartRow { monthIndex: number; label: string; capital: string; chartValue: number; }

export function CapitalHistoryChart({ points, height = 300 }: CapitalHistoryChartProps) {
  const data: ChartRow[] = points.map((p) => ({
    monthIndex: p.monthIndex,
    label: `Мес. ${p.monthIndex + 1}`,
    capital: p.capital,
    chartValue: moneyToSignedLog(p.capital),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-[#D8D0C4] bg-[#F4F1EA] font-mono text-xs text-[#776E64]">
        История капитала пока не собрана
      </div>
    );
  }

  return (
    <div className="w-full border border-[#D8D0C4] bg-[#FBF9F4] p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid stroke="#D8D0C4" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#776E64', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#D8D0C4' }}
          />
          <YAxis
            dataKey="chartValue"
            tick={{ fill: '#776E64', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
            tickLine={false}
            axisLine={{ stroke: '#D8D0C4' }}
          />
          <Tooltip
            content={(props: any) => {
              const row = props.active ? (props.payload?.[0]?.payload as ChartRow | undefined) : undefined;
              if (!row) return null;
              return (
                <div className="border border-[#D8D0C4] bg-[#FBF9F4] p-3 text-xs text-[#332B2B] shadow-lg">
                  <div className="font-mono font-bold">{formatMoney(row.capital)}</div>
                  <div className="mt-1 font-mono text-[#776E64]">Месяц {row.monthIndex + 1}</div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="chartValue" stroke="#8B5A3C" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#8B5A3C' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}