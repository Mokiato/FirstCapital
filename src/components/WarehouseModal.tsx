import { useState } from 'react';
import Modal from './Modal';
import { toast } from 'sonner';
import { useGameStore } from '../game/store';
import { REAL_ESTATE } from '../data/realEstate';
import { formatMoney } from '../game/domain/money';
import { RESOURCES_BY_ID } from '../data/resources';
import type { WarehouseRole } from '../game/domain/warehouseTypes';
import { getNpcMonthlyDemand, getRemainingNpcDemand } from '../game/economy/npcDemand';
import { getB2BUnitPrice, getDumpUnitPrice } from '../game/economy/pricing';
import { isFleetOperational } from '../game/logistics/fleet';

const ROLE_NAMES: Record<WarehouseRole, string> = {
  manager: 'Управляющий',
  hr: 'HR-специалист',
  accountant: 'Бухгалтер',
  storekeeper: 'Кладовщик',
  loader: 'Грузчик',
  driver: 'Водитель',
};

const SIZE_NAMES: Record<string, string> = {
  small: 'Малый',
  medium: 'Средний',
  large: 'Большой',
  huge: 'Огромный',
};

const ROLE_SALARIES: Record<WarehouseRole, string> = {
  manager: '80 000 – 120 000 ₽',
  hr: '50 000 – 80 000 ₽',
  accountant: '40 000 – 70 000 ₽',
  storekeeper: '40 000 – 60 000 ₽',
  loader: '30 000 – 50 000 ₽',
  driver: '45 000 – 65 000 ₽',
};

const LIMITS: Record<string, Record<WarehouseRole, number>> = {
  small:  { storekeeper: 1, loader: 1, manager: 1, hr: 1, accountant: 1, driver: 1 },
  medium: { storekeeper: 2, loader: 2, manager: 1, hr: 1, accountant: 1, driver: 1 },
  large:  { storekeeper: 3, loader: 3, manager: 1, hr: 1, accountant: 1, driver: 1 },
  huge:   { storekeeper: 3, loader: 5, manager: 1, hr: 1, accountant: 1, driver: 1 },
};

const TRUCK_PRICES: Record<string, number> = {
  small: 500_000,
  medium: 1_500_000,
  large: 3_000_000,
  huge: 5_000_000,
};

export function WarehouseModal({
  warehouseId,
  onClose,
}: {
  warehouseId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  if (!warehouseId) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const wh = state.warehouses.find((w) => w.id === warehouseId);
  if (!wh) return <Modal open={false} onClose={onClose}>{null}</Modal>;

  const def = REAL_ESTATE.find((r) => r.id === wh.id);
  const address = def?.address ?? 'Адрес неизвестен';

  const used = Object.values(wh.items).reduce((sum, i) => sum + i.quantity, 0);
  const percent = (used / wh.capacity) * 100;
  const hasActiveEvent = wh.activeEvent && !wh.activeEvent.resolved;

  const savedName = newName || wh.customName;
  const mode = state.propertyMode[wh.id] ?? 'personal';
  const rental = state.rentedProperties[wh.id];
  const offers = state.activeRentalOffers[wh.id];
  const truckPrice = TRUCK_PRICES[wh.size];
  const hasDriver = wh.employees.some((e) => e.role === 'driver');
  const fleetOn = isFleetOperational(wh);
  const priceCtx = {
    marketIndex: state.marketIndex ?? 1,
    activeEvents: state.activeEvents ?? [],
    monthIndex: Math.floor(state.totalGameMonths),
  };

  const handleRename = () => {
    if (savedName.trim() && savedName !== wh.customName) {
      state.renameWarehouse(wh.id, savedName);
    }
    setRenaming(false);
    setNewName('');
  };

  const handleToggleMode = () => {
    if (mode === 'personal') {
      state.togglePropertyMode(wh.id);
      state.findTenants(wh.id);
    } else {
      if (rental) {
        if (confirm('Выселить арендатора? Штраф: 1 месяц аренды.')) {
          state.evictTenant(wh.id);
          state.togglePropertyMode(wh.id);
        }
      } else {
        state.togglePropertyMode(wh.id);
      }
    }
  };

  return (
    <Modal open onClose={onClose} title={wh.customName} wide>
      <div className="space-y-6 bg-[#FBF9F4] text-[#332B2B]">

        {/* ─── Активное событие ─── */}
        {hasActiveEvent && wh.activeEvent && (
          <div className="border-2 border-[#A84A4A] bg-[#A84A4A]/10 p-4">
            <div className="font-mono text-xs text-[#A84A4A] uppercase tracking-widest font-bold mb-2">
              ⚠️ {wh.activeEvent.kind === 'theft' ? 'КРАЖА' :
                  wh.activeEvent.kind === 'fire' ? 'ПОЖАР' :
                  wh.activeEvent.kind === 'pipe_burst' ? 'ПРОРЫВ ТРУБЫ' :
                  'ПОЛОМКА ОБОРУДОВАНИЯ'}
            </div>
            <div className="text-sm text-[#332B2B] mb-3">
              Склад заблокирован. Требуется устранить за{' '}
              <span className="font-bold text-[#A84A4A]">
                {formatMoney(String(wh.activeEvent.cost))}
              </span>.
            </div>
            <button
              onClick={() => {
                const res = state.resolveWarehouseEvent(wh.id);
                if (!res.ok) {
                  toast.error(res.reason ?? 'Не удалось');
                }
              }}
              className="w-full bg-[#A84A4A] text-white py-2 font-mono text-sm font-bold hover:bg-[#8c3a3a] transition"
            >
              УСТРАНИТЬ · {formatMoney(String(wh.activeEvent.cost))}
            </button>
          </div>
        )}

        {/* ─── Счёт за обслуживание парка ─── */}
        {wh.fleetInvoice && (
          <div className="border-2 border-[#C28B35] bg-[#C28B35]/10 p-4">
            <div className="font-mono text-xs text-[#C28B35] uppercase tracking-widest font-bold mb-2">
              🧾 Счёт за парк · перевезено {formatMoney(String(Math.round(wh.fleetInvoice.volume)))}
            </div>
            <div className="space-y-1 mb-3">
              {wh.fleetInvoice.lines.map((line) => {
                const r = RESOURCES_BY_ID[line.resourceId];
                return (
                  <div key={line.resourceId} className="flex justify-between gap-2 font-mono text-xs">
                    <span className="text-[#332B2B]">
                      {r?.name ?? line.resourceId}: {line.required.toFixed(2)} {r?.unit ?? ''}
                      <span className="text-[#776E64]">
                        {' '}(склад {line.fromStock.toFixed(2)} / докупить {line.toBuy.toFixed(2)})
                      </span>
                    </span>
                    <span className="text-[#332B2B] shrink-0">
                      {formatMoney(String(Math.round(line.purchaseCost)))}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="font-mono text-[10px] text-[#776E64] mb-3 leading-relaxed">
              Пока счёт не оплачен, парк стоит: доставки по наёмному тарифу +12% / +5%.
              Не оплатите до конца следующего месяца — начислим наёмный тариф{' '}
              {formatMoney(String(Math.round(wh.fleetInvoice.hiredFallback)))}.
            </div>
            <button
              onClick={() => {
                const res = state.payFleetInvoice(wh.id);
                if (!res.ok) toast.error(res.reason ?? 'Не удалось оплатить');
              }}
              className="w-full bg-[#C28B35] text-white py-2 font-mono text-sm font-bold hover:bg-[#a8762c] transition"
            >
              ОПЛАТИТЬ СЧЁТ · {formatMoney(String(Math.round(wh.fleetInvoice.purchaseTotal)))}
            </button>
          </div>
        )}

        {/* ─── Инфо ─── */}        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-2">
            📍 {address}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            <div>
              <div className="data-label">Размер</div>
              <div className="data-value">{SIZE_NAMES[wh.size]}</div>
            </div>
            <div>
              <div className="data-label">Вместимость</div>
              <div className="data-value">{used} / {wh.capacity}</div>
            </div>
            <div>
              <div className="data-label">Свой парк</div>
              <div className={`data-value ${fleetOn ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
                {!wh.hasTrucks
                  ? '✗ Нет грузовика'
                  : !hasDriver
                    ? '✗ Нет водителя'
                    : wh.fleetInvoice
                      ? '⚠ Счёт не оплачен'
                      : '✓ Работает'}
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#D8D0C4] mt-4">
            <div className={`h-full ${percent > 90 ? 'bg-[#A84A4A]' : 'bg-[#8B5A3C]'}`} style={{ width: `${Math.min(100, percent)}%` }} />
          </div>
        </div>

        {/* ─── Переименование ─── */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="data-label mb-2">Название склада</div>
          {renaming ? (
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={wh.customName}
                className="flex-1 border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm outline-none focus:border-[#8B5A3C]"
                autoFocus
              />
              <button onClick={handleRename} className="bg-[#8B5A3C] text-white px-4 py-2 font-mono text-xs font-bold hover:bg-[#73482F]">OK</button>
              <button onClick={() => { setRenaming(false); setNewName(''); }} className="border border-[#D8D0C4] px-4 py-2 font-mono text-xs font-bold">Отмена</button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="font-bold text-sm">{wh.customName}</div>
              <button onClick={() => setRenaming(true)} className="font-mono text-xs text-[#8B5A3C] hover:underline">ПЕРЕИМЕНОВАТЬ</button>
            </div>
          )}
        </div>

        {/* ─── Грузовик ─── */}
        {!wh.hasTrucks && (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-sm">Грузовая машина</div>
              <div className="font-mono text-[10px] text-[#776E64] mt-1 leading-relaxed">
                Обнуляет наценку +12% / +5% и даёт мгновенную поставку.
                Нужен водитель; расходники парка ≈5% от перевезённого объёма.
              </div>
            </div>
            <button
              onClick={() => state.buyWarehouseTruck(wh.id)}
              className="bg-[#8B5A3C] text-white px-4 py-2 font-mono text-xs font-bold hover:bg-[#73482F]"
            >
              КУПИТЬ · {formatMoney(truckPrice)}
            </button>
          </div>
        )}

        {/* ─── Режим: Личное / Аренда ─── */}
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="data-label mb-1">Режим использования</div>
              <div className={`font-bold text-sm ${mode === 'rent' ? 'text-[#C28B35]' : 'text-[#4A7C59]'}`}>
                {mode === 'rent' ? 'Сдан в аренду' : 'Личное пользование'}
              </div>
            </div>
            <button
              onClick={handleToggleMode}
              className={`px-4 py-2 font-mono text-xs font-bold border transition ${
                mode === 'rent'
                  ? 'border-[#A84A4A] text-[#A84A4A] hover:bg-[#A84A4A] hover:text-white'
                  : 'border-[#8B5A3C] text-[#8B5A3C] hover:bg-[#8B5A3C] hover:text-white'
              }`}
            >
              {mode === 'rent' ? 'ВЕРНУТЬ В ЛИЧНОЕ' : 'СДАТЬ В АРЕНДУ'}
            </button>
          </div>
        </div>

        {/* ─── Активная аренда ─── */}
        {rental && (
          <div className="border border-[#4A7C59] bg-[#4A7C59]/10 p-4">
            <div className="font-mono text-xs text-[#4A7C59] uppercase tracking-widest mb-2 font-bold">Активный арендатор</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">{rental.tenantName}</div>
                <div className="font-mono text-xs text-[#776E64] mt-1">
                  {formatMoney(rental.rentPrice)} / мес · осталось {rental.monthsLeft} мес
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Офферы арендаторов ─── */}
        {mode === 'rent' && !rental && offers && offers.length > 0 && (
          <div>
            <div className="data-label mb-2">Доступные предложения</div>
            <div className="space-y-2">
              {offers.map((offer) => (
                <div key={offer.id} className="border border-[#D8D0C4] bg-[#F4F1EA] p-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{offer.name}</div>
                    <div className="font-mono text-xs text-[#776E64] mt-1">
                      {formatMoney(offer.rentPrice)} / мес · {offer.duration} мес
                    </div>
                  </div>
                  <button
                    onClick={() => state.acceptTenant(wh.id, offer.id)}
                    className="bg-[#4A7C59] text-white px-4 py-2 font-mono text-xs font-bold hover:bg-[#3d684a]"
                  >
                    ПРИНЯТЬ
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => state.findTenants(wh.id)} className="mt-2 font-mono text-xs text-[#8B5A3C] hover:underline">
              НАЙТИ ДРУГИХ АРЕНДАТОРОВ
            </button>
          </div>
        )}

        {mode === 'rent' && !rental && (!offers || offers.length === 0) && (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 text-center">
            <button onClick={() => state.findTenants(wh.id)} className="bg-[#8B5A3C] text-white px-6 py-2 font-mono text-xs font-bold hover:bg-[#73482F]">
              НАЙТИ АРЕНДАТОРА
            </button>
          </div>
        )}

        {/* ─── Содержимое ─── */}
        <div>
          <div className="data-label mb-2">Содержимое склада</div>
          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            {Object.keys(wh.items).length === 0 ? (
              <div className="p-4 text-center font-mono text-xs text-[#776E64]">Склад пуст</div>
            ) : (
              Object.entries(wh.items).map(([resId, item]) => {
                const res = RESOURCES_BY_ID[resId];
                // Канал 3: B2B 0.90× в пределах спроса; канал 5: слив 0.45× сверх.
                const b2bPrice = getB2BUnitPrice(resId, priceCtx);
                const dumpPrice = getDumpUnitPrice(resId, priceCtx);
                const remainingDemand = getRemainingNpcDemand(state.monthlyNpcSold, resId);
                const b2bQty = Math.min(item.quantity, remainingDemand);
                const dumpQty = item.quantity - b2bQty;
                const accountingPerUnit = Number(item.averageUnitCost ?? 0);
                const accountingTotal = accountingPerUnit * item.quantity;
                const sellTotal = b2bPrice * b2bQty + dumpPrice * dumpQty;                const canSell = !hasActiveEvent && !rental;
                const sell = (qty: number) => {
                  const r = state.sellResourceFromWarehouse(wh.id, resId, qty);
                  if (r.ok) {
                    toast.success(`Продано ${qty} × ${res?.name ?? resId} за ${formatMoney(r.total ?? '0')}`);
                  } else {
                    toast.error(r.reason ?? 'Не удалось продать');
                  }
                };
                return (
                  <div key={resId} className="flex justify-between items-center gap-3 p-3 border-b border-[#D8D0C4] last:border-0 font-mono text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="text-[#332B2B] truncate">{res?.name ?? resId}</div>
                      <div className="text-[#776E64] text-xs mt-0.5">
                        {item.quantity} {res?.unit ?? ''} · учёт: {formatMoney(String(accountingPerUnit))}/{res?.unit ?? 'ед.'}
                      </div>
                      <div className="text-[#776E64] text-[10px] mt-0.5">
                        B2B-спрос: {state.monthlyNpcSold?.[resId] ?? 0} / {getNpcMonthlyDemand(resId)}
                        {' · '}
                        Учёт: {formatMoney(String(accountingTotal))}
                        {' · '}
                        Выручка: <span className={sellTotal < accountingTotal ? 'text-[#A84A4A]' : 'text-[#4A7C59]'}>{formatMoney(String(sellTotal))}</span>
                        {' · '}
                        B2B {formatMoney(String(b2bPrice))} × {b2bQty}
                        {dumpQty > 0 && (
                          <span className="text-[#A84A4A]">
                            {' '}+ слив {formatMoney(String(dumpPrice))} × {dumpQty}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        disabled={!canSell}
                        onClick={() => sell(1)}
                        className="border border-[#8B5A3C] text-[#8B5A3C] px-2 py-1 text-[10px] font-bold hover:bg-[#8B5A3C] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ПРОДАТЬ 1
                      </button>
                      <button
                        disabled={!canSell}
                        onClick={() => sell(item.quantity)}
                        className="bg-[#8B5A3C] text-white px-2 py-1 text-[10px] font-bold hover:bg-[#73482F] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ПРОДАТЬ ВСЁ
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Сотрудники ─── */}
        <div>
          <div className="data-label mb-2">Сотрудники ({wh.employees.length})</div>
          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            {wh.employees.length === 0 && (
              <div className="p-4 text-center font-mono text-xs text-[#776E64]">Нет сотрудников</div>
            )}
            {wh.employees.map((emp) => (
              <div key={emp.id} className="flex justify-between items-center p-3 border-b border-[#D8D0C4] last:border-0">
                <div>
                  <div className="font-bold text-sm">{ROLE_NAMES[emp.role]}</div>
                  <div className="font-mono text-[10px] text-[#776E64] mt-1">
                    {formatMoney(emp.monthlySalary)} / мес
                  </div>
                </div>
                <button
                  onClick={() => state.dismissWarehouseEmployee(wh.id, emp.id)}
                  className="font-mono text-xs text-[#A84A4A] hover:underline"
                >
                  УВОЛИТЬ
                </button>
              </div>
            ))}
          </div>

          {/* Найм */}
          <div className="mt-3">
            <div className="data-label mb-2">Нанять</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(ROLE_NAMES) as WarehouseRole[]).map((role) => {
                const current = wh.employees.filter((e) => e.role === role).length;
                const max = LIMITS[wh.size][role];
                const disabled = current >= max;
                return (
                  <button
                    key={role}
                    disabled={disabled}
                    onClick={() => state.hireWarehouseEmployee(wh.id, role)}
                    className={`p-2 text-left border transition ${
                      disabled
                        ? 'border-[#D8D0C4] bg-[#F4F1EA] opacity-40 cursor-not-allowed'
                        : 'border-[#D8D0C4] bg-[#FBF9F4] hover:bg-[#D8D0C4]/30'
                    }`}
                  >
                    <div className="font-bold text-xs">{ROLE_NAMES[role]}</div>
                    <div className="font-mono text-[10px] text-[#776E64] mt-1">
                      {current}/{max} · {ROLE_SALARIES[role]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}