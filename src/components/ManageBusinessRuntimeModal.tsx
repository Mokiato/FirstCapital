import { useState } from 'react';
import Modal from './Modal';
import { useGameStore } from '../game/store';
import { BUSINESSES } from '../data/businesses';
import { findDefForRuntime, resourceRequirementsFromDef } from '../game/business/adapters';
import { RESOURCES_BY_ID } from '../data/resources';
import { formatMoney, moneyToNumber } from '../game/domain/money';
import { EMPLOYEE_ROLES, EMPLOYEE_ROLES_BY_ID } from '../data/employees';
import { getMonthlyPayroll, getAutomationCapabilities } from '../game/staff/employeeEngine';
import type { EmployeeRole } from '../game/domain/types';

const AVAILABLE_ROLES: EmployeeRole[] = ['manager', 'hr', 'logist', 'marketer', 'accountant'];

export function ManageBusinessRuntimeModal({ instanceId, onClose }: { instanceId: string | null; onClose: () => void }) {
  const state = useGameStore();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [showWarehouseSelect, setShowWarehouseSelect] = useState(false);

  if (!instanceId) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const runtime = state.businesses.find((b) => b.id === instanceId);
  if (!runtime) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const def = findDefForRuntime(runtime, BUSINESSES);
  if (!def) return <Modal open onClose={onClose} title={runtime.name}><div className="font-mono text-sm text-[#A84A4A]">Данные бизнеса не найдены (defId: {runtime.defId})</div></Modal>;

  const requirements = resourceRequirementsFromDef(def);
  const cash = moneyToNumber(runtime.cashBalance);
  const playerBalance = moneyToNumber(state.balanceDecimal);
  const myEmployees = state.employees.filter((e) => e.businessId === runtime.id);
  const totalPayroll = getMonthlyPayroll(state.employees, runtime.id);
  const caps = getAutomationCapabilities(state.employees, runtime.id);

  const hiredRoles = new Set(myEmployees.map((e) => e.role));
  const availableToHire = AVAILABLE_ROLES.filter((r) => !hiredRoles.has(r));

  // Привязанный склад
  const linkedWh = runtime.linkedWarehouseId
    ? state.warehouses.find((w) => w.id === runtime.linkedWarehouseId)
    : null;
  const hasManager = caps.autoManageOperations;

  return (
    <Modal open onClose={onClose} title={runtime.name} wide>
      <div className="space-y-8 bg-[#FBF9F4] text-[#332B2B]">

        {/* ─── СКЛАД ─── */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="data-label mb-1">Привязка к складу</div>
              {linkedWh ? (
                <div className="font-bold text-sm text-[#4A7C59]">
                  {linkedWh.customName}
                </div>
              ) : (
                <div className="font-mono text-xs text-[#776E64]">
                  Без склада — закупки только в розницу, вручную.
                </div>
              )}
            </div>
            {linkedWh ? (
              <button
                onClick={() => state.unlinkWarehouseFromBusiness(runtime.id)}
                className="font-mono text-xs text-[#A84A4A] hover:underline"
              >
                ОТВЯЗАТЬ
              </button>
            ) : (
              <button
                onClick={() => setShowWarehouseSelect(!showWarehouseSelect)}
                disabled={state.warehouses.length === 0}
                className="font-mono text-xs font-bold text-[#8B5A3C] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state.warehouses.length === 0 ? 'НЕТ СКЛАДОВ' : 'ПРИВЯЗАТЬ СКЛАД'}
              </button>
            )}
          </div>

          {/* Выпадающий список складов */}
          {showWarehouseSelect && !linkedWh && state.warehouses.length > 0 && (
            <div className="mt-3 space-y-1">
              {state.warehouses.map((wh) => {
                const used = Object.values(wh.items).reduce((sum, i) => sum + i.quantity, 0);
                const free = wh.capacity - used;
                return (
                  <button
                    key={wh.id}
                    onClick={() => {
                      const res = state.linkWarehouseToBusiness(runtime.id, wh.id);
                      if (res.ok) setShowWarehouseSelect(false);
                    }}
                    className="w-full text-left p-2 border border-[#D8D0C4] bg-[#FBF9F4] hover:bg-[#D8D0C4]/30 transition font-mono text-xs"
                  >
                    <span className="font-bold text-[#332B2B]">{wh.customName}</span>
                    <span className="text-[#776E64] ml-2">· свободно {free.toLocaleString('ru-RU')} мест</span>
                  </button>
                );
              })}
            </div>
          )}

          {hasManager && linkedWh && (
            <div className="mt-2 font-mono text-[10px] text-[#4A7C59] uppercase tracking-widest">
              ✓ Управляющий закупает автоматически
            </div>
          )}
        </div>

        {/* ─── СТАТИСТИКА ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Уровень" value={`${runtime.level}`} />
          <Stat label="Статус" value={runtime.status === 'operating' ? 'Работает' : 'Остановлен'} />
          <Stat label="Баланс бизнеса" value={formatMoney(runtime.cashBalance)} highlight />
          <Stat label="Налог" value={`${Math.round(runtime.taxRate * 100)}%`} />
          <Stat label="Аренда" value={formatMoney(runtime.monthlyRent)} />
          <Stat label="ЖКХ" value={formatMoney(runtime.monthlyUtilities)} />
          <Stat label="Обслуживание" value={formatMoney(runtime.monthlyMaintenance)} />
          <Stat label="База выручки" value={formatMoney(runtime.baseMonthlyRevenue)} />
          <Stat label="Зарплаты / мес" value={formatMoney(totalPayroll)} />
        </div>

        {/* ─── Автоматизация ─── */}
        {(caps.autoManageOperations || caps.autoHire) && (
          <div className="flex gap-4 border-y border-[#D8D0C4] py-2">
            {caps.autoManageOperations && <span className="font-mono text-xs text-[#4A7C59] uppercase tracking-widest">⚙ Автозакупка активна</span>}
            {caps.autoHire && <span className="font-mono text-xs text-[#4A7C59] uppercase tracking-widest">👥 Автозамена активна</span>}
          </div>
        )}

        {/* ─── Потребности ─── */}
        <div>
          <h4 className="data-label mb-3">Потребности в месяц</h4>
          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            {requirements.length === 0 && (
              <div className="p-3 font-mono text-xs text-[#776E64]">Нет потребностей в ресурсах</div>
            )}
            {requirements.map((req) => {
              const res = RESOURCES_BY_ID[req.resourceId];
              const required = req.unitsPerLevel * runtime.level;

              // Если склад привязан — смотрим на него
              const onWarehouse = linkedWh?.items[req.resourceId]?.quantity ?? 0;
              const reserved = linkedWh?.reserved[runtime.id] ?? 0;

              const enough = linkedWh ? (onWarehouse + reserved) >= required : false;
              return (
                <div key={req.resourceId} className="flex items-center justify-between p-3 border-b border-[#D8D0C4] last:border-0 font-mono text-sm">
                  <span>{res?.name ?? req.resourceId}</span>
                  <span className={linkedWh ? (enough ? 'text-[#4A7C59]' : 'text-[#A84A4A]') : 'text-[#776E64]'}>
                    {linkedWh ? `${onWarehouse} / ${required} ${res?.unit ?? ''}` : `${required} ${res?.unit ?? ''} (без склада)`}
                  </span>
                </div>
              );
            })}
          </div>
          {!linkedWh && (
            <div className="mt-2 font-mono text-[10px] text-[#776E64]">
              💡 Привяжите склад, чтобы закупать ресурсы оптом и автоматизировать поставки.
            </div>
          )}
        </div>

        {/* ─── Сотрудники ─── */}
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
                      <div className="font-bold text-sm text-[#332B2B]">{empDef?.name ?? emp.name}</div>
                      <div className="font-mono text-[10px] text-[#776E64] mt-1">
                        Кв. {emp.qualification}/5 · {formatMoney(emp.monthlySalary)} / мес · осталось {emp.monthsRemaining} мес
                      </div>
                    </div>
                    <button onClick={() => state.dismissEmployee(emp.id)} className="font-mono text-xs text-[#A84A4A] hover:underline">
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
                      onClick={() => state.hireEmployee(runtime.id, role)}
                      className="border border-[#D8D0C4] bg-[#FBF9F4] p-2 text-left hover:bg-[#D8D0C4]/30 transition"
                    >
                      <div className="font-bold text-xs text-[#332B2B]">{empDef.name}</div>
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

        {/* ─── Касса: вывод / пополнение ─── */}
        <div className="border-t border-[#D8D0C4] pt-4 space-y-4">
          {/* Вывод в кошелёк */}
          <div>
            <h4 className="data-label mb-2">Вывести из бизнеса в кошелёк</h4>
            <div className="flex gap-2">
              <input
                type="number" min={0} max={cash} value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Сумма"
                className="flex-1 border border-[#D8D0C4] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
              />
              <button
                disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > cash}
                onClick={() => {
                  const result = state.withdrawFromBusiness(runtime.id, Number(withdrawAmount));
                  if (result.ok) setWithdrawAmount('');
                }}
                className="bg-[#8B5A3C] px-6 py-2 font-mono text-sm font-bold text-white hover:bg-[#73482F] transition disabled:opacity-30"
              >
                ВЫВЕСТИ
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#776E64] mt-1">
              Доступно в кассе: {formatMoney(String(cash))}
            </div>
          </div>

          {/* Пополнение из кошелька */}
          <div>
            <h4 className="data-label mb-2">Пополнить кассу из кошелька</h4>
            <div className="flex gap-2">
              <input
                type="number" min={0} max={playerBalance} value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Сумма"
                className="flex-1 border border-[#D8D0C4] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#4A7C59]"
              />
              <button
                disabled={!depositAmount || Number(depositAmount) <= 0 || Number(depositAmount) > playerBalance}
                onClick={() => {
                  const result = state.addToBusinessCash(runtime.id, Number(depositAmount));
                  if (result.ok) setDepositAmount('');
                }}
                className="bg-[#4A7C59] px-6 py-2 font-mono text-sm font-bold text-white hover:bg-[#3d684a] transition disabled:opacity-30"
              >
                ПОПОЛНИТЬ
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#776E64] mt-1">
              В кошельке: {formatMoney(String(playerBalance))}
            </div>
          </div>
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