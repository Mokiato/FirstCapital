import { useState } from 'react';
import Modal from './Modal';
import { useGameStore } from '../game/store';
import { PRODUCTIONS_BY_ID } from '../data/productions';
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import { REAL_ESTATE } from '../data/realEstate';
import { RESOURCES_BY_ID } from '../data/resources';
import { EMPLOYEE_ROLES, EMPLOYEE_ROLES_BY_ID } from '../data/employees';
import { getMonthlyPayroll } from '../game/staff/employeeEngine';
import { formatMoney, moneyToNumber } from '../game/domain/money';
import type { EmployeeRole } from '../game/domain/types';

const AVAILABLE_ROLES: EmployeeRole[] = ['manager', 'hr', 'accountant'];

export function ManageEnterpriseModal({
  enterpriseId,
  onClose,
}: {
  enterpriseId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  const [distInput, setDistInput] = useState<Record<string, { toWarehouse: number; toSell: number }>>({});

  if (!enterpriseId) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const ent = state.enterprises.find((e) => e.id === enterpriseId);
  if (!ent) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const isProduction = ent.type === 'production';
  const def = isProduction
    ? PRODUCTIONS_BY_ID[ent.defId]
    : OFFICE_COMPANIES_BY_ID[ent.defId];
  if (!def) {
    return (
      <Modal open onClose={onClose} title="Неизвестное предприятие">
        <div className="font-mono text-sm text-[#A84A4A]">defId {ent.defId} не найден в каталоге.</div>
      </Modal>
    );
  }

  const premises = REAL_ESTATE.find((r) => r.id === ent.premisesId);
  const linkedWh = ent.linkedWarehouseId
    ? state.warehouses.find((w) => w.id === ent.linkedWarehouseId)
    : null;

  const myEmployees = state.employees.filter((e) => e.businessId === ent.id);
  const totalPayroll = getMonthlyPayroll(state.employees, ent.id);
  const hiredRoles = new Set(myEmployees.map((e) => e.role));
  const availableToHire = AVAILABLE_ROLES.filter((r) => !hiredRoles.has(r));

  const cash = moneyToNumber(ent.cashBalance);

  return (
    <Modal open onClose={onClose} title={def.name} wide>
      <div className="space-y-6 bg-[#FBF9F4] text-[#332B2B]">

        {/* Инфо */}
        <div className="font-mono text-xs text-[#776E64] border-b border-[#D8D0C4] pb-3">
          📍 {premises?.name} · {premises?.address}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Уровень" value={`${ent.level}`} />
          <Stat label="Статус" value={ent.status === 'operating' ? 'Работает' : 'Остановлено'} />
          <Stat label="Касса" value={formatMoney(ent.cashBalance)} highlight />
          <Stat label="Налог" value={`${Math.round(ent.taxRate * 100)}%`} />
          <Stat label="Аренда" value={formatMoney(ent.monthlyRent)} />
          <Stat label="ЖКХ" value={formatMoney(ent.monthlyUtilities)} />
          <Stat label="Выручка база" value={formatMoney(ent.baseMonthlyRevenue)} />
          <Stat label="Зарплаты / мес" value={formatMoney(totalPayroll)} />
        </div>

        {/* Привязка к складу (только для производств) */}
        {isProduction && (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="data-label mb-1">Привязка к складу</div>
                {linkedWh ? (
                  <div className="font-bold text-sm text-[#4A7C59]">{linkedWh.customName}</div>
                ) : (
                  <div className="font-mono text-xs text-[#776E64]">
                    Без склада — вся продукция продаётся по ×0.7.
                  </div>
                )}
              </div>
              {linkedWh ? (
                <button
                  onClick={() => state.unlinkWarehouseFromEnterprise(ent.id)}
                  className="font-mono text-xs text-[#A84A4A] hover:underline"
                >
                  ОТВЯЗАТЬ
                </button>
              ) : (
                state.warehouses.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) state.linkWarehouseToEnterprise(ent.id, e.target.value);
                    }}
                    className="border border-[#D8D0C4] bg-[#FBF9F4] px-2 py-1 font-mono text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Выбрать склад</option>
                    {state.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.customName}</option>
                    ))}
                  </select>
                )
              )}
            </div>
          </div>
        )}

        {/* Распределение продукции (только для производств) */}
        {isProduction && 'produces' in def && def.produces && (
          <div>
            <div className="data-label mb-2">Распределение продукции</div>
            <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
              {Object.entries(def.produces).map(([resId, perLevel]) => {
                const total = Math.floor(perLevel * ent.level);
                const current = ent.productionDistribution?.[resId] ?? { toWarehouse: 0, toSell: 0 };
                const input = distInput[resId] ?? current;
                const res = RESOURCES_BY_ID[resId];
                return (
                  <div key={resId} className="p-3 border-b border-[#D8D0C4] last:border-0">
                    <div className="flex justify-between mb-2">
                      <div className="font-bold text-sm">{res?.name ?? resId}</div>
                      <div className="font-mono text-xs text-[#776E64]">Произведено: {total}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="font-mono text-[10px] text-[#776E64] mb-1">На склад</div>
                        <input
                          type="number"
                          min={0}
                          max={total}
                          value={input.toWarehouse}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(total, Number(e.target.value)));
                            setDistInput((p) => ({ ...p, [resId]: { toWarehouse: v, toSell: total - v } }));
                          }}
                          className="w-full border border-[#D8D0C4] bg-[#FBF9F4] px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-[#776E64] mb-1">На продажу</div>
                        <input
                          type="number"
                          min={0}
                          max={total}
                          value={input.toSell}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(total, Number(e.target.value)));
                            setDistInput((p) => ({ ...p, [resId]: { toWarehouse: total - v, toSell: v } }));
                          }}
                          className="w-full border border-[#D8D0C4] bg-[#FBF9F4] px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        state.setProductionDistribution(ent.id, resId, input.toWarehouse, input.toSell);
                      }}
                      className="mt-2 bg-[#8B5A3C] text-white px-3 py-1 font-mono text-[10px] font-bold hover:bg-[#73482F]"
                    >
                      ПРИМЕНИТЬ
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Сотрудники */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h4 className="data-label">Сотрудники ({myEmployees.length})</h4>
            <span className="font-mono text-xs text-[#776E64]">{formatMoney(totalPayroll)} / мес</span>
          </div>

          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            {myEmployees.length === 0 ? (
              <div className="p-4 text-center font-mono text-xs text-[#776E64]">Сотрудников нет</div>
            ) : (
              myEmployees.map((emp) => {
                const empDef = EMPLOYEE_ROLES_BY_ID[emp.role];
                return (
                  <div key={emp.id} className="flex justify-between items-center p-3 border-b border-[#D8D0C4] last:border-0">
                    <div>
                      <div className="font-bold text-sm">{empDef?.name ?? emp.name}</div>
                      <div className="font-mono text-[10px] text-[#776E64] mt-1">
                        {formatMoney(emp.monthlySalary)} / мес · осталось {emp.monthsRemaining} мес
                      </div>
                    </div>
                    <button onClick={() => state.dismissEnterpriseEmployee(emp.id)} className="font-mono text-xs text-[#A84A4A] hover:underline">
                      УВОЛИТЬ
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {availableToHire.length > 0 && (
            <div className="mt-3">
              <div className="data-label mb-2">Нанять</div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {availableToHire.map((role) => {
                  const empDef = EMPLOYEE_ROLES.find((e) => e.role === role);
                  if (!empDef) return null;
                  return (
                    <button
                      key={role}
                      onClick={() => state.hireEnterpriseEmployee(ent.id, role)}
                      className="border border-[#D8D0C4] bg-[#FBF9F4] p-2 text-left hover:bg-[#D8D0C4]/30 transition"
                    >
                      <div className="font-bold text-xs">{empDef.name}</div>
                      <div className="font-mono text-[10px] text-[#776E64] mt-1">
                        {formatMoney(empDef.salaryMin)}–{formatMoney(empDef.salaryMax)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Вывод из кассы */}
        <div className="border-t border-[#D8D0C4] pt-4">
          <h4 className="data-label mb-3">Вывести в кошелёк</h4>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={cash}
              id="enterprise-withdraw"
              placeholder="Сумма"
              className="flex-1 border border-[#D8D0C4] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
            />
            <button
              onClick={() => {
                const input = document.getElementById('enterprise-withdraw') as HTMLInputElement;
                const amount = Number(input?.value ?? 0);
                if (amount > 0 && amount <= cash) {
                  state.recordTransaction({
                    direction: 'income',
                    amount,
                    category: 'enterprise_withdraw',
                    description: `Вывод из ${def.name}`,
                  });
                  state.enterprises;
                  // списать из кассы предприятия
                  const s = state;
                  const nextEnterprises = s.enterprises.map((e) =>
                    e.id === ent.id ? { ...e, cashBalance: String(Number(e.cashBalance) - amount) } : e,
                  );
                  useGameStore.setState({ enterprises: nextEnterprises });
                  input.value = '';
                }
              }}
              className="bg-[#8B5A3C] px-6 py-2 font-mono text-sm font-bold text-white hover:bg-[#73482F] transition"
            >
              ВЫВЕСТИ
            </button>
          </div>
        </div>

        {/* Закрыть предприятие */}
        <div className="border-t border-[#D8D0C4] pt-4">
          <button
            onClick={() => {
              if (confirm('Закрыть предприятие? Помещение освободится.')) {
                const res = state.closeEnterprise(ent.id);
                if (res.ok) onClose();
              }
            }}
            className="w-full border border-[#A84A4A] text-[#A84A4A] py-2 font-mono text-xs font-bold hover:bg-[#A84A4A] hover:text-white transition"
          >
            ЗАКРЫТЬ ПРЕДПРИЯТИЕ
          </button>
        </div>

      </div>
    </Modal>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="data-label mb-1">{label}</div>
      <div className={`font-mono text-sm ${highlight ? 'text-[#8B5A3C] font-bold' : 'text-[#332B2B]'}`}>{value}</div>
    </div>
  );
}