import Modal from './Modal';
import { useGameStore } from '../game/store';
import { REAL_ESTATE } from '../data/realEstate';
import { OFFICE_COMPANIES } from '../data/officeCompanies';
import { RESOURCES_BY_ID } from '../data/resources';
import { formatMoney } from '../game/domain/money';

export function OpenOfficeCompanyModal({
  officeId,
  onClose,
}: {
  officeId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  if (!officeId) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const office = REAL_ESTATE.find((r) => r.id === officeId);
  if (!office) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  return (
    <Modal open onClose={onClose} title={`Открыть офисную компанию: ${office.name}`} wide>
      <div className="space-y-3 bg-[#FBF9F4] text-[#332B2B]">
        <div className="font-mono text-xs text-[#776E64] mb-4">
          📍 {office.address} · {office.area} м²
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OFFICE_COMPANIES.map((comp) => {
            const equipCost = comp.startingEquipment;
            const reqEquipCost = Object.entries(comp.requiredEquipment ?? {}).reduce(
              (sum, [resId, qty]) => {
                const res = RESOURCES_BY_ID[resId];
                return sum + (res ? Number(res.basePrice) * qty * 0.7 : 0);
              },
              0,
            );
            const firstMonthRent = Math.round(office.rentalIncome * 0.5);
            const total = equipCost + reqEquipCost + firstMonthRent;
            const canAfford = state.balance >= total;

            return (
              <div
                key={comp.id}
                className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-[#332B2B] mb-1">{comp.name}</div>
                  <p className="font-mono text-[10px] text-[#776E64] mb-3 leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="space-y-1 mt-2">
                    <div className="data-row">
                      <span className="data-label">Выручка / мес</span>
                      <span className="data-value text-[#4A7C59]">{formatMoney(comp.baseRevenue)}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Бонусы</span>
                      <span className="data-value text-[#8B5A3C]">
                        {comp.bonuses.map((b) => `+${Math.round(b.value * 100)}% ${b.kind}`).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => {
                    const res = state.openOfficeCompany(officeId, comp.id);
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