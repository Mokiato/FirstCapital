const UNITS: { value: number; symbol: string }[] = [
  { value: 1e24, symbol: 'Сп' },
  { value: 1e21, symbol: 'Ск' },
  { value: 1e18, symbol: 'Кн' },
  { value: 1e15, symbol: 'Кв' },
  { value: 1e12, symbol: 'Т' },
  { value: 1e9, symbol: 'Б' },
  { value: 1e6, symbol: 'М' },
  { value: 1e3, symbol: 'К' },
];

export function formatMoney(n: number, withRuble = true): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0' + (withRuble ? ' ₽' : '');
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const suffix = withRuble ? ' ₽' : '';
  if (abs < 1000) {
    return `${sign}${abs < 10 ? abs.toFixed(abs === 0 ? 0 : 1) : Math.floor(abs)}${suffix}`;
  }
  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const val = abs / unit.value;
      const formatted = val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2);
      return `${sign}${formatted} ${unit.symbol}${suffix}`;
    }
  }
  return `${sign}${Math.floor(abs)}${suffix}`;
}

export function formatNumber(n: number): string {
  return formatMoney(n, false);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.floor(n));
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (v: number) => v.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
