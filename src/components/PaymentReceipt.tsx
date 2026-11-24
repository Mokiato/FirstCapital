// Чек оплаты в стиле фискального чека (GDD UI): моноширина, пунктир, зубчатый край, штамп.
import { formatMoney } from '../game/domain/money';

export interface ReceiptRow {
  label: string;
  value: string;
  tone?: 'pos' | 'neg' | 'muted' | 'bold';
}

const TONE: Record<NonNullable<ReceiptRow['tone']>, string> = {
  pos: 'text-[#3F7D54]',
  neg: 'text-[#A84A4A]',
  muted: 'text-[#776E64]',
  bold: 'text-[#332B2B] font-bold',
};

export function PaymentReceipt({
  title,
  rows,
  total,
  balance,
  stamp,
  stampOk,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  rows: ReceiptRow[];
  total: number;
  balance: number;
  stamp: string;
  stampOk: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="relative mx-auto max-w-[440px] bg-[#D6D2C4] text-[#332B2B] px-8 pt-8 pb-12 receipt-zigzag shadow-2xl">
      <div className="text-center font-mono text-sm font-bold uppercase tracking-[0.3em] mb-4">
        {title}
      </div>
      <div className="border-t border-dashed border-[#8A8578] mb-4" />

      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-4 font-mono text-sm">
            <span className="text-[#5C564B]">{r.label}</span>
            <span className={`shrink-0 ${r.tone ? TONE[r.tone] : 'text-[#332B2B]'}`}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-[#8A8578] my-4" />

      <div className="flex justify-between font-mono text-lg font-bold">
        <span>ИТОГО</span>
        <span>{formatMoney(total)}</span>
      </div>
      <div className="flex justify-between font-mono text-xs mt-1">
        <span className="text-[#5C564B]">На счету</span>
        <span className={balance >= total ? 'text-[#3F7D54]' : 'text-[#A84A4A]'}>
          {formatMoney(balance)}
        </span>
      </div>

      <div className="mt-6 flex justify-center">
        <div
          className={`rotate-[-7deg] border-[3px] px-6 py-2 font-mono text-xl font-bold uppercase tracking-[0.25em] select-none ${
            stampOk ? 'border-[#3F7D54] text-[#3F7D54]' : 'border-[#A84A4A] text-[#A84A4A]'
          }`}
        >
          {stamp}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className="border border-[#776E64] py-2 font-mono text-xs font-bold text-[#5C564B] hover:bg-black/5"
        >
          НАЗАД
        </button>
        <button
          disabled={!stampOk}
          onClick={onConfirm}
          className="bg-[#3F7D54] py-2 font-mono text-xs font-bold text-white hover:bg-[#356847] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}