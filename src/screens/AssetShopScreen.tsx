import { useState } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '../game/store';
import { REAL_ESTATE_BY_CATEGORY } from '../data/realEstate';
import { TRANSPORT } from '../data/transport';
import { formatMoney } from '../game/domain/money';

type ShopMode = 'car' | 'realestate' | 'yacht' | 'plane';
type RealEstateTab = 'apartment' | 'office' | 'house' | 'warehouse' | 'industrial';

export default function AssetShopScreen({ mode }: { mode: ShopMode }) {
  const state = useGameStore();
  const [reTab, setReTab] = useState<RealEstateTab>('apartment');

  const titles: Record<ShopMode, { title: string; sub: string }> = {
    car: { title: 'Автосалон', sub: 'MechWorks · MCWK' },
    realestate: { title: 'Агентство недвижимости', sub: 'KvartiraPlus · KVPL' },
    yacht: { title: 'Магазин яхт', sub: 'TitanMarine · TMRN' },
    plane: { title: 'Магазин самолётов', sub: 'AeroLux · ARLX' },
  };

  let items: any[] = [];
  if (mode === 'car') items = TRANSPORT.filter(t => t.category === 'ground');
  if (mode === 'yacht') items = TRANSPORT.filter(t => t.category === 'water');
  if (mode === 'plane') items = TRANSPORT.filter(t => t.category === 'air' || t.category === 'space');
  if (mode === 'realestate') items = REAL_ESTATE_BY_CATEGORY[reTab];

  const handleBuy = (id: string, price: number, name: string) => {
    if (Number(state.balanceDecimal) < price) {
      toast.error('Недостаточно средств');
      return;
    }
    const result = mode === 'realestate' ? state.buyProperty(id) : state.buyTransport(id);
    if (result === undefined || (result && (result as any).ok)) {
      toast.success(`Куплено: ${name}`);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto bg-[#FBF9F4] min-h-screen">
      <div className="flex justify-between items-end mb-6 border-b border-[#D8D0C4] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#332B2B]">{titles[mode].title}</h1>
          <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">{titles[mode].sub}</p>
        </div>
        <div className="font-mono text-sm text-[#776E64]">
          Баланс: <span className="font-bold text-[#332B2B]">{formatMoney(state.balanceDecimal)}</span>
        </div>
      </div>

      {/* Вкладки для недвижимости */}
      {mode === 'realestate' && (
        <div className="flex gap-6 border-b border-[#D8D0C4] mb-6">
          {([
            ['apartment', 'Квартиры'],
            ['office', 'Офисы'],
            ['house', 'Дома'],
            ['warehouse', 'Склады'],
            ['industrial', 'Промпомещения'],
          ] as [RealEstateTab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setReTab(id)}
              className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
                reTab === id
                  ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                  : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
              }`}
            >
              {label} ({REAL_ESTATE_BY_CATEGORY[id].length})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isOwned = mode === 'realestate'
            ? state.ownedProperty.includes(item.id)
            : state.ownedTransport.includes(item.id);
          const canAfford = state.balance >= item.price;

          return (
            <div key={item.id} className="border border-[#D8D0C4] bg-[#F4F1EA] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{item.emoji}</div>
                  <div>
                    <h3 className="text-base font-bold text-[#332B2B]">{item.name}</h3>
                    {mode === 'realestate' && (
                      <div className="font-mono text-[10px] text-[#776E64] uppercase tracking-widest">
                        {item.area} м²{item.rooms > 0 ? ` · ${item.rooms} комн.` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {mode === 'realestate' ? (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-[#332B2B] leading-relaxed border-l-2 border-[#D8D0C4] pl-2">
                      {item.description}
                    </p>
                    <div className="font-mono text-[10px] text-[#776E64] mt-2 leading-tight">
                      📍 {item.address}
                    </div>
                    <div className="font-mono text-xs text-[#4A7C59] mt-2">
                      Сдача в аренду: <span className="font-bold">{formatMoney(item.rentalIncome)}</span> / мес
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 mt-2">
                    <div className="font-mono text-xs text-[#C28B35]">−{item.offlineBonusPercent}% к кулдауну сделки</div>
                    <div className="font-mono text-xs text-[#8B5A3C]">+{item.reputation.toLocaleString('ru-RU')} репутации</div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-[#D8D0C4] pt-4">
                <div className="font-mono text-lg font-bold text-[#332B2B] mb-3">{formatMoney(item.price)}</div>
                <button
                  disabled={isOwned || !canAfford}
                  onClick={() => handleBuy(item.id, item.price, item.name)}
                  className={`w-full py-2 font-mono text-sm font-bold transition ${
                    isOwned
                      ? 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
                      : canAfford
                        ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                        : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
                  }`}
                >
                  {isOwned ? 'КУПЛЕНО' : canAfford ? 'КУПИТЬ' : 'НЕТ СРЕДСТВ'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
          Объектов в этой категории пока нет.
        </div>
      )}
    </div>
  );
}