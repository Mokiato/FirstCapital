import { useMemo, useState } from 'react';
import Modal from './Modal';
import { useGameStore } from '../game/store';
import { BUSINESSES } from '../data/businesses';
import { estimateOpeningCost } from '../game/business/adapters';
import { formatMoney } from '../game/domain/money';

export function OpenBusinessModal({
  defId,
  onClose,
}: {
  defId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  const def = useMemo(() => BUSINESSES.find((b) => b.id === defId) ?? null, [defId]);
  const [premisesMode, setPremisesMode] = useState<'rent' | 'owned'>('rent');
  const [operatingCapital, setOperatingCapital] = useState(100_000);

  if (!def) {
    return <Modal open={false} onClose={onClose}>{null}</Modal>;
  }

  const estimate = estimateOpeningCost(def, premisesMode, operatingCapital);
  const balance = state.balance;
  const canAfford = balance >= estimate.total;

  return (
    <Modal open={!!defId} onClose={onClose} title={`Открыть: ${def.name}`} wide>
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

        {/* Расчет затрат */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <CostRow label="Оборудование" value={estimate.equipment} />
          {estimate.premises > 0 && <CostRow label="Помещение (покупка)" value={estimate.premises} />}
          {estimate.firstMonthRent > 0 && <CostRow label="Аренда (1-й месяц)" value={estimate.firstMonthRent} />}
          <CostRow label="ЖКХ (1-й месяц)" value={estimate.firstMonthUtilities} />
          {estimate.operatingCapital > 0 && <CostRow label="Оборотный капитал" value={estimate.operatingCapital} />}
          
          <div className="mt-3 flex items-baseline justify-between border-t border-[#D8D0C4] pt-3">
            <span className="font-bold text-sm text-[#332B2B]">Итого</span>
            <span className={`font-mono font-bold text-lg ${canAfford ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
              {formatMoney(estimate.total)}
            </span>
          </div>
          <div className="mt-1 text-right font-mono text-[10px] text-[#776E64]">
            На счету: {formatMoney(balance)}
          </div>
        </div>

        {/* Ожидания */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="flex justify-between font-mono text-sm mb-2">
            <span className="text-[#776E64]">Ожидаемая выручка / мес</span>
            <span className="font-bold text-[#4A7C59]">{formatMoney(def.baseRevenue)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm mb-2">
            <span className="text-[#776E64]">Ожидаемая прибыль / мес</span>
            <span className="font-bold text-[#C28B35]">{formatMoney(Math.max(0, def.baseRevenue - def.fixedCosts))}</span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-[#776E64]">Окупаемость</span>
            <span className="font-bold text-[#332B2B]">
              {(() => {
                const profit = Math.max(0, def.baseRevenue - def.fixedCosts);
                if (profit <= 0) return '—';
                return `≈ ${Math.max(1, Math.round(estimate.total / profit))} мес`;
              })()}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={!canAfford}
          onClick={() => {
            const result = state.openBusiness(def.id, premisesMode, operatingCapital);
            if (result.ok) onClose();
          }}
          className={`w-full py-3 font-mono text-sm font-bold transition ${
            canAfford ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]' : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
          }`}
        >
          {canAfford ? `ОТКРЫТЬ ЗА ${formatMoney(estimate.total)}` : 'НЕДОСТАТОЧНО СРЕДСТВ'}
        </button>
      </div>
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