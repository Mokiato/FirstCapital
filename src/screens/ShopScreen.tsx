import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { RESOURCES, RESOURCES_BY_ID, type ResourceGroup } from '../data/resources';
import { formatMoney, moneyToNumber } from '../game/domain/money';

type ShopTab = 'catalog' | 'warehouse';
type GroupFilter = 'all' | ResourceGroup;
type CartMode = 'retail' | 'wholesale';
type CartTargetType = 'warehouse' | 'business';

const GROUP_TABS: { id: GroupFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'raw', label: 'Сырьё' },
  { id: 'goods', label: 'Продукция' },
  { id: 'fuel', label: 'Топливо' },
];

export default function ShopScreen() {
  const state = useGameStore();
  const [tab, setTab] = useState<ShopTab>('catalog');
  const [group, setGroup] = useState<GroupFilter>('all');

  // Корзина
  const [cart, setCart] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<CartMode>('retail');
  const [targetType, setTargetType] = useState<CartTargetType>('warehouse');
  const [targetWhId, setTargetWhId] = useState<string>(
    state.warehouses[0]?.id ?? '',
  );
  const [targetBizId, setTargetBizId] = useState<string>(
    state.businesses[0]?.id ?? '',
  );

  const filteredResources = useMemo(() => {
    const base = RESOURCES.filter((r) => r.group !== 'equipment' && r.group !== 'food');
    if (group === 'all') return base;
    return base.filter((r) => r.group === group);
  }, [group]);

  const balanceNum = moneyToNumber(state.balanceDecimal);

  // Итог по корзине
  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ resourceId: id, quantity: qty }));

  const selectedWh = state.warehouses.find((w) => w.id === targetWhId);
  const discount = mode === 'wholesale' && selectedWh?.hasTrucks ? 0.5 : mode === 'wholesale' ? 0.7 : 1;

  const totalCost = cartItems.reduce((sum, item) => {
    const res = RESOURCES_BY_ID[item.resourceId];
    return sum + Number(res?.basePrice ?? 0) * item.quantity * discount;
  }, 0);

  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (resourceId: string) => {
    setCart((prev) => ({
      ...prev,
      [resourceId]: (prev[resourceId] ?? 0) + 1,
    }));
  };

  const removeFromCart = (resourceId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[resourceId];
      return next;
    });
  };

  const changeQty = (resourceId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(resourceId);
      return;
    }
    setCart((prev) => ({ ...prev, [resourceId]: qty }));
  };

  const clearCart = () => setCart({});

  const handleCheckout = () => {
    const target =
      targetType === 'warehouse'
        ? { type: 'warehouse' as const, warehouseId: targetWhId }
        : { type: 'business' as const, businessId: targetBizId };

    const result = state.checkoutCart(cartItems, mode, target);
    if (result.ok) {
      clearCart();
    }
  };

  const canAfford = balanceNum >= totalCost;
  const canWholesale = state.warehouses.length > 0;
  const canCheckout =
    cartItems.length > 0 &&
    canAfford &&
    (mode === 'retail' || (mode === 'wholesale' && canWholesale)) &&
    (targetType === 'warehouse' ? !!targetWhId : !!targetBizId);

  return (
    <div className="p-6 md:p-8 bg-[#FBF9F4] min-h-screen max-w-[1400px] mx-auto">
      {/* Шапка */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#332B2B]">Оптовый магазин</h1>
          <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">Magistral Trade · MGTR</p>
        </div>
        <div className="font-mono text-sm text-[#776E64]">
          Свободно: <span className="font-bold text-[#332B2B]">{formatMoney(state.balanceDecimal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* ЛЕВО: Каталог */}
        <div>
          {/* Вкладки Магазин / Склад */}
          <div className="flex gap-6 border-b border-[#D8D0C4] mb-4">
            <button
              onClick={() => setTab('catalog')}
              className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
                tab === 'catalog'
                  ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                  : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
              }`}
            >
              Магазин
            </button>
            <button
              onClick={() => setTab('warehouse')}
              className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
                tab === 'warehouse'
                  ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                  : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
              }`}
            >
              Склад
            </button>
          </div>

          {/* МАГАЗИН */}
          {tab === 'catalog' && (
            <div>
              {/* Фильтры */}
              <div className="flex gap-4 mb-4">
                {GROUP_TABS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroup(g.id)}
                    className={`font-mono text-xs uppercase tracking-widest pb-1 border-b-2 transition ${
                      group === g.id
                        ? 'text-[#332B2B] font-bold border-[#8B5A3C]'
                        : 'text-[#776E64] border-transparent hover:text-[#332B2B]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Таблица товаров */}
              <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
                <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#D8D0C4] font-mono text-xs text-[#776E64] uppercase tracking-widest">
                  <div className="col-span-5">Наименование</div>
                  <div className="col-span-3">Цена / ед.</div>
                  <div className="col-span-2">В корзине</div>
                  <div className="col-span-2 text-right">Действие</div>
                </div>
                {filteredResources.map((res) => {
                  const inCart = cart[res.id] ?? 0;
                  return (
                    <div
                      key={res.id}
                      className="grid grid-cols-12 gap-4 items-center p-3 border-b border-[#D8D0C4] last:border-0 hover:bg-[#FBF9F4] transition"
                    >
                      <div className="col-span-5 font-bold text-[#332B2B] text-sm">{res.name}</div>
                      <div className="col-span-3 font-mono text-xs text-[#332B2B]">
                        {formatMoney(res.basePrice)} <span className="text-[#776E64]">/ {res.unit}</span>
                      </div>
                      <div className="col-span-2 font-mono text-xs text-[#776E64]">
                        {inCart > 0 ? <span className="text-[#8B5A3C] font-bold">{inCart}</span> : '—'}
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        {inCart > 0 && (
                          <button
                            onClick={() => changeQty(res.id, inCart - 1)}
                            className="w-7 h-7 border border-[#D8D0C4] text-[#776E64] hover:bg-[#D8D0C4]/30 font-bold"
                          >
                            −
                          </button>
                        )}
                        <button
                          onClick={() => addToCart(res.id)}
                          className="bg-[#8B5A3C] px-3 py-1 font-mono text-xs font-bold text-white hover:bg-[#73482F] transition"
                        >
                          + В КОРЗИНУ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* СКЛАД (только для справки) */}
          {tab === 'warehouse' && (
            <div className="space-y-4">
              {state.warehouses.length === 0 && (
                <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
                  У вас нет складов. Купите склад в Агентстве недвижимости.
                </div>
              )}
              {state.warehouses.map((wh) => {
                const used = Object.values(wh.items).reduce((s, i) => s + i.quantity, 0);
                const reserved = Object.values(wh.reserved ?? {}).reduce((s, v) => s + v, 0);
                return (
                  <div key={wh.id} className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
                    <div className="font-bold text-sm text-[#332B2B]">{wh.customName}</div>
                    <div className="font-mono text-[10px] text-[#776E64] mt-1">
                      {used} / {wh.capacity} мест {reserved > 0 && `· резерв ${reserved}`}
                    </div>
                    {Object.entries(wh.items).filter(([, item]) => item.quantity > 0).map(([resId, item]) => {
                      const res = RESOURCES_BY_ID[resId];
                      return (
                        <div key={resId} className="flex justify-between py-1 border-b border-[#D8D0C4] last:border-0 font-mono text-xs">
                          <span>{res?.name ?? resId}</span>
                          <span className="text-[#776E64]">{item.quantity} {res?.unit ?? ''}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ПРАВО: Корзина */}
        <div className="sticky top-4 h-fit">
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#D8D0C4]">
              <h2 className="font-bold text-sm text-[#332B2B]">Корзина ({cartItems.length})</h2>
              {cartItems.length > 0 && (
                <button onClick={clearCart} className="font-mono text-[10px] text-[#A84A4A] hover:underline">
                  ОЧИСТИТЬ
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center font-mono text-xs text-[#776E64] py-4">
                Корзина пуста
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-3">
                {cartItems.map((item) => {
                  const res = RESOURCES_BY_ID[item.resourceId];
                  return (
                    <div key={item.resourceId} className="flex justify-between items-center font-mono text-xs">
                      <div className="flex-1">
                        <div className="text-[#332B2B]">{res?.name}</div>
                        <div className="text-[10px] text-[#776E64]">
                          {item.quantity} × {formatMoney((Number(res?.basePrice) * discount).toFixed(0))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeQty(item.resourceId, item.quantity - 1)}
                          className="w-6 h-6 border border-[#D8D0C4] text-[#776E64]"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[#332B2B]">{item.quantity}</span>
                        <button
                          onClick={() => changeQty(item.resourceId, item.quantity + 1)}
                          className="w-6 h-6 border border-[#D8D0C4] text-[#776E64]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Параметры оформления */}
            {cartItems.length > 0 && (
              <div className="space-y-3 border-t border-[#D8D0C4] pt-3">
                {/* Режим */}
                <div>
                  <div className="data-label mb-1">Режим покупки</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setMode('retail')}
                      className={`py-1.5 font-mono text-[10px] font-bold border ${
                        mode === 'retail'
                          ? 'bg-[#8B5A3C] text-white border-[#8B5A3C]'
                          : 'bg-[#FBF9F4] text-[#776E64] border-[#D8D0C4]'
                      }`}
                    >
                      РОЗНИЦА
                    </button>
                    <button
                      onClick={() => setMode('wholesale')}
                      disabled={!canWholesale}
                      className={`py-1.5 font-mono text-[10px] font-bold border disabled:opacity-40 disabled:cursor-not-allowed ${
                        mode === 'wholesale'
                          ? 'bg-[#8B5A3C] text-white border-[#8B5A3C]'
                          : 'bg-[#FBF9F4] text-[#776E64] border-[#D8D0C4]'
                      }`}
                    >
                      ОПТ (−{discount === 1 ? '0' : Math.round((1 - discount) * 100)}%)
                    </button>
                  </div>
                </div>

                {/* Куда */}
                <div>
                  <div className="data-label mb-1">Куда доставить</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setTargetType('warehouse')}
                      className={`py-1.5 font-mono text-[10px] font-bold border ${
                        targetType === 'warehouse'
                          ? 'bg-[#8B5A3C] text-white border-[#8B5A3C]'
                          : 'bg-[#FBF9F4] text-[#776E64] border-[#D8D0C4]'
                      }`}
                    >
                      СКЛАД
                    </button>
                    <button
                      onClick={() => setTargetType('business')}
                      className={`py-1.5 font-mono text-[10px] font-bold border ${
                        targetType === 'business'
                          ? 'bg-[#8B5A3C] text-white border-[#8B5A3C]'
                          : 'bg-[#FBF9F4] text-[#776E64] border-[#D8D0C4]'
                      }`}
                    >
                      БИЗНЕС
                    </button>
                  </div>
                  {targetType === 'warehouse' ? (
                    state.warehouses.length === 0 ? (
                      <div className="text-[10px] font-mono text-[#A84A4A] mt-1">Нет складов</div>
                    ) : (
                      <select
                        value={targetWhId}
                        onChange={(e) => setTargetWhId(e.target.value)}
                        className="w-full mt-1 border border-[#D8D0C4] bg-[#FBF9F4] px-2 py-1 font-mono text-xs text-[#332B2B] outline-none focus:border-[#8B5A3C]"
                      >
                        {state.warehouses.map((w) => {
                          const used = Object.values(w.items).reduce((s, i) => s + i.quantity, 0);
                          const reserved = Object.values(w.reserved ?? {}).reduce((s, v) => s + v, 0);
                          const free = w.capacity - used - reserved;
                          return (
                            <option key={w.id} value={w.id}>
                              {w.customName} {w.hasTrucks ? '🚚' : ''} (свободно {free})
                            </option>
                          );
                        })}
                      </select>
                    )
                  ) : (
                    state.businesses.length === 0 ? (
                      <div className="text-[10px] font-mono text-[#A84A4A] mt-1">Нет бизнесов</div>
                    ) : (
                      <select
                        value={targetBizId}
                        onChange={(e) => setTargetBizId(e.target.value)}
                        className="w-full mt-1 border border-[#D8D0C4] bg-[#FBF9F4] px-2 py-1 font-mono text-xs text-[#332B2B] outline-none focus:border-[#8B5A3C]"
                      >
                        {state.businesses.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )
                  )}
                </div>

                {/* Итог */}
                <div className="border-t border-[#D8D0C4] pt-2">
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-[#776E64]">Позиций</span>
                    <span className="text-[#332B2B]">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="text-[#776E64]">Всего единиц</span>
                    <span className="text-[#332B2B]">{totalQty}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm mt-2">
                    <span className="text-[#332B2B] font-bold">Итого</span>
                    <span className={`font-bold ${canAfford ? 'text-[#332B2B]' : 'text-[#A84A4A]'}`}>
                      {formatMoney(totalCost.toFixed(0))}
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canCheckout}
                  onClick={handleCheckout}
                  className={`w-full py-2 font-mono text-sm font-bold transition ${
                    canCheckout
                      ? 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                      : 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed'
                  }`}
                >
                  {!canAfford ? 'НЕТ ДЕНЕГ' : 'ОФОРМИТЬ ЗАКАЗ'}
                </button>
                <div className="text-[10px] font-mono text-[#776E64] text-center">
                  {mode === 'wholesale' && selectedWh?.hasTrucks
                    ? 'Доставка мгновенная (грузовик)'
                    : 'Доставка через 1 месяц'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}