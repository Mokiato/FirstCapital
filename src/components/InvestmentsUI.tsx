import { useState } from 'react';
import { useGameStore } from '../game/store';
import { FUNDS, BONDS, METALS } from '../data/finance';
import { formatMoney, moneyToNumber } from '../game/domain/money';

export function FundsSection() {
  const funds = useGameStore((s) => s.funds);
  const buyFund = useGameStore((s) => s.buyFund);
  const withdrawFund = useGameStore((s) => s.withdrawFund);
  const balance = useGameStore((s) => moneyToNumber(s.balanceDecimal));

  return (
    <div className="space-y-2">
      {FUNDS.map((fund) => {
        const position = funds.find((f) => f.fundId === fund.id);
        const monthlyYieldPct = (fund.monthlyYield * 100).toFixed(2);

        return (
          <div key={fund.id} className="rounded-xl bg-neutral-900 p-3 ring-1 ring-emerald-900/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{fund.name}</div>
                <div className="text-[10px] text-neutral-500">{fund.description}</div>
                <div className="mt-1 text-xs text-emerald-400">
                  ~{monthlyYieldPct}% / мес · Мин: {formatMoney(fund.minInvestment)}
                </div>
              </div>
              {position && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-neutral-500">В фонде</div>
                  <div className="font-semibold text-white">{formatMoney(position.currentValue)}</div>
                  <div className="text-[10px] text-emerald-400">вложено {formatMoney(position.invested)}</div>
                </div>
              )}
            </div>

            <FundActions
              minInvestment={fund.minInvestment}
              balance={balance}
              hasPosition={!!position}
              maxWithdraw={position ? Number(position.currentValue) : 0}
              onBuy={(amt: number) => buyFund(fund.id, amt)}
              onWithdraw={(amt: number) => withdrawFund(fund.id, amt)}
            />
          </div>
        );
      })}
    </div>
  );
}

function FundActions({ minInvestment, balance, hasPosition, maxWithdraw, onBuy, onWithdraw }: any) {
  const [amountInput, setAmountInput] = useState('');
  return (
    <div className="mt-2 flex gap-2">
      <input type="number" min={0} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="Сумма" className="flex-1 rounded-lg bg-neutral-800 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-emerald-500" />
      <button type="button" disabled={!amountInput || Number(amountInput) < minInvestment || Number(amountInput) > balance} onClick={() => { onBuy(Number(amountInput)); setAmountInput(''); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500">Вложить</button>
      <button type="button" disabled={!hasPosition || !amountInput || Number(amountInput) <= 0 || Number(amountInput) > maxWithdraw} onClick={() => { onWithdraw(Number(amountInput)); setAmountInput(''); }} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500">Вывести</button>
    </div>
  );
}

export function BondsSection() {
  const bonds = useGameStore((s) => s.bonds);
  const buyBond = useGameStore((s) => s.buyBond);
  const balance = useGameStore((s) => moneyToNumber(s.balanceDecimal));

  return (
    <div className="space-y-2">
      {BONDS.map((bond) => {
        const positions = bonds.filter((b) => b.bondId === bond.id);
        const totalQty = positions.reduce((s, p) => s + p.quantity, 0);

        return (
          <div key={bond.id} className="rounded-xl bg-neutral-900 p-3 ring-1 ring-emerald-900/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{bond.name}</div>
                <div className="text-[10px] text-neutral-500">Номинал {formatMoney(bond.faceValue)} · {bond.termMonths} мес</div>
                <div className="mt-1 text-xs text-emerald-400">Купон ~{(bond.monthlyCoupon * 100).toFixed(2)}% / мес</div>
              </div>
              {totalQty > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-neutral-500">У вас</div>
                  <div className="font-semibold text-white">{totalQty} шт</div>
                  <div className="text-[10px] text-neutral-500">{positions[0]?.monthsToMaturity ?? 0} мес до погаш.</div>
                </div>
              )}
            </div>
            <BondActions faceValue={bond.faceValue} balance={balance} onBuy={(qty: number) => buyBond(bond.id, qty)} />
          </div>
        );
      })}
    </div>
  );
}

function BondActions({ faceValue, balance, onBuy }: any) {
  const [qtyInput, setQtyInput] = useState('1');
  const qty = Number(qtyInput) || 0;
  const total = qty * faceValue;
  return (
    <div className="mt-2 flex items-center gap-2">
      <input type="number" min={1} value={qtyInput} onChange={(e) => setQtyInput(e.target.value)} className="w-16 rounded-lg bg-neutral-800 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-emerald-500" />
      <button type="button" disabled={qty <= 0 || total > balance} onClick={() => { onBuy(qty); setQtyInput('1'); }} className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500">Купить · {formatMoney(total)}</button>
    </div>
  );
}

export function MetalsSection() {
  const metals = useGameStore((s) => s.metals);
  const buyMetal = useGameStore((s) => s.buyMetal);
  const sellMetal = useGameStore((s) => s.sellMetal);
  const balance = useGameStore((s) => moneyToNumber(s.balanceDecimal));

  return (
    <div className="space-y-2">
      {METALS.map((metal) => {
        const position = metals.find((m) => m.metalId === metal.id);
        const price = position ? Number(position.currentPrice) : metal.basePrice;
        const value = position ? price * position.quantity : 0;

        return (
          <div key={metal.id} className="rounded-xl bg-neutral-900 p-3 ring-1 ring-emerald-900/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{metal.name}</div>
                <div className="text-[10px] text-neutral-500">за 1 {metal.unit} · цена {formatMoney(price)}</div>
              </div>
              {position && (
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-neutral-500">{position.quantity.toFixed(2)} {metal.unit}</div>
                  <div className="font-semibold text-amber-400">{formatMoney(value)}</div>
                </div>
              )}
            </div>
            <MetalActions unit={metal.unit} balance={balance} hasPosition={!!position} quantity={position?.quantity ?? 0} onBuy={(amount: number) => buyMetal(metal.id, amount)} onSell={(qty: number) => sellMetal(metal.id, qty)} />
          </div>
        );
      })}
    </div>
  );
}

function MetalActions({ unit, balance, hasPosition, quantity, onBuy, onSell }: any) {
  const [amountInput, setAmountInput] = useState('');
  const [sellInput, setSellInput] = useState('');
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-2">
        <input type="number" min={0} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="Сумма в ₽" className="flex-1 rounded-lg bg-neutral-800 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-emerald-500" />
        <button type="button" disabled={!amountInput || Number(amountInput) <= 0 || Number(amountInput) > balance} onClick={() => { onBuy(Number(amountInput)); setAmountInput(''); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500">Купить</button>
      </div>
      {hasPosition && (
        <div className="flex gap-2">
          <input type="number" min={0} step="0.01" value={sellInput} onChange={(e) => setSellInput(e.target.value)} placeholder={`Кол-во (${unit})`} className="flex-1 rounded-lg bg-neutral-800 px-2 py-1.5 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-emerald-500" />
          <button type="button" disabled={!sellInput || Number(sellInput) <= 0 || Number(sellInput) > quantity} onClick={() => { onSell(Number(sellInput)); setSellInput(''); }} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500">Продать</button>
        </div>
      )}
    </div>
  );
}