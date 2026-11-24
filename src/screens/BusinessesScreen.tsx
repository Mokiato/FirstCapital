import { useState } from 'react';
import { useGameStore } from '../game/store';
import { BUSINESSES } from '../data/businesses';
import { getCompanyLevel } from '../game/selectors';
import { OpenBusinessModal } from '../components/OpenBusinessModal';
import { ManageBusinessRuntimeModal } from '../components/ManageBusinessRuntimeModal';
import { formatMoney } from '../game/domain/money';
import { REAL_ESTATE } from '../data/realEstate';
import { OpenProductionModal } from '../components/OpenProductionModal';
import { OpenOfficeCompanyModal } from '../components/OpenOfficeCompanyModal';
import { ManageEnterpriseModal } from '../components/ManageEnterpriseModal';
import { WarehouseModal } from '../components/WarehouseModal';

type SubTab = 'mine' | 'open' | 'warehouse' | 'offices' | 'premises';

export default function BusinessesScreen() {
  const state = useGameStore();
  const [sub, setSub] = useState<SubTab>('mine');
  const [openDefId, setOpenDefId] = useState<string | null>(null);
  const [manageInstanceId, setManageInstanceId] = useState<string | null>(null);
  const [warehouseModalId, setWarehouseModalId] = useState<string | null>(null);
  const [openProductionPremisesId, setOpenProductionPremisesId] = useState<string | null>(null);
  const [openOfficeOfficeId, setOpenOfficeOfficeId] = useState<string | null>(null);
  const [manageEnterpriseId, setManageEnterpriseId] = useState<string | null>(null);
  const level = getCompanyLevel(state);
  const myBusinesses = state.businesses;
  const openedDefIds = new Set(myBusinesses.map((b) => b.defId));
  const availableDefs = BUSINESSES.filter((b) => !openedDefIds.has(b.id));

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto bg-[#FBF9F4] min-h-screen">
      
      {/* Шапка */}
      <div className="mb-6 border-b border-[#D8D0C4] pb-4">
        <h1 className="text-2xl font-bold text-[#332B2B]">Бизнесы</h1>
        <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">Управление активами</p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-6 border-b border-[#D8D0C4] mb-6">
        {([
          ['mine', `Бизнесы (${myBusinesses.length})`],
          ['open', 'Открыть'],
          ['warehouse', 'Склады'],
          ['premises', 'Помещения'],
          ['offices', 'Офисы'],
        ] as [SubTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
              sub === t
                ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* МОИ БИЗНЕСЫ (Таблица) */}
      {sub === 'mine' && (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
          <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#D8D0C4] font-mono text-xs text-[#776E64] uppercase tracking-widest">
            <div className="col-span-4">Название</div>
            <div className="col-span-2">Уровень</div>
            <div className="col-span-2">Статус</div>
            <div className="col-span-2 text-right">Баланс</div>
            <div className="col-span-2 text-right">Действие</div>
          </div>
          
          {myBusinesses.length === 0 && (
            <div className="p-8 text-center font-mono text-sm text-[#776E64]">
              У вас пока нет бизнесов. Откройте вкладку «Открыть».
            </div>
          )}
          
          {myBusinesses.map((runtime) => {
            const def = BUSINESSES.find((b) => b.id === runtime.defId);
            if (!def) return null;
            
            const statusColor = 
              runtime.status === 'operating' ? 'text-[#4A7C59]' : 
              runtime.status === 'stopped' ? 'text-[#A84A4A]' : 'text-[#776E64]';
            const statusText = 
              runtime.status === 'operating' ? 'Работает' : 
              runtime.status === 'stopped' ? 'Остановлен' : 'Закрыт';

            return (
              <div key={runtime.id} className="grid grid-cols-12 gap-4 items-center p-3 border-b border-[#D8D0C4] last:border-0 hover:bg-[#FBF9F4] transition">
                <div className="col-span-4">
                  <div className="font-bold text-sm text-[#332B2B]">{runtime.name}</div>
                  <div className="font-mono text-[10px] text-[#776E64] uppercase">{def.kind}</div>
                </div>
                <div className="col-span-2 font-mono text-sm text-[#332B2B]">{runtime.level}</div>
                <div className={`col-span-2 font-mono text-xs font-bold ${statusColor}`}>
                  {statusText}
                </div>
                <div className="col-span-2 text-right font-mono text-sm text-[#332B2B]">
                  {formatMoney(runtime.cashBalance)}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setManageInstanceId(runtime.id)}
                    className="border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-1.5 font-mono text-xs font-bold text-[#332B2B] hover:bg-[#D8D0C4]/30 transition"
                  >
                    УПРАВЛЯТЬ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ОТКРЫТЬ НОВЫЙ (Строгие карточки) */}
      {sub === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDefs.map((def) => {
            const locked = level < def.unlockLevel;
            return (
              <div key={def.id} className={`border border-[#D8D0C4] bg-[#F4F1EA] p-5 flex flex-col justify-between ${locked ? 'opacity-50' : ''}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-[#332B2B]">{def.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#776E64] border border-[#D8D0C4] px-2 py-0.5">
                      {def.kind}
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="data-row">
                      <span className="data-label">Выручка</span>
                      <span className="data-value text-[#4A7C59]">{formatMoney(def.baseRevenue)}/мес</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Содержание / мес</span>
                      <span className="data-value">{formatMoney(def.fixedCosts)}/мес</span>
                    </div>
                  </div>
                </div>
                
                <button
                  disabled={locked}
                  onClick={() => setOpenDefId(def.id)}
                  className={`mt-6 w-full py-2 font-mono text-sm font-bold transition ${
                    locked 
                      ? 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed' 
                      : 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                  }`}
                >
                  {locked ? `ОТКРОЕТСЯ НА УР. ${def.unlockLevel}` : 'ОТКРЫТЬ'}
                </button>
              </div>
            );
          })}
        </div>
      )}

            {/* СКЛАДЫ (Список) */}
      {sub === 'warehouse' && (
        <div>
          {state.warehouses.length === 0 ? (
            <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
              У вас пока нет складов. Купите склад в Агентстве недвижимости (Интернет → Недвижимость → Склады).
            </div>
          ) : (
            <div className="space-y-2">
              {state.warehouses.map((wh) => {
                const def = REAL_ESTATE.find((r) => r.id === wh.id);
                const used = Object.values(wh.items).reduce((sum, i) => sum + i.quantity, 0);
                const percent = (used / wh.capacity) * 100;
                const mode = state.propertyMode[wh.id] ?? 'personal';
                const hasEvent = wh.activeEvent && !wh.activeEvent.resolved;

                return (
                  <button
                    key={wh.id}
                    onClick={() => setWarehouseModalId(wh.id)}
                    className="w-full text-left border border-[#D8D0C4] bg-[#F4F1EA] p-4 hover:bg-[#FBF9F4] transition flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm text-[#332B2B]">{wh.customName}</div>
                        {hasEvent && (
                          <span className="font-mono text-[10px] bg-[#A84A4A] text-white px-2 py-0.5">
                            ТРЕБУЕТ РЕШЕНИЯ
                          </span>
                        )}
                        {mode === 'rent' && (
                          <span className="font-mono text-[10px] bg-[#C28B35] text-white px-2 py-0.5">
                            В АРЕНДЕ
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-[#776E64] mt-1">
                        📍 {def?.address ?? 'Адрес неизвестен'}
                      </div>
                      <div className="h-1 w-full bg-[#D8D0C4] mt-2">
                        <div className={`h-full ${percent > 90 ? 'bg-[#A84A4A]' : 'bg-[#8B5A3C]'}`} style={{ width: `${Math.min(100, percent)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-bold text-[#332B2B]">{used} / {wh.capacity}</div>
                      <div className="font-mono text-[10px] text-[#776E64] mt-1">
                        {wh.employees.length} сотр.
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* ПОМЕЩЕНИЯ (Промышленные) */}
      {sub === 'premises' && (
        <div>
          {(() => {
            const ownedPremises = state.ownedProperty.filter((id) => {
              const def = REAL_ESTATE.find((r) => r.id === id);
              return def?.category === 'industrial';
            });

            if (ownedPremises.length === 0) {
              return (
                <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
                  У вас нет промышленных помещений. Купите в Агентстве недвижимости (Интернет → Недвижимость → Промпомещения).
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {ownedPremises.map((premisesId) => {
                  const def = REAL_ESTATE.find((r) => r.id === premisesId);
                  if (!def) return null;
                  const ent = state.enterprises.find(
                    (e) => e.premisesId === premisesId && e.status !== 'closed',
                  );
                  const mode = state.propertyMode[premisesId] ?? 'personal';
                  const isRented = mode === 'rent';

                  return (
                    <div
                      key={premisesId}
                      className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm text-[#332B2B]">{def.name}</div>
                          {ent && (
                            <span className="font-mono text-[10px] bg-[#4A7C59] text-white px-2 py-0.5">
                              ПРОИЗВОДСТВО
                            </span>
                          )}
                          {isRented && (
                            <span className="font-mono text-[10px] bg-[#C28B35] text-white px-2 py-0.5">
                              В АРЕНДЕ
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-[#776E64] mt-1">
                          📍 {def.address} · {def.area} м²
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {ent && (
                          <button
                            onClick={() => setManageEnterpriseId(ent.id)}
                            className="border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-1.5 font-mono text-xs font-bold text-[#332B2B] hover:bg-[#D8D0C4]/30 transition"
                          >
                            УПРАВЛЯТЬ
                          </button>
                        )}
                        {!ent && !isRented && (
                          <button
                            onClick={() => setOpenProductionPremisesId(premisesId)}
                            className="bg-[#8B5A3C] text-white px-3 py-1.5 font-mono text-xs font-bold hover:bg-[#73482F] transition"
                          >
                            ОТКРЫТЬ ПРОИЗВОДСТВО
                          </button>
                        )}
                        {!ent && isRented && (
                          <div className="font-mono text-[10px] text-[#C28B35] text-right">
                            Сдан в аренду.<br />Отменить в модалке помещения (Интернет → Недвижимость).
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ОФИСЫ */}
      {sub === 'offices' && (
        <div>
          {(() => {
            const ownedOffices = state.ownedProperty.filter((id) => {
              const def = REAL_ESTATE.find((r) => r.id === id);
              return def?.category === 'office';
            });

            if (ownedOffices.length === 0) {
              return (
                <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
                  У вас нет офисов. Купите в Агентстве недвижимости (Интернет → Недвижимость → Офисы).
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {ownedOffices.map((officeId) => {
                  const def = REAL_ESTATE.find((r) => r.id === officeId);
                  if (!def) return null;
                  const ent = state.enterprises.find(
                    (e) => e.premisesId === officeId && e.status !== 'closed',
                  );
                  const isHeadOffice = state.headOfficeId === officeId;
                  const mode = state.propertyMode[officeId] ?? 'personal';
                  const isRented = mode === 'rent';

                  return (
                    <div
                      key={officeId}
                      className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm text-[#332B2B]">{def.name}</div>
                          {ent && (
                            <span className="font-mono text-[10px] bg-[#4A7C59] text-white px-2 py-0.5">
                              ОФИСНАЯ КОМПАНИЯ
                            </span>
                          )}
                          {isHeadOffice && (
                            <span className="font-mono text-[10px] bg-[#8B5A3C] text-white px-2 py-0.5">
                              ГОЛОВНОЙ ОФИС
                            </span>
                          )}
                          {isRented && (
                            <span className="font-mono text-[10px] bg-[#C28B35] text-white px-2 py-0.5">
                              В АРЕНДЕ
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-[#776E64] mt-1">
                          📍 {def.address} · {def.area} м²
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {ent && (
                          <button
                            onClick={() => setManageEnterpriseId(ent.id)}
                            className="border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-1.5 font-mono text-xs font-bold text-[#332B2B] hover:bg-[#D8D0C4]/30 transition"
                          >
                            УПРАВЛЯТЬ
                          </button>
                        )}
                        {!ent && !isRented && (
                          <button
                            onClick={() => setOpenOfficeOfficeId(officeId)}
                            className="bg-[#8B5A3C] text-white px-3 py-1.5 font-mono text-xs font-bold hover:bg-[#73482F] transition"
                          >
                            ОТКРЫТЬ КОМПАНИЮ
                          </button>
                        )}
                        {!isHeadOffice && !isRented && (
                          <button
                            onClick={() => state.setHeadOffice(officeId)}
                            className="border border-[#8B5A3C] text-[#8B5A3C] px-3 py-1.5 font-mono text-xs font-bold hover:bg-[#8B5A3C] hover:text-white transition"
                          >
                            СДЕЛАТЬ ГОЛОВНЫМ
                          </button>
                        )}
                        {isHeadOffice && (
                          <button
                            onClick={() => state.setHeadOffice(null)}
                            className="border border-[#D8D0C4] text-[#776E64] px-3 py-1.5 font-mono text-xs font-bold hover:bg-[#D8D0C4]/30 transition"
                          >
                            СНЯТЬ ГОЛОВНОЙ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <OpenBusinessModal defId={openDefId} onClose={() => setOpenDefId(null)} />
      <ManageBusinessRuntimeModal instanceId={manageInstanceId} onClose={() => setManageInstanceId(null)} />
      <WarehouseModal warehouseId={warehouseModalId} onClose={() => setWarehouseModalId(null)} />
      <OpenProductionModal
        premisesId={openProductionPremisesId}
        onClose={() => setOpenProductionPremisesId(null)}
      />
      <OpenOfficeCompanyModal
        officeId={openOfficeOfficeId}
        onClose={() => setOpenOfficeOfficeId(null)}
      />
      <ManageEnterpriseModal
        enterpriseId={manageEnterpriseId}
        onClose={() => setManageEnterpriseId(null)}
      />
    </div>  );
}