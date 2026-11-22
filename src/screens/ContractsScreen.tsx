import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { RESOURCES_BY_ID } from '../data/resources';
import { formatMoney } from '../game/domain/money';
import { getMonthLabel } from '../game/simulation/clock';

type ContractTab = 'available' | 'active' | 'history';

const TABS: { id: ContractTab; label: string }[] = [
  { id: 'available', label: 'Доступные' },
  { id: 'active', label: 'Активные' },
  { id: 'history', label: 'История' },
];

export default function ContractsScreen() {
  const contracts = useGameStore((s) => s.contracts);
  const currentMonth = useGameStore((s) => Math.floor(s.totalGameMonths));
  const warehouses = useGameStore((s) => s.warehouses);
  const acceptContract = useGameStore((s) => s.acceptContract);
  const deliverContract = useGameStore((s) => s.deliverContract);

  const [tab, setTab] = useState<ContractTab>('available');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selectedWarehouses, setSelectedWarehouses] = useState<Record<string, string>>({});

  const { available, active, history } = useMemo(() => {
    return {
      available: contracts.filter((c) => c.status === 'available'),
      active: contracts.filter((c) => c.status === 'active'),
      history: contracts
        .filter((c) => c.status === 'completed' || c.status === 'failed')
        .sort((a, b) => b.createdAtMonth - a.createdAtMonth)
        .slice(0, 20),
    };
  }, [contracts]);

  const list = tab === 'available' ? available : tab === 'active' ? active : history;

  return (
    <div className="p-6 md:p-8 bg-[#FBF9F4] min-h-screen max-w-[1200px] mx-auto">
      
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#332B2B]">Контракты</h1>
        <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">
          Сделки с NPC-корпорациями
        </p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-6 border-b border-[#D8D0C4] mb-6">
        {TABS.map((t) => {
          const count = t.id === 'available' ? available.length : t.id === 'active' ? active.length : history.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
                tab === t.id
                  ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                  : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Список */}
      {list.length === 0 ? (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
          {tab === 'available' ? 'Нет доступных контрактов' : tab === 'active' ? 'Нет активных контрактов' : 'История пуста'}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((contract) => {
            const res = RESOURCES_BY_ID[contract.resourceId];
            const progress = contract.requiredQuantity > 0 ? contract.deliveredQuantity / contract.requiredQuantity : 0;
            const warehousesWithResource = warehouses.filter(
              (w) => (w.items[contract.resourceId]?.quantity ?? 0) > 0,
            );
            const selectedWhId =
              selectedWarehouses[contract.id] ??
              warehousesWithResource[0]?.id ??
              '';
            const selectedWh = warehouses.find((w) => w.id === selectedWhId);
            const onWarehouse = selectedWh?.items[contract.resourceId]?.quantity ?? 0;
            const qtyInput = quantities[contract.id] ?? '';

            const statusColor =
              contract.status === 'available' ? 'text-[#8B5A3C]' :
              contract.status === 'active' ? 'text-[#C28B35]' :
              contract.status === 'completed' ? 'text-[#4A7C59]' : 'text-[#A84A4A]';
            
            const statusLabel =
              contract.status === 'available' ? 'ДОСТУПЕН' :
              contract.status === 'active' ? 'ВЫПОЛНЯЕТСЯ' :
              contract.status === 'completed' ? 'ЗАВЕРШЕН' : 'ПРОВАЛЕН';

            return (
              <div key={contract.id} className="border border-[#D8D0C4] bg-[#F4F1EA]">
                <div className="p-5 flex items-start justify-between border-b border-[#D8D0C4]">
                  <div>
                    <div className="font-bold text-[#332B2B] text-lg">{contract.title}</div>
                    <div className="font-mono text-xs text-[#776E64] mt-1">{contract.description}</div>
                  </div>
                  <div className={`font-mono text-xs font-bold tracking-widest ${statusColor}`}>
                    {statusLabel}
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="data-label mb-1">Требуется</div>
                      <div className="data-value">{contract.requiredQuantity} {res?.unit ?? ''}</div>
                    </div>
                    <div>
                      <div className="data-label mb-1">Награда</div>
                      <div className="data-value text-[#4A7C59]">{formatMoney(contract.reward)}</div>
                    </div>
                    <div>
                      <div className="data-label mb-1">Срок</div>
                      <div className="data-value">{getMonthLabel(contract.deadlineMonth)}</div>
                    </div>
                  </div>

                  {contract.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between font-mono text-xs text-[#776E64] mb-1">
                        <span>Доставлено: {contract.deliveredQuantity} / {contract.requiredQuantity}</span>
                        <span>На складе: {onWarehouse}</span>
                      </div>
                      <div className="h-1 w-full bg-[#D8D0C4]">
                        <div className="h-full bg-[#4A7C59]" style={{ width: `${Math.min(100, progress * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {contract.status === 'available' && (
                    <button
                      type="button"
                      onClick={() => acceptContract(contract.id)}
                      className="mt-2 w-full bg-[#8B5A3C] py-3 font-mono text-sm font-bold text-white hover:bg-[#73482F] transition"
                    >
                      ПРИНЯТЬ КОНТРАКТ
                    </button>
                  )}

                  {contract.status === 'active' && (
                    <div className="space-y-2 mt-4">
                      {warehousesWithResource.length === 0 ? (
                        <div className="font-mono text-xs text-[#A84A4A]">
                          Нет склада с этим товаром
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedWhId}
                            onChange={(e) =>
                              setSelectedWarehouses((p) => ({ ...p, [contract.id]: e.target.value }))
                            }
                            className="w-full border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
                          >
                            {warehousesWithResource.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.customName} · {w.items[contract.resourceId]?.quantity ?? 0} {res?.unit ?? ''}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              max={contract.requiredQuantity - contract.deliveredQuantity}
                              value={qtyInput}
                              onChange={(e) => setQuantities((p) => ({ ...p, [contract.id]: e.target.value }))}
                              placeholder="Кол-во"
                              className="flex-1 border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
                            />
                            <button
                              type="button"
                              disabled={!qtyInput || Number(qtyInput) <= 0 || Number(qtyInput) > onWarehouse}
                              onClick={() => {
                                const result = deliverContract(contract.id, Number(qtyInput), selectedWhId);
                                if (result.ok) setQuantities((p) => ({ ...p, [contract.id]: '' }));
                              }}
                              className="border border-[#8B5A3C] px-6 py-2 font-mono text-sm font-bold text-[#8B5A3C] hover:bg-[#8B5A3C] hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8B5A3C]"
                            >
                              ДОСТАВИТЬ
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center font-mono text-xs text-[#776E64]">
        Текущий месяц: {getMonthLabel(currentMonth)} · Контракты обновляются ежемесячно
      </div>
    </div>
  );
}