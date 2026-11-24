import Modal from './Modal';
import { useGameStore } from '../game/store';
import { REAL_ESTATE } from '../data/realEstate';
import { PRODUCTIONS } from '../data/productions';
import { formatMoney } from '../game/domain/money';
import { getNpcUnitPrice } from '../game/economy/pricing';
import { getOfficeBonuses } from '../game/selectors';
export function OpenProductionModal({
  premisesId,
  onClose,
}: {
  premisesId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  if (!premisesId) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const premises = REAL_ESTATE.find((r) => r.id === premisesId);
  if (!premises) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const priceCtx = {
    marketIndex: state.marketIndex ?? 1,
    activeEvents: state.activeEvents ?? [],
    monthIndex: Math.floor(state.totalGameMonths),
  };
  const procDiscount = getOfficeBonuses(state).purchaseDiscount;
  const unitPriceOf = (resId: string) => getNpcUnitPrice(resId, priceCtx, procDiscount);
  const capexDiscount = getCapexDiscount({
    hasConstructionCo: state.businesses.some(
      (b) => b.defId === 'construction_co' && b.status === 'operating',
    ),
    hasProjectBureau: state.enterprises.some(
      (e) => e.defId === 'off_project_bureau' && e.status === 'operating',
    ),
  });

  return (
    <Modal open onClose={onClose} title={`Открыть производство: ${premises.name}`} wide>
      <div className="space-y-3 bg-[#FBF9F4] text-[#332B2B]">
        <div className="font-mono text-xs text-[#776E64] mb-4">
          📍 {premises.address} · {premises.area} м²
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRODUCTIONS.map((prod) => {
            const equipCost = prod.startingEquipment;
            const reqEquipCost = Object.entries(prod.requiredEquipment ?? {}).reduce(
              (sum, [resId, qty]) => sum + unitPriceOf(resId) * qty,
              0,
            );
            const initialCost = Object.entries(prod.keyResources).reduce(
              (sum, [resId, qty]) => sum + unitPriceOf(resId) * qty,
              0,
            );
            const firstMonthRent = Math.round(premises.rentalIncome * 0.5);
            const capexPlan = buildCapexPlan(
              getCapexPackage(prod.id, true), state.warehouses, priceCtx,
              { procurementDiscount: procDiscount, capexDiscount },
            );
            const total = equipCost + reqEquipCost + initialCost + firstMonthRent + capexPlan.marketTotal;
            const canAfford = state.balance >= total;

            return (
              <div
                key={prod.id}
                className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-[#332B2B] mb-1">{prod.name}</div>
                  <p className="font-mono text-[10px] text-[#776E64] mb-3 leading-relaxed">
                    {prod.description}
                  </p>

                  <div className="space-y-1 mt-2">
                    <div className="data-row">
                      <span className="data-label">Выручка / мес</span>
                      <span className="data-value text-[#4A7C59]">{formatMoney(prod.baseRevenue)}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Расходы / мес</span>
                      <span className="data-value">{formatMoney(prod.fixedCosts)}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">CAPEX-пакет</span>
                      <span className="data-value">
                        {capexPlan.marketTotal > 0 ? formatMoney(capexPlan.marketTotal) : 'со склада'}
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Окупаемость</span>
                      <span className="data-value">
                        {prod.paybackTarget[0]}–{prod.paybackTarget[1]} мес
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => {
                    const res = state.openProduction(premisesId, prod.id);
                    if (res.ok) onClose();
                  }}
                  className={`mt-4 w-full py-2 font-mono text-xs font-bold transition ${
                    canAfford
                      ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                      : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
                  }`}
                >
                  ОТКРЫТЬ · {formatMoney(total)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}