import { useState } from 'react';
import Modal from './Modal';
import { useGameStore } from '../game/store';
import { BUSINESSES } from '../data/businesses';
import { estimateOpeningCost } from '../game/business/adapters';
import { formatMoney } from '../game/domain/money';
import { TAXES } from '../game/config/taxes';
import { getOfficeBonuses } from '../game/selectors';
import {
  buildCapexPlan,
  getCapexPackage,
  getCapexDiscount,
  type CapexSource,
} from '../game/economy/capex';
import { PaymentReceipt, type ReceiptRow } from './PaymentReceipt';

export function OpenBusinessModal({
  defId,
  onClose,
}: {
  defId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  const def = BUSINESSES.find((b) => b.id === defId) ?? null;
  const [premisesMode, setPremisesMode] = useState<'rent' | 'owned'>('rent');
  const [operatingCapital, setOperatingCapital] = useState(100_000);
  const [capexSources, setCapexSources] = useState<Record<string, CapexSource>>({});
  const [showReceipt, setShowReceipt] = useState(false);

  if (!def) {
    return <Modal open={false} onClose={onClose}>{null}</Modal>;
  }

  const priceCtx = {
    marketIndex: state.marketIndex ?? 1,
    activeEvents: state.activeEvents ?? [],
    monthIndex: Math.floor(state.totalGameMonths),
  };
  const procDiscount = getOfficeBonuses(state).purchaseDiscount;
  const capexDiscount = getCapexDiscount({
    hasConstructionCo: state.businesses.some(
      (b) => b.defId === 'construction_co' && b.status === 'operating',
    ),
    hasProjectBureau: state.enterprises.some(
      (e) => e.defId === 'off_project_bureau' && e.status === 'operating',
    ),
  });

  const estimate = estimateOpeningCost(def, premisesMode, operatingCapital, priceCtx, procDiscount);
  const capexPlan = buildCapexPlan(
    getCapexPackage(def.id, premisesMode === 'owned'),
    state.warehouses,
    priceCtx,
    { procurementDiscount: procDiscount, capexDiscount, overrides: capexSources },
  );
  const total = estimate.total + capexPlan.marketTotal;
  const balance = state.balance;
  const canAfford = balance >= total;

  // Честный прогноз по GDD §14.2: EBIT × (1 − 15%)
  const resourcesCost = estimate.initialResources;
  const rentMonthly = premisesMode === 'rent' ? def.fixedCosts * 0.7 : 0;
  const opexMonthly = rentMonthly + def.fixedCosts * 0.3 + def.fixedCosts * 0.05;
  const ebit = Math.max(0, def.baseRevenue - resourcesCost - def.payroll - opexMonthly);
  const netProfit = Math.round(ebit * (1 - TAXES.businessProfit));
  const capex = total - estimate.operatingCapital;
  const paybackMonths = netProfit > 0 ? Math.max(1, Math.round(capex / netProfit)) : null;

  const toggleSource = (resourceId: string) => {
    setCapexSources((prev) => {
      const line = capexPlan.lines.find((l) => l.resourceId === resourceId);
      if (!line) return prev;
      const next: CapexSource =
        (prev[resourceId] ?? line.source) === 'warehouse' ? 'market' : 'warehouse';
      if (next === 'warehouse' && line.available < line.qty) return prev;
      return { ...prev, [resourceId]: next };
    });
  };

  const receiptRows: ReceiptRow[] = [
    { label: 'Оборудование и монтаж', value: formatMoney(estimate.equipment) },
  ];
  if (estimate.requiredEquipment > 0)
    receiptRows.push({ label: 'Разовое оснащение', value: formatMoney(estimate.requiredEquipment) });
  if (estimate.initialResources > 0)
    receiptRows.push({ label: 'Стартовый запас (1 мес)', value: formatMoney(estimate.initialResources) });
  if (estimate.premises > 0)
    receiptRows.push({ label: 'Помещение (покупка)', value: formatMoney(estimate.premises) });
  if (estimate.firstMonthRent > 0)
    receiptRows.push({ label: 'Аренда (1-й месяц)', value: formatMoney(estimate.firstMonthRent) });
  receiptRows.push({ label: 'ЖКХ (1-й месяц)', value: formatMoney(estimate.firstMonthUtilities) });
  for (const l of capexPlan.lines) {
    receiptRows.push({
      label: `CAPEX: ${l.name} ×${l.qty} (${l.source === 'warehouse' ? 'склад' : 'рынок'})`,
      value: l.source === 'warehouse' ? '0 ₽' : formatMoney(l.moneyCost),
      tone: l.source === 'warehouse' ? 'pos' : undefined,
    });
  }
  if (capexPlan.discountPct > 0)
    receiptRows.push({
      label: `Скидка стройки (проектное бюро / стройкомпания)`,
      value: `−${capexPlan.discountPct}%`,
      tone: 'pos',
    });
  if (operatingCapital > 0)
    receiptRows.push({ label: 'Оборотный капитал в кассу', value: formatMoney(operatingCapital) });

  return (
    <Modal open={!!defId} onClose={onClose} title={`Открыть: ${def.name}`} wide>
      {showReceipt ? (
        <PaymentReceipt
          title={`${def.name} · открытие`}
          rows={receiptRows}
          total={total}
          balance={balance}
          stamp={canAfford ? 'К ОПЛАТЕ' : 'НЕТ СРЕДСТВ'}
          stampOk={canAfford}
          confirmLabel="ПОДТВЕРДИТЬ ОПЛАТУ"
          onCancel={() => setShowReceipt(false)}
          onConfirm={() => {
            const result = state.openBusiness(def.id, premisesMode, operatingCapital);
            if (result.ok) onClose();
          }}
        />
      ) : (
      <div className="space-y-6 bg-[#FBF9F4] text-[#332B2B]">

        {/* Помещение */}
        <div>
          <div className="data-label mb-2">Помещение</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPremisesMode('rent')}
              className={`p-3 text-left border transition ${
                premisesMode === 'rent'
                  ? 'border-[#8B5A3C] bg-[#8B5A3C]/10'
                  : 'border-[#D8D0C4] bg-[#F4F1EA] hover:border-[#8B5A3C]'
              }`}
            >
              <div className="font-bold text-sm text-[#332B2B]">Арендовать</div>
              <div className="font-mono text-[10px] text-[#776E64] mt-1">
                {formatMoney(def.fixedCosts * 0.7)} / мес
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPremisesMode('owned')}
              disabled={!def.premisesPrice}
              className={`p-3 text-left border transition ${
                premisesMode === 'owned'
                  ? 'border-[#8B5A3C] bg-[#8B5A3C]/10'
                  : 'border-[#D8D0C4] bg-[#F4F1EA] hover:border-[#8B5A3C]'
              } disabled:opacity-40`}
            >
              <div className="font-bold text-sm text-[#332B2B]">Купить</div>
              <div className="font-mono text-[10px] text-[#776E64] mt-1">
                {def.premisesPrice ? formatMoney(def.premisesPrice) : 'недоступно'}
              </div>
            </button>
          </div>
        </div>

        {/* Оборотный капитал */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="data-label">Оборотный капитал</div>
            <div className="font-mono text-sm font-bold text-[#8B5A3C]">
              {formatMoney(operatingCapital)}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(500_000, Math.floor(balance / 2))}
            step={10_000}
            value={operatingCapital}
            onChange={(e) => setOperatingCapital(Number(e.target.value))}
            className="w-full accent-[#8B5A3C]"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[#776E64]">
            <span>0</span>
            <span>Рекомендуем: {formatMoney(def.fixedCosts * 1.5)}</span>
            <span>{formatMoney(Math.max(500_000, Math.floor(balance / 2)))}</span>
          </div>
        </div>

        {/* CAPEX-пакет (GDD §7.3) */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="font-mono text-[10px] text-[#776E64] uppercase tracking-widest mb-2">
            Строительно-монтажный CAPEX-пакет
          </div>
          <div className="space-y-1">
            {capexPlan.lines.map((l) => {
              const src = capexSources[l.resourceId] ?? l.source;
              const canWarehouse = l.available >= l.qty;
              return (
                <div key={l.resourceId} className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-[#332B2B]">
                    {l.name} ×{l.qty}
                    <span className="text-[#776E64]"> (склад: {Math.floor(l.available)})</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={src === 'warehouse' ? 'text-[#4A7C59] font-bold' : 'text-[#332B2B]'}>
                      {src === 'warehouse' ? '0 ₽' : formatMoney(l.moneyCost)}
                    </span>
                    <button
                      type="button"
                      disabled={!canWarehouse && src === 'market'}
                      onClick={() => toggleSource(l.resourceId)}
                      className={`px-2 py-0.5 border text-[10px] font-bold ${
                        src === 'warehouse'
                          ? 'border-[#4A7C59] text-[#4A7C59]'
                          : 'border-[#D8D0C4] text-[#776E64]'
                      } disabled:opacity-40`}
                    >
                      {src === 'warehouse' ? 'СО СКЛАДА' : 'КУПИТЬ'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {capexPlan.discountPct > 0 && (
            <div className="mt-2 font-mono text-[10px] text-[#4A7C59]">
              Скидка денежной части CAPEX: −{capexPlan.discountPct}%
            </div>
          )}
        </div>

        {/* Расчёт затрат */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <CostRow label="Оборудование" value={estimate.equipment} />
          {estimate.requiredEquipment > 0 && <CostRow label="Разовое оснащение (рынок)" value={estimate.requiredEquipment} />}
          {estimate.initialResources > 0 && <CostRow label="Стартовый запас (1 мес)" value={estimate.initialResources} />}
          {estimate.premises > 0 && <CostRow label="Помещение (покупка)" value={estimate.premises} />}
          {estimate.firstMonthRent > 0 && <CostRow label="Аренда (1-й месяц)" value={estimate.firstMonthRent} />}
          <CostRow label="ЖКХ (1-й месяц)" value={estimate.firstMonthUtilities} />
          <CostRow label="CAPEX-пакет (рыночная часть)" value={capexPlan.marketTotal} />
          {estimate.operatingCapital > 0 && <CostRow label="Оборотный капитал" value={estimate.operatingCapital} />}

          <div className="mt-3 flex items-baseline justify-between border-t border-[#D8D0C4] pt-3">
            <span className="font-bold text-sm text-[#332B2B]">Итого</span>
            <span className={`font-mono font-bold text-lg ${canAfford ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
              {formatMoney(total)}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[10px] text-[#776E64]">
            На счету: {formatMoney(balance)}
          </div>
        </div>

        {/* Прогноз P&L (GDD §14.2) */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="font-mono text-[10px] text-[#776E64] uppercase tracking-widest mb-2">
            Прогноз при 100% загрузке и полном спросе
          </div>
          <div className="flex justify-between font-mono text-sm mb-1">
            <span className="text-[#776E64]">Выручка</span>
            <span className="font-bold text-[#4A7C59]">{formatMoney(def.baseRevenue)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mb-1">
            <span className="text-[#776E64]">Сырьё</span>
            <span className="text-[#332B2B]">−{formatMoney(resourcesCost)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mb-1">
            <span className="text-[#776E64]">ФОТ (рабочий штат)</span>
            <span className="text-[#332B2B]">−{formatMoney(def.payroll)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mb-1">
            <span className="text-[#776E64]">Аренда + ЖКХ + обслуживание</span>
            <span className="text-[#332B2B]">−{formatMoney(opexMonthly)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mb-1 border-t border-[#D8D0C4] pt-1 mt-1">
            <span className="text-[#776E64]">Налог {Math.round(TAXES.businessProfit * 100)}% с EBIT</span>
            <span className="text-[#332B2B]">−{formatMoney(ebit - netProfit)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm font-bold mt-1">
            <span className="text-[#332B2B]">Чистая прибыль / мес</span>
            <span className="text-[#C28B35]">{formatMoney(netProfit)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mt-1">
            <span className="text-[#776E64]">Окупаемость CAPEX</span>
            <span className="font-bold text-[#332B2B]">{paybackMonths ? `≈ ${paybackMonths} мес` : '—'}</span>
          </div>
          <div className="mt-2 font-mono text-[10px] text-[#776E64] leading-relaxed">
            Без логистики, поломок и просадок спроса. Управляющий / HR / бухгалтер нанимаются сверх ФОТ.
          </div>
        </div>

        <button
          type="button"
          disabled={!canAfford}
          onClick={() => setShowReceipt(true)}
          className={`w-full py-3 font-mono text-sm font-bold transition ${
            canAfford ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]' : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
          }`}
        >
          {canAfford ? `К ОПЛАТЕ ${formatMoney(total)}` : 'НЕДОСТАТОЧНО СРЕДСТВ'}
        </button>
      </div>
      )}
    </Modal>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-1 border-b border-[#D8D0C4] last:border-0 font-mono text-sm">
      <span className="text-[#776E64]">{label}</span>
      <span className="text-[#332B2B]">{formatMoney(value)}</span>
    </div>
  );
}