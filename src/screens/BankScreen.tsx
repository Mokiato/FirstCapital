import { useState } from 'react';
import { useGameStore } from '../game/store';
import { formatMoney } from '../game/domain/money';
import { LoanPanel } from '../components/LoanPanel';

export default function BankScreen() {
  const creditScore = useGameStore((s) => s.creditScore);
  const loans = useGameStore((s) => s.loans);
  const activeLoan = loans.find((l) => l.status === 'active') ?? null;
  const applyForLoan = useGameStore((s) => s.applyForLoan);
  const repayLoanEarly = useGameStore((s) => s.repayLoanEarly);
  const getMonthlyProfit = useGameStore((s) => s.getMonthlyProfit);
  const getCreditRatingCoefficient = useGameStore((s) => s.getCreditRatingCoefficient);
  const cash = useGameStore((s) => s.balance);

  return (
    <div className="w-full h-full min-h-screen bg-[#FBF9F4] p-6 md:p-10">
      
      {/* Шапка банка */}
      <div className="flex items-center justify-between mb-8 border-b border-[#D8D0C4] pb-4">
        <div>
  <h1 className="text-2xl font-bold text-[#332B2B]">КапиталТраст</h1>
</div>
        <div className="font-mono text-sm text-[#776E64]">
          Кредитный рейтинг: <span className="font-bold text-[#4A7C59]">{creditScore}</span> / 1000
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: Сводка */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-[#F4F1EA] p-6 border border-[#D8D0C4]">
            <div className="data-label mb-2">Ваш баланс</div>
            <div className="font-mono text-2xl font-bold text-[#332B2B]">{formatMoney(cash)}</div>
          </div>

          <div className="bg-[#F4F1EA] p-6 border border-[#D8D0C4]">
            <div className="data-label mb-2">Доступный лимит</div>
            <div className="font-mono text-2xl font-bold text-[#332B2B]">
              {formatMoney(String(Number(getMonthlyProfit()) * getCreditRatingCoefficient()))}
            </div>
          </div>

          <div className="bg-[#C28B35] p-6 border border-[#C28B35] text-white">
            <div className="font-mono text-xs opacity-90 mb-2 uppercase tracking-widest">Активный кредит</div>
            <div className="font-mono text-2xl font-bold">
              {activeLoan ? formatMoney(activeLoan.balance) : 'НЕТ'}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Кредиты и Вклады */}
        <div className="xl:col-span-2 space-y-8">
          {/* Кредитование */}
          <div className="bg-[#F4F1EA] p-6 border border-[#D8D0C4]">
            <h2 className="text-lg font-bold text-[#332B2B] mb-4">Кредитование</h2>
            <LoanPanel
              creditScore={creditScore}
              monthlyProfit={getMonthlyProfit()}
              ratingCoefficient={getCreditRatingCoefficient()}
              activeLoan={activeLoan}
              onApply={(amount, termMonths) => applyForLoan(Number(amount), termMonths)}
              onRepayEarly={() => repayLoanEarly()}
            />
          </div>

          {/* Вклады */}
          <DepositsPanel />
        </div>
      </div>
    </div>
  );
}

function DepositsPanel() {
  const savings = useGameStore((s) => s.savingsBalance);
  const deposits = useGameStore((s) => s.fixedDeposits);
  const depositToSavings = useGameStore((s) => s.depositToSavings);
  const withdrawFromSavings = useGameStore((s) => s.withdrawFromSavings);
  const openFixedDeposit = useGameStore((s) => s.openFixedDeposit);
  const closeFixedDeposit = useGameStore((s) => s.closeFixedDeposit);
  
  const [amount, setAmount] = useState('10000');
  const [term, setTerm] = useState(6);

  return (
    <div className="bg-[#F4F1EA] p-6 border border-[#D8D0C4]">
      <h2 className="text-lg font-bold text-[#332B2B] mb-4">Вклады и сбережения</h2>

      {/* Накопительный счёт */}
      <div className="mb-6 p-5 bg-[#4A7C59]/10 border border-[#4A7C59]/30">
        <div className="data-label text-[#4A7C59] mb-2 font-bold">Накопительный счёт · +2%/мес</div>
        <div className="font-mono text-3xl font-bold text-[#4A7C59] mb-4">{formatMoney(savings)}</div>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
            placeholder="Сумма"
          />
          <button
            onClick={() => depositToSavings(Number(amount))}
            className="bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d684a] transition"
          >
            Пополнить
          </button>
          <button
            onClick={() => withdrawFromSavings(Number(amount))}
            className="border border-[#D8D0C4] bg-[#FBF9F4] px-4 py-2 text-sm font-semibold text-[#332B2B] hover:bg-[#D8D0C4]/20 transition"
          >
            Снять
          </button>
        </div>
      </div>

      {/* Срочные вклады */}
      <div className="data-label mb-3">
        Срочные вклады ({deposits.length}/10)
      </div>
      <div className="space-y-2 mb-6">
        {deposits.length === 0 && (
          <div className="text-sm font-mono text-[#776E64] text-center py-4 border border-dashed border-[#D8D0C4]">Нет активных вкладов</div>
        )}
        {deposits.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4 bg-[#FBF9F4] border border-[#D8D0C4]">
            <div>
              <div className="font-mono font-bold text-[#332B2B]">{formatMoney(d.amount)}</div>
              <div className="font-mono text-xs text-[#776E64] mt-1">
                Осталось: {d.monthsLeft} из {d.termMonths} мес · +{(d.monthlyRate * 100).toFixed(1)}%/мес
              </div>
            </div>
            <button
              onClick={() => closeFixedDeposit(d.id)}
              className="font-mono text-xs text-[#A84A4A] font-bold hover:underline"
            >
              ЗАКРЫТЬ ДОСРОЧНО
            </button>
          </div>
        ))}
      </div>

      {/* Открыть вклад */}
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
          placeholder="Сумма"
        />
        <select
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          className="border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
        >
          <option value={3}>3 мес (+10%)</option>
          <option value={6}>6 мес (+25%)</option>
          <option value={12}>12 мес (+60%)</option>
        </select>
        <button
          onClick={() => openFixedDeposit(Number(amount), term)}
          className="bg-[#8B5A3C] px-6 py-2 text-sm font-bold text-white hover:bg-[#73482F] transition"
        >
          Открыть
        </button>
      </div>
    </div>
  );
}