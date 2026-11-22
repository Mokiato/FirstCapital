import { useState } from 'react';

import type {
  LoanRuntime,
  Money,
} from '../game/domain/types';
import { formatMoney } from '../game/domain/money';
import {
  calculateCreditLimit,
  estimateMonthlyPayment,
  monthlyRateForCreditScore,
} from '../game/finance/creditEngine';

interface LoanPanelProps {
  creditScore: number;
  monthlyProfit: Money;
  ratingCoefficient: number;
  activeLoan: LoanRuntime | null;

  onApply: (amount: Money, termMonths: number) => void;
  onRepayEarly: () => void;
}

export function LoanPanel({
  creditScore,
  monthlyProfit,
  ratingCoefficient,
  activeLoan,
  onApply,
  onRepayEarly,
}: LoanPanelProps) {
  const [amountInput, setAmountInput] = useState('');
  const [termMonths, setTermMonths] = useState(6);

  const limit = calculateCreditLimit(
    monthlyProfit,
    ratingCoefficient,
  );

  const monthlyRate =
    monthlyRateForCreditScore(creditScore);

  const amount = amountInput || '0';

  const estimate = estimateMonthlyPayment(
    amount,
    monthlyRate,
    termMonths,
  );

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <h2 className="text-lg font-bold text-white">
        Банк
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-950 p-3">
          <div className="text-xs text-slate-400">
            Кредитный рейтинг
          </div>
          <div className="mt-1 font-semibold text-white">
            {creditScore} / 1000
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-3">
          <div className="text-xs text-slate-400">
            Ставка в месяц
          </div>
          <div className="mt-1 font-semibold text-white">
            {(monthlyRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-3">
          <div className="text-xs text-slate-400">
            Доступный лимит
          </div>
          <div className="mt-1 font-semibold text-white">
            {formatMoney(limit)}
          </div>
        </div>
      </div>

      {activeLoan?.status === 'active' ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="font-semibold text-amber-200">
            Активный кредит
          </div>

          <div className="mt-2 text-sm text-slate-300">
            Остаток долга: {formatMoney(activeLoan.balance)}
          </div>

          <div className="mt-1 text-sm text-slate-300">
            Платёж в месяц: {formatMoney(activeLoan.monthlyPayment)}
          </div>

          <div className="mt-1 text-sm text-slate-300">
            Просрочка: {formatMoney(activeLoan.arrears)}
          </div>

          <button
            type="button"
            onClick={onRepayEarly}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Погасить досрочно
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">
              Сумма кредита
            </span>
            <input
              type="number"
              min="1"
              value={amountInput}
              onChange={(event) =>
                setAmountInput(event.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">
              Срок
            </span>
            <select
              value={termMonths}
              onChange={(event) =>
                setTermMonths(Number(event.target.value))
              }
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            >
              <option value={3}>3 месяца</option>
              <option value={6}>6 месяцев</option>
              <option value={12}>12 месяцев</option>
            </select>
          </label>

          <div className="text-sm text-slate-400">
            Ориентировочный платёж:{' '}
            <span className="font-semibold text-white">
              {formatMoney(estimate)}
            </span>{' '}
            в месяц
          </div>

          <button
            type="button"
            disabled={!amountInput || Number(amountInput) <= 0}
            onClick={() => onApply(amount, termMonths)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Подать заявку
          </button>
        </div>
      )}
    </section>
  );
}
