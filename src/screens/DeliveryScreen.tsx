import { useGameStore } from '../game/store';
import { FOOD_ITEMS } from '../data/food';
import { formatMoney, moneyToNumber } from '../game/domain/money';

export default function DeliveryScreen() {
  const state = useGameStore();
  const inventory = state.personalInventory ?? {};
  const balance = moneyToNumber(state.balanceDecimal);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto bg-[#FBF9F4] min-h-screen">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-[#D8D0C4] pb-4">
        <div>
          <div>
  <h1 className="text-2xl font-bold text-[#332B2B] flex items-center gap-2">🛵 Доставка на дом</h1>
  <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">FreshMarket · FRMK</p>
</div>
          <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">
            Заказ еды и восстановление энергии
          </p>
        </div>
        <div className="font-mono text-sm text-[#776E64] bg-[#F4F1EA] px-4 py-2 border border-[#D8D0C4]">
          Энергия: <span className="font-bold text-[#332B2B]">{state.energy}/100</span>
        </div>
      </header>

      <h2 className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-4">Меню</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {FOOD_ITEMS.map((item) => {
          const canAfford = balance >= item.price;
          return (
            <div key={item.id} className="border border-[#D8D0C4] bg-[#F4F1EA] flex flex-col justify-between p-5">
              <div>
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-lg text-[#332B2B]">{item.name}</h3>
                <p className="font-mono text-xs text-[#776E64] mt-1 mb-3">{item.description}</p>
                <div className="font-mono text-sm text-[#4A7C59] font-semibold">
                  +{item.energyRestore} энергии
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[#D8D0C4] pt-4">
                <div className="font-mono text-lg font-bold text-[#332B2B]">{formatMoney(item.price)}</div>
                <button
                  disabled={!canAfford}
                  onClick={() => state.buyFoodItem(item.id, 1)}
                  className={`px-4 py-2 font-mono text-xs font-bold transition ${
                    canAfford
                      ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                      : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
                  }`}
                >
                  ЗАКАЗАТЬ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-4">Мой инвентарь</h2>
      {Object.keys(inventory).length === 0 ? (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
          Пока ничего не заказано.
        </div>
      ) : (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
          {Object.entries(inventory).map(([foodId, qty]) => {
            const def = FOOD_ITEMS.find((f) => f.id === foodId);
            if (!def) return null;
            return (
              <div key={foodId} className="flex items-center justify-between p-4 border-b border-[#D8D0C4] last:border-0">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{def.emoji}</div>
                  <div>
                    <div className="font-bold text-sm text-[#332B2B]">{def.name}</div>
                    <div className="font-mono text-xs text-[#776E64]">
                      × {qty} · +{def.energyRestore} энергии
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => state.consumeFoodItem(foodId)}
                  className="bg-[#4A7C59] text-white px-4 py-2 font-mono text-xs font-bold hover:bg-[#3d684a] transition"
                >
                  СЪЕСТЬ
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}