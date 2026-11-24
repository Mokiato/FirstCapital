import { create } from 'zustand';
import { toast } from 'sonner';
import type { Quest } from '../types';
import { CAREERS_BY_ID } from '../data/careers';
import { useClockStore } from './simulation/clockStore';
import { getMonthLabel } from './simulation/clock';
import { tickMarket } from './market/marketEngine';
import { getCompanyPriceMultiplier } from './events/eventEngine';
import {
  getNpcUnitPrice,
  getB2BUnitPrice,
  getDumpUnitPrice,
  getExternalDeliveryFee,
  type PriceContext,
} from './economy/pricing';
import { isFleetOperational, settleFleetInvoice } from './logistics/fleet';
import {
  buildCapexPlan,
  getCapexPackage,
  getCapexDiscount,
  consumeCapexFromWarehouses,
} from './economy/capex';
import { REAL_ESTATE } from '../data/realEstate';
import { TRANSPORT } from '../data/transport';
import { runMonthlyProcessors } from './simulation/processors';
import { calculateCapital } from './economy/capital';
import { buildMarketCompanies } from './market/build';
import { BALANCE } from './config/balance';
import { BUSINESSES } from '../data/businesses';
import { PRODUCTIONS_BY_ID } from '../data/productions';
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import { buyShares, sellShares, type TradePolicy } from './market/trading';
import { getOfficeBonuses } from './selectors';
import { TAXES } from './config/taxes';
import { EMPLOYEE_ROLES_BY_ID, isManagementRole, computeWorkerSalaries } from '../data/employees';
import { getRemainingNpcDemand } from './economy/npcDemand';
import type {
  WarehouseRuntime, WarehouseEmployee, WarehouseRole, RentalOffer, RentedProperty,
} from './domain/warehouseTypes';
import type { EnterpriseRuntime } from './domain/enterpriseTypes';
import type {
  Money, CapitalSnapshot, BusinessRuntime, Warehouse, PendingDelivery,
  ActiveEvent, NewsItem, ContractRuntime, MarketCompany, StockPosition,
  LoanRuntime, FundPosition, BondPosition, MetalPosition, FixedDeposit,
} from './domain/types';
import {
  hireEmployee as hireEmployeeEngine,
  dismissEmployee as dismissEmployeeEngine,
} from './staff/employeeEngine';
import { acceptContract as acceptContractEngine, deliverContractGoods } from './contracts/contractEngine';
import type { EmployeeRuntime, EmployeeRole } from './domain/types';
import {
  businessDefToRuntime,
  findDefForRuntime,
} from './business/adapters';
import { RESOURCES_BY_ID } from '../data/resources';
import { FOOD_ITEMS_BY_ID } from '../data/food';
import {
  createLoan,
  repayLoanEarly as repayLoanEarlyEngine,
} from './finance/creditEngine';
import {
  addMoneyToFund,
  withdrawFromFund as withdrawFromFundEngine,
} from './finance/investmentEngine';
import {
  FUND_DEFINITIONS_BY_ID,
  BOND_DEFINITIONS_BY_ID,
  getMetalDef,
  createMetalPosition,
} from './finance/adapters';
import { creditBandFor } from './config/credit';
import {
  moneyAdd,
  moneySub,
  moneyToNumber,
  toDecimal,
  formatMoney,
} from './domain/money';
import {
  getCompanyLevel,
  getCompanyRating,
  type RatingRow,
  type SelectorState,
} from './selectors';
import type { CompetitorRuntime, CareerProgress } from './domain/types';
import { ACHIEVEMENTS, pickDailyQuests, QUEST_POOL } from './questsAndAchievements';
import { saveToStorage } from './persistence/save';
import { browserStorage } from './persistence/browserStorage';
import {
  applyWalletTransaction,
  type LedgerEntry,
  type LedgerDirection,
} from './economy/ledger';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface Notification {
  id: string;
  text: string;
  timestamp: number;
}
export interface GameState extends SelectorState {
  companyName: string;
  avatarEmoji: string;
  balance: number;
  /** Decimal-версия баланса. Единственный источник правды для денег. */
  balanceDecimal: Money;
  /** Журнал финансовых операций игрока (основной кошелёк). */
  financeJournal: LedgerEntry[];
  /** Сколько последних месяцев журнала хранить. */
  financeJournalKeepMonths: number;
  totalGameMonths: number;
  bitcoins: number;
  bankDeposit: number;
  totalEarned: number;
  lifetimeGames: number;
  lifetimeUpgrades: number;
  savingsBalance: Money; // Накопительный счёт
  fixedDeposits: FixedDeposit[]; // До 10 штук
  registeredAt: number;
  quests: Quest[];
  questsDate: string;
  achievementsClaimed: string[];
  settings: { theme: 'dark' | 'light'; sound: boolean; haptics: boolean };
  notifications: Notification[];
  // TODO(Блок 1): удалить оффлайн-доход. ТЗ запрещает оффлайн-прогресс.
  // Рефакторинг store, удаление полей и связанного UI — Блок 1.
  favoriteBusinesses: string[];

  // ========== НОВОЕ (Блок 3: Статистика) ==========
  /** Снимки капитала по завершённым игровым месяцам. Хранится до 120 месяцев. */
  capitalSnapshots: CapitalSnapshot[];
    // ========== НОВОЕ (Блок 4: Бизнесы) ==========
  /** Рантайм-состояние бизнесов (новые BusinessRuntime). */
  businesses: BusinessRuntime[];
    /** Все склады игрока (малый, средний, большой, огромный). */
  warehouses: WarehouseRuntime[];
    /** Все производства и офисные компании игрока. */
  enterprises: EnterpriseRuntime[];
  /** ID купленного офиса, назначенного головным (или null). */
  headOfficeId: string | null;

  /** Режим использования недвижимости: personal | rent. */
  propertyMode: Record<string, 'personal' | 'rent'>;

  /** Активные предложения арендаторов (пока игрок не выбрал). */
  activeRentalOffers: Record<string, RentalOffer[]>;

  /** Сданные в аренду объекты. */
  rentedProperties: Record<string, RentedProperty>;
    /** Отложенные доставки ресурсов (прибывают в указанный игровой месяц). */
  pendingDeliveries: PendingDelivery[];
    // ========== НОВОЕ (Блок 7: Сотрудники) ==========
  /** Все сотрудники, привязанные к бизнесам. */
  employees: EmployeeRuntime[];
    /** Игра окончена (банкротство после ликвидации активов). */
  gameOver: boolean;
  /** Сколько единиц каждого ресурса NPC купил в текущем игровом месяце. */
  monthlyNpcSold: Record<string, number>;

  /** Макроэкономический индекс рынка 0.90–1.10 (GDD §5.1). */
  marketIndex: number;

  /** Нанять сотрудника на бизнес. Возвращает { ok, reason }. */
  hireEmployee: (businessId: string, role: EmployeeRole) => { ok: boolean; reason?: string };
  // ========== УПРАВЛЕНИЕ СКЛАДАМИ ==========
  renameWarehouse: (warehouseId: string, name: string) => void;
  hireWarehouseEmployee: (warehouseId: string, role: WarehouseRole) => { ok: boolean; reason?: string };
  dismissWarehouseEmployee: (warehouseId: string, employeeId: string) => void;
  buyWarehouseTruck: (warehouseId: string) => { ok: boolean; reason?: string };
    /** Устранить событие на складе (заплатить стоимость ремонта). */
  resolveWarehouseEvent: (warehouseId: string) => { ok: boolean; reason?: string };
  /** Продать ресурс со склада: B2B 0.90× в пределах спроса, слив 0.45× сверх. */
  sellResourceFromWarehouse: (warehouseId: string, resourceId: string, quantity: number) => { ok: boolean; reason?: string; total?: string };

  /** Оплатить счёт за обслуживание своего парка (расходники fuel/parts/lubricants). */
  payFleetInvoice: (warehouseId: string) => { ok: boolean; reason?: string };
    // ========== ПРОИЗВОДСТВА И ОФИСНЫЕ КОМПАНИИ ==========
  /** Открыть производство в купленном промпомещении. */
  openProduction: (premisesId: string, productionId: string) => { ok: boolean; reason?: string };
  /** Открыть офисную компанию в купленном офисе. */
  openOfficeCompany: (officeId: string, companyId: string) => { ok: boolean; reason?: string };
  /** Закрыть производство или офисную компанию (помещение остаётся у игрока). */
  closeEnterprise: (enterpriseId: string) => { ok: boolean; reason?: string };
  /** Назначить головной офис (или снять, передав null). */
  setHeadOffice: (officeId: string | null) => void;
  /** Распределение продукции производства: resourceId → {toWarehouse, toSell}. */
  setProductionDistribution: (
    enterpriseId: string,
    resourceId: string,
    toWarehouse: number,
    toSell: number,
  ) => void;
    /** Нанять сотрудника в предприятие (производство или офисную компанию). */
  hireEnterpriseEmployee: (
    enterpriseId: string,
    role: EmployeeRole,
  ) => { ok: boolean; reason?: string };
    linkWarehouseToEnterprise: (enterpriseId: string, warehouseId: string) => { ok: boolean; reason?: string };
  unlinkWarehouseFromEnterprise: (enterpriseId: string) => void;
  /** Уволить сотрудника предприятия. */
  dismissEnterpriseEmployee: (employeeId: string) => void;
    /** Привязать бизнес к складу (для опта и автоматизации). */
  linkWarehouseToBusiness: (businessId: string, warehouseId: string) => { ok: boolean; reason?: string };
  /** Отвязать бизнес от склада (вернуть к рознице). */
  unlinkWarehouseFromBusiness: (businessId: string) => void;

  // ========== АРЕНДА НЕДВИЖИМОСТИ ==========
  togglePropertyMode: (propertyId: string) => void;
  findTenants: (propertyId: string) => void;
  acceptTenant: (propertyId: string, offerId: string) => { ok: boolean; reason?: string };
  evictTenant: (propertyId: string) => { ok: boolean; reason?: string };
  /** Уволить сотрудника по id. */
  dismissEmployee: (employeeId: string) => void;
    // ========== НОВОЕ (Блок 8: События и контракты) ==========
  /** Активные события (с датой окончания). */
  activeEvents: ActiveEvent[];
  /** Новостная лента (хранится 12 игровых месяцев). */
  news: NewsItem[];
  /** Все контракты (доступные / активные / завершённые / проваленные). */
  contracts: ContractRuntime[];

  /** Принять контракт (available → active). */
  acceptContract: (contractId: string) => void;
  /** Доставить товар по контракту с указанного склада. */
  deliverContract: (
    contractId: string,
    quantity: number,
    warehouseId: string,
  ) => { ok: boolean; reason?: string; deliveredNow?: number; completed?: boolean };

  /** Обработать прибытие доставок к указанному месяцу. Вызывается из onCompletedMonths. */
  tickDeliveries: (currentMonth: number) => void;

  /** Открыть бизнес по defId. premisesMode — rent или owned. */
  openBusiness: (
    defId: string,
    premisesMode: 'rent' | 'owned',
    operatingCapital: number,
  ) => { ok: boolean; reason?: string };

  /** Повысить уровень бизнеса (улучшение). */
  upgradeBusinessRuntime: (instanceId: string) => { ok: boolean; reason?: string };

  /** Перевести деньги из бизнеса в основной кошелёк. */
  withdrawFromBusiness: (instanceId: string, amount: number) => { ok: boolean; reason?: string };
    /** Пополнить кассу бизнеса из кошелька игрока. */
  addToBusinessCash: (instanceId: string, amount: number) => { ok: boolean; reason?: string };
    /** Оформить корзину из Оптового магазина. mode: 'retail' | 'wholesale'. */
  checkoutCart: (
    items: Array<{ resourceId: string; quantity: number }>,
    mode: 'retail' | 'wholesale',
    target: { type: 'warehouse'; warehouseId: string } | { type: 'business'; businessId: string },
  ) => { ok: boolean; reason?: string; total?: string };
  /** Захватить снимок текущего капитала за текущий игровой месяц. */
  captureCapitalSnapshot: () => void;
  
  // ========== Игровое время (GDD v2.0 §3.1: 1 ход = 1 месяц) ==========
  onCompletedMonths: (completedMonths: number[]) => void;

  /** Завершить текущий месяц: Фаза 3 (закрытие) → Фаза 1 (новый месяц, рынок). */
  endTurn: () => void;

  /** Месячная переоценка акций. Один вызов на ход (из endTurn). */
  tickMarketPrices: () => void;    // ========== НОВОЕ (Блок 9: Новый рынок акций) ==========
  /** Полноценный рынок 80 компаний (MarketCompany из domain). */
  marketCompanies: MarketCompany[];
  /** Индекс последнего месячного тика рынка (== totalGameMonths на момент тика). */
  lastMarketTickIndex: number;    // ========== НОВОЕ (Блок 10: Конкуренты и рейтинг) ==========
  /** Активные NPC-конкуренты (не более 20). */
  competitors: CompetitorRuntime[];
  /** Кредиты игрока (активные, погашенные, дефолтные). */
  loans: LoanRuntime[];
  /** Кредитный рейтинг (0–1000). */
  creditScore: number;
    // ========== НОВОЕ (Блок 12: Фонды, облигации, металлы) ==========
  funds: FundPosition[];
  bonds: BondPosition[];
  metals: MetalPosition[];

  /** Пополнить фонд. */
  buyFund: (
    fundId: string,
    amount: number,
  ) => { ok: boolean; reason?: string };

  /** Вывести средства из фонда. */
  withdrawFund: (
    fundId: string,
    amount: number,
  ) => { ok: boolean; reason?: string };

  /** Купить облигации. */
  buyBond: (
    bondId: string,
    quantity: number,
  ) => { ok: boolean; reason?: string };

  /** Купить металл на сумму (в рублях). */
  buyMetal: (
    metalId: string,
    amount: number,
  ) => { ok: boolean; reason?: string };

  /** Продать металл. */
  sellMetal: (
    metalId: string,
    quantity: number,
  ) => { ok: boolean; reason?: string };

  /** Месячная прибыль игрока (база для расчёта кредитного лимита). */
  getMonthlyProfit: () => Money;

  /** Коэффициент лимита по текущему рейтингу. */
  getCreditRatingCoefficient: () => number;
  /** Пополнить накопительный счёт. */
  depositToSavings: (amount: number) => { ok: boolean; reason?: string };
  /** Снять с накопительного счёта (проценты сохраняются). */
  withdrawFromSavings: (amount: number) => { ok: boolean; reason?: string };
  /** Открыть срочный вклад (max 10 активных). */
  openFixedDeposit: (amount: number, termMonths: number) => { ok: boolean; reason?: string };
  /** Закрыть срочный вклад досрочно (только тело, без %). */
  closeFixedDeposit: (id: string) => { ok: boolean; reason?: string };
  /** Взять кредит. Возвращает { ok, reason } или { ok, loan }. */
  applyForLoan: (
    amount: number,
    termMonths: number,
  ) => { ok: boolean; reason?: string };

  /** Досрочно погасить активный кредит. */
  repayLoanEarly: () => { ok: boolean; reason?: string };

  /** Текущий чистый капитал игрока (Money). */
  getPlayerCapital: () => Money;

  /** Рейтинг: игрок + топ-N компаний по капиталу. */
  getCompanyRating: (limit?: number) => RatingRow[];
  /** Портфель игрока в новой модели. */
  marketPositions: StockPosition[];
  /** Индекс минутного тика (для истории PricePoint). */
  marketTickMinuteIndex: number;

  /** Купить акции по companyId (новый метод). */
  buyShares: (companyId: string, shares: number) => { ok: boolean; reason?: string };
  /** Продать акции по companyId. */
  sellShares: (companyId: string, shares: number) => { ok: boolean; reason?: string; profit?: string };
  // TODO(Блок 1): удалить бустеры. ТЗ запрещает бустеры в игре.
  // Рефакторинг store, удаление полей и связанного UI — Блок 1.

  // actions  // TODO(Блок 1): удалить оффлайн-доход. ТЗ запрещает оффлайн-прогресс.
  // Рефакторинг store, удаление полей и связанного UI — Блок 1.
  buyProperty: (id: string) => void;
  buyTransport: (id: string) => void;
  claimQuest: (id: string) => void;
  claimAchievement: (id: string) => void;
  setCompanyName: (name: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSetting: (key: 'sound' | 'haptics') => void;
  setSetting: <K extends keyof GameState['settings']>(
    key: K,
    value: GameState['settings'][K]
  ) => void;
  toggleFavorite: (id: string) => void;
  currentCareerId: string | null;
careerProgress: Record<string, CareerProgress>;
  energy: number;
lastRestMonth: number;
  /** Личный инвентарь: { foodId: quantity }. Отдельно от склада бизнесов. */
  personalInventory: Record<string, number>;
changeCareer: (careerId: string) => void;
workCareer: () => { ok: boolean; reason?: string };
rest: () => { ok: boolean; reason?: string };
  /** Купить блюдо в «Доставке на дом» (кладёт в личный инвентарь). */
  buyFoodItem: (foodId: string, quantity: number) => { ok: boolean; reason?: string };
  /** Съесть блюдо из инвентаря — восстанавливает энергию. */
  consumeFoodItem: (foodId: string) => { ok: boolean; reason?: string };
  pushNotification: (text: string) => void;
  dismissNotification: (id: string) => void;
  refreshQuestsIfNeeded: () => void;

  // DevTools actions
  addBalance: (amount: number) => void;
  hardReset: () => void;
    /** Записать доход/расход игрока. Обновляет balanceDecimal, balance и журнал. */
  recordTransaction: (input: {
    direction: LedgerDirection;
    amount: Money | number;
    category: string;
    description: string;
    allowNegative?: boolean;
    relatedEntityId?: string;
  }) => { ok: boolean; reason?: string };

  /** Получить доход/расход за месяц из журнала. */
  getMonthLedger: (monthIndex: number) => {
    income: Money;
    expenses: Money;
    net: Money;
    entries: LedgerEntry[];
  };
    /** Доход/расход за месяц, сгруппированные по категориям. */
  getMonthLedgerByCategory: (monthIndex: number) => {
    income: Record<string, Money>;
    expenses: Record<string, Money>;
  };
  
  // ========== НОВОЕ (Блок 1: Игровое время) ==========
  /** Возвращает payload сохранения (все данные без функций). */
  getSavePayload: () => Record<string, unknown>;
  saveGame: () => void;
  loadGame: (saveData: any) => void;
}

const TRADE_POLICY: TradePolicy = {
  commissionRate: TAXES.brokerFee,
  capitalGainsTaxRate: TAXES.realizedStockProfit,
};
/**
 * Взвешенный выбор награды из пула кейса.
 * Возвращает { type, amount, cosmeticId? } или null.
 */
export const useGameStore = create<GameState>()((set, get) => ({
  companyName: 'Моя Империя',
  avatarEmoji: '🏢',
  balance: 100_000,
  balanceDecimal: '100000',
  financeJournal: [],
  financeJournalKeepMonths: 24,
  bitcoins: 0,
  bankDeposit: 0,
  totalEarned: 0,
  lifetimeGames: 0,
  lifetimeUpgrades: 0,
  registeredAt: Date.now(),
  ownedProperty: [],
  ownedTransport: [],
  quests: pickDailyQuests(Date.now()),
  questsDate: todayKey(),
  achievementsClaimed: [],
  settings: { theme: 'dark', sound: true, haptics: true },
  notifications: [],
  // TODO(Блок 1): удалить оффлайн-доход. ТЗ запрещает оффлайн-прогресс.
  // Рефакторинг store, удаление полей и связанного UI — Блок 1.
  favoriteBusinesses: [],
  currentCareerId: null,
  careerProgress: {},
  energy: 100,
  lastRestMonth: -1,
  personalInventory: {},
  capitalSnapshots: [],
  businesses: [],
  warehouses: [],
  propertyMode: {},
  activeRentalOffers: {},
  rentedProperties: {},
  enterprises: [],
  headOfficeId: null,
  pendingDeliveries: [],
  employees: [],
  activeEvents: [],
  news: [],
  contracts: [],
  marketCompanies: buildMarketCompanies(),
  marketPositions: [],
  marketTickMinuteIndex: 0,
  competitors: [],
  loans: [],
  creditScore: 100,
  funds: [],
  bonds: [],
  metals: [],
  // TODO(Блок 1): удалить бустеры. ТЗ запрещает бустеры в игре.
  // Рефакторинг store, удаление полей и связанного UI — Блок 1.
  totalGameMonths: 0,
  lastMarketTickIndex: 0,
  savingsBalance: '0',
  fixedDeposits: [],
  gameOver: false,
  monthlyNpcSold: {},
  marketIndex: 1,

  pushNotification: (text) =>
    set((s) => ({
      notifications: [{ id: `${Date.now()}_${Math.random()}`, text, timestamp: Date.now() }, ...s.notifications].slice(0, 30),
    })),

  // ========== БЛОК 1: Обработка завершения игровых месяцев ==========
onCompletedMonths: (completedMonths) => {
  if (completedMonths.length === 0) return;

  const targetMonth = Math.max(...completedMonths);
  // ВАЖНО: обновляем месяц ДО процессоров, чтобы recordTransaction,
  // captureCapitalSnapshot и cooldown'ы (работа, отдых, контракты, кредиты)
  // работали с правильным monthIndex.
  set({ totalGameMonths: targetMonth });

  get().tickDeliveries(targetMonth);

  const next = runMonthlyProcessors(get(), completedMonths);
  set(next);

  get().captureCapitalSnapshot();
},
  // ========== ХОД ИГРОКА (GDD v2.0 §3.1–3.3) ==========
  // Кнопка «Завершить месяц»: Фаза 3 — закрытие месяца через процессоры,
  // затем Фаза 1 — новый месяц: месячная переоценка акций, автосохранение.
  endTurn: () => {
    const s = get();
    if (s.gameOver) return;

    const closedMonth = useClockStore.getState().nextMonth();
    get().onCompletedMonths([closedMonth]);
    get().tickMarketPrices();
    get().saveGame();

    toast.success(getMonthLabel(closedMonth), {
      description: 'Месяц закрыт. Отчёты и рынок обновлены.',
    });
  },

  // ========== БЛОК 9: Месячный тик рынка (12 тиков/год, GDD §3.1) ==========
  tickMarketPrices: () => {
    const s = get();
    const monthIndex = s.totalGameMonths;

    // Не более одного тика на игровой месяц.
    if (monthIndex <= s.lastMarketTickIndex) return;

    const companySignals: Record<string, number> = {};
    for (const c of s.marketCompanies) {
      const mult = getCompanyPriceMultiplier(s.activeEvents, c.id, monthIndex);
      if (mult !== 1) companySignals[c.id] = mult - 1;
    }

    const nextCompanies = tickMarket(s.marketCompanies, {
      minuteIndex: monthIndex,
      monthIndex,
      companySignals,
    });
    set({
      marketCompanies: nextCompanies,
      lastMarketTickIndex: monthIndex,
      marketTickMinuteIndex: monthIndex,
    });
  },  // ========== БЛОК 1: Загрузка сохранения ==========
  getSavePayload: () => {
    const s = get();
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(s)) {
      const value = (s as unknown as Record<string, unknown>)[key];
      if (typeof value !== 'function') {
        payload[key] = value;
      }
    }
    return payload;
  },
    // ========== ВКЛАДЫ ==========
  depositToSavings: (amount) => {
    const s = get();
    if (amount <= 0) return { ok: false, reason: 'Сумма должна быть больше 0' };
    if (moneyToNumber(s.balanceDecimal) < amount) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount,
      category: 'savings_deposit',
      description: 'Пополнение накопительного счёта',
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      savingsBalance: moneyAdd(st.savingsBalance, String(amount)),
    }));
    return { ok: true };
  },

  withdrawFromSavings: (amount) => {
    const s = get();
    if (amount <= 0) return { ok: false, reason: 'Сумма должна быть больше 0' };
    if (Number(s.savingsBalance) < amount) {
      return { ok: false, reason: 'Недостаточно на счёте' };
    }

    const tx = get().recordTransaction({
      direction: 'income',
      amount,
      category: 'savings_withdraw',
      description: 'Снятие с накопительного счёта',
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      savingsBalance: moneySub(st.savingsBalance, String(amount)),
    }));
    return { ok: true };
  },

  openFixedDeposit: (amount, termMonths) => {
    const s = get();
    if (amount <= 0) return { ok: false, reason: 'Сумма должна быть больше 0' };
    if (![3, 6, 12].includes(termMonths)) {
      return { ok: false, reason: 'Срок: 3, 6 или 12 месяцев' };
    }
    if (s.fixedDeposits.length >= 10) {
      return { ok: false, reason: 'Максимум 10 активных вкладов' };
    }
    if (moneyToNumber(s.balanceDecimal) < amount) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    // Ставка за весь срок (можно менять — чем дольше, тем выгоднее)
const rateByTerm: Record<number, number> = {
  3: 0.004,   // 0.4% в месяц
  6: 0.005,   // 0.5% в месяц
  12: 0.006,  // 0.6% в месяц
};
const monthlyRate = rateByTerm[termMonths] ?? 0.004;

    const tx = get().recordTransaction({
      direction: 'expense',
      amount,
      category: 'deposit_open',
      description: `Срочный вклад на ${termMonths} мес`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

const deposit: FixedDeposit = {
  id: `dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  amount: String(amount),
  termMonths,
  monthsLeft: termMonths,
  monthlyRate,
};

    set((st) => ({ fixedDeposits: [...st.fixedDeposits, deposit] }));
    toast.success(`Вклад открыт: ${formatMoney(String(amount))}`, {
      description: `Срок ${termMonths} мес · +${(monthlyRate * 100).toFixed(1)}%/мес`,
    });
    return { ok: true };
  },

  closeFixedDeposit: (id) => {
    const s = get();
    const deposit = s.fixedDeposits.find((d) => d.id === id);
    if (!deposit) return { ok: false, reason: 'Вклад не найден' };

    const tx = get().recordTransaction({
      direction: 'income',
      amount: deposit.amount,
      category: 'deposit_close_early',
      description: 'Досрочное закрытие вклада (без %)',
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      fixedDeposits: st.fixedDeposits.filter((d) => d.id !== id),
    }));
    toast.info('Вклад закрыт досрочно', {
      description: 'Проценты не начислены',
    });
    return { ok: true };
  },

    buyFund: (fundId, amount) => {
    const s = get();
    const def = FUND_DEFINITIONS_BY_ID[fundId];
    if (!def) return { ok: false, reason: 'Фонд не найден' };
    if (amount <= 0) return { ok: false, reason: 'Сумма должна быть больше 0' };
    if (moneyToNumber(s.balanceDecimal) < amount) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount,
      category: 'fund_deposit',
      description: `Фонд: ${def.name}`,
      relatedEntityId: fundId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const existing = s.funds.find((f) => f.fundId === fundId);
    const nextPosition = addMoneyToFund(existing, fundId, String(amount));

    const newFunds = existing
      ? s.funds.map((f) => (f.fundId === fundId ? nextPosition : f))
      : [...s.funds, nextPosition];

    set({ funds: newFunds });
    return { ok: true };
  },

  withdrawFund: (fundId, amount) => {
    const s = get();
    const existing = s.funds.find((f) => f.fundId === fundId);
    if (!existing) return { ok: false, reason: 'Фонд не найден в портфеле' };
    if (amount <= 0) return { ok: false, reason: 'Сумма должна быть больше 0' };

    const result = withdrawFromFundEngine(existing, String(amount));
    if (!result.ok) return { ok: false, reason: 'Недостаточно средств в фонде' };

    const tx = get().recordTransaction({
      direction: 'income',
      amount: result.withdrawn,
      category: 'fund_withdraw',
      description: `Вывод из фонда`,
      relatedEntityId: fundId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const newFunds = s.funds
      .map((f) => (f.fundId === fundId ? result.position : f))
      .filter((f) => Number(f.currentValue) > 0);

    set({ funds: newFunds });
    return { ok: true };
  },

  buyBond: (bondId, quantity) => {
    const s = get();
    const def = BOND_DEFINITIONS_BY_ID[bondId];
    if (!def) return { ok: false, reason: 'Облигация не найдена' };
    if (quantity <= 0) return { ok: false, reason: 'Количество > 0' };

    const totalCost = Number(def.purchasePrice) * quantity;
    if (moneyToNumber(s.balanceDecimal) < totalCost) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: totalCost,
      category: 'bond_buy',
      description: `Облигации: ${def.name} × ${quantity}`,
      relatedEntityId: bondId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const existing = s.bonds.find((b) => b.bondId === bondId);
    if (existing) {
      set({
        bonds: s.bonds.map((b) =>
          b.bondId === bondId
            ? {
                ...b,
                quantity: b.quantity + quantity,
                currentValue: String(
                  Number(b.currentValue) + Number(def.faceValue) * quantity,
                ),
              }
            : b,
        ),
      });
    } else {
      set({
        bonds: [
          ...s.bonds,
          {
            bondId,
            quantity,
            currentValue: String(Number(def.faceValue) * quantity),
            monthsToMaturity: def.maturityMonths,
          },
        ],
      });
    }

    return { ok: true };
  },

  buyMetal: (metalId, amount) => {
    const s = get();
    const def = getMetalDef(metalId);
    if (!def) return { ok: false, reason: 'Металл не найден' };
    if (amount <= 0) return { ok: false, reason: 'Сумма > 0' };

    if (moneyToNumber(s.balanceDecimal) < amount) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    const existing = s.metals.find((m) => m.metalId === metalId);
    const currentPrice = existing ? Number(existing.currentPrice) : def.basePrice;
    const quantity = amount / currentPrice;

    const tx = get().recordTransaction({
      direction: 'expense',
      amount,
      category: 'metal_buy',
      description: `Металл: ${def.name}`,
      relatedEntityId: metalId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    if (existing) {
      set({
        metals: s.metals.map((m) =>
          m.metalId === metalId
            ? { ...m, quantity: m.quantity + quantity }
            : m,
        ),
      });
    } else {
      set({
        metals: [...s.metals, createMetalPosition(metalId, quantity)],
      });
    }

    return { ok: true };
  },

  sellMetal: (metalId, quantity) => {
    const s = get();
    const existing = s.metals.find((m) => m.metalId === metalId);
    if (!existing) return { ok: false, reason: 'Металла нет в портфеле' };
    if (quantity <= 0 || quantity > existing.quantity) {
      return { ok: false, reason: 'Некорректное количество' };
    }

    const def = getMetalDef(metalId);
    const proceeds = existing.currentPrice
      ? Number(existing.currentPrice) * quantity
      : (def?.basePrice ?? 0) * quantity;

    const tx = get().recordTransaction({
      direction: 'income',
      amount: proceeds,
      category: 'metal_sell',
      description: `Продажа металла: ${def?.name ?? metalId}`,
      relatedEntityId: metalId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const remaining = existing.quantity - quantity;
    set({
      metals: s.metals
        .map((m) => (m.metalId === metalId ? { ...m, quantity: remaining } : m))
        .filter((m) => m.quantity > 0),
    });

    return { ok: true };
  },
  getMonthlyProfit: () => {
    const s = get();
    let monthly = 0;
    for (const runtime of s.businesses ?? []) {
      const monthlyGross =
        Number(runtime.baseMonthlyRevenue ?? 0) * (runtime.level ?? 1);
      const monthlyExpenses =
        Number(runtime.monthlyPayroll ?? 0) +
        Number(runtime.monthlyRent ?? 0) +
        Number(runtime.monthlyUtilities ?? 0) +
        Number(runtime.monthlyMaintenance ?? 0);
      monthly += Math.max(0, monthlyGross - monthlyExpenses);
    }
    return String(Math.round(monthly));
  },

  getCreditRatingCoefficient: () => {
    return creditBandFor(get().creditScore).limitCoefficient;
  },

  applyForLoan: (amount, termMonths) => {
    const s = get();
    const activeLoan = s.loans.find((l) => l.status === 'active');

    const result = createLoan({
      amount: String(Math.round(amount)),
      monthlyProfit: get().getMonthlyProfit(),
      creditScore: s.creditScore,
      ratingCoefficient: get().getCreditRatingCoefficient(),
      termMonths,
      currentMonth: Math.floor(s.totalGameMonths),
      existingLoan: activeLoan ?? null,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    // Зачислить деньги на баланс
    const tx = get().recordTransaction({
      direction: 'income',
      amount: result.loan.originalPrincipal,
      category: 'loan_disbursement',
      description: `Получен кредит`,
      relatedEntityId: result.loan.id,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка зачисления' };

    set({ loans: [...s.loans, result.loan] });
    toast.success(`Кредит одобрен: ${formatMoney(result.loan.originalPrincipal)}`, {
      description: `Платёж: ${formatMoney(result.loan.monthlyPayment)} / мес`,
    });
    return { ok: true };
  },

  repayLoanEarly: () => {
    const s = get();
    const activeLoan = s.loans.find((l) => l.status === 'active');
    if (!activeLoan) return { ok: false, reason: 'Нет активного кредита' };

    const result = repayLoanEarlyEngine(
      activeLoan,
      s.balanceDecimal,
      s.creditScore,
    );

    if (!result.completed) {
      return { ok: false, reason: 'Недостаточно средств для полного погашения' };
    }

    // Списать деньги
    const tx = get().recordTransaction({
      direction: 'expense',
      amount: result.paid,
      category: 'loan_principal',
      description: `Досрочное погашение`,
      relatedEntityId: activeLoan.id,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set({
      loans: s.loans.map((l) =>
        l.id === activeLoan.id ? result.loan : l,
      ),
      creditScore: result.creditScore,
    });

    toast.success('Кредит погашен досрочно');
    return { ok: true };
  },
    getPlayerCapital: () => {
    const s = get();

    const businessValues: string[] = [];
    for (const runtime of s.businesses ?? []) {
      const cash = Number(runtime.cashBalance ?? 0);
      const monthlyGross =
        Number(runtime.baseMonthlyRevenue ?? 0) * (runtime.level ?? 1);
      const monthlyExpenses =
        Number(runtime.monthlyPayroll ?? 0) +
        Number(runtime.monthlyRent ?? 0) +
        Number(runtime.monthlyUtilities ?? 0) +
        Number(runtime.monthlyMaintenance ?? 0);
      const monthlyProfit = Math.max(0, monthlyGross - monthlyExpenses);
      businessValues.push(
        String(cash + monthlyProfit * BALANCE.businessAppraisalMultiplier),
      );
    }
    const realEstateValues = s.ownedProperty
      .map((id) => {
        const def = REAL_ESTATE.find((r) => r.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    const transportValues = s.ownedTransport
      .map((id) => {
        const def = TRANSPORT.find((t) => t.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    const stockPositions = (s.marketPositions ?? []).map((pos) => {
      const company = s.marketCompanies.find((c) => c.id === pos.companyId);
      return {
        shares: pos.shares,
        currentPrice: company?.price ?? '0',
      };
    });

    const fundValues: string[] = (s.funds ?? []).map((f) => f.currentValue);
    const bondValues: string[] = (s.bonds ?? []).map((b) => b.currentValue);
    const metalValues: string[] = (s.metals ?? []).map((m) =>
      String(Number(m.currentPrice) * m.quantity),
    );

    // Склад пока учитывается в fundValues (в Блоке 15 вынесем отдельно)
    const inventoryValue: string[] = [];
    for (const wh of s.warehouses ?? []) {
      for (const item of Object.values(wh.items ?? {})) {
        inventoryValue.push(
          String(Number(item.averageUnitCost ?? 0) * item.quantity),
        );
      }
    }

    // Накопительный счёт и вклады = часть капитала (свободно/заморожено).
    const depositsValue =
      Number(s.savingsBalance ?? 0) +
      (s.fixedDeposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

    const breakdown = calculateCapital({
      cash: moneyAdd(s.balanceDecimal, String(Math.round(depositsValue))),
      businessValues,
      fundValues: [...fundValues, ...inventoryValue],
      bondValues,
      metalValues,
      stockPositions,
      realEstateValues,
      transportValues,
      liabilities: (s.loans ?? [])
        .filter((l) => l.status === 'active')
        .map((l) => l.balance),
    });

    return breakdown.netWorth;
  },

  getCompanyRating: (limit = 30) => {
    const s = get();
    const playerCapital = moneyToNumber(get().getPlayerCapital());
    return getCompanyRating(
      s.marketCompanies,
      playerCapital,
      s.companyName,
      limit,
    );
  },
  captureCapitalSnapshot: () => {
    const s = get();
    const monthIndex = s.totalGameMonths;

    // ── Недвижимость ─────────────────────────────────────────────
    const realEstateValues: string[] = s.ownedProperty
      .map((id) => {
        const def = REAL_ESTATE.find((r) => r.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    // ── Транспорт ────────────────────────────────────────────────
    const transportValues: string[] = s.ownedTransport
      .map((id) => {
        const def = TRANSPORT.find((t) => t.id === id);
        return def ? String(def.price) : null;
      })
      .filter((v): v is string => v !== null);

    // ── Акции ────────────────────────────────────────────────────
    const stockPositions = (s.marketPositions ?? []).map((pos) => {
      const company = s.marketCompanies.find((c) => c.id === pos.companyId);
      return {
        shares: pos.shares,
        currentPrice: company?.price ?? '0',
      };
    });

    // ── Бизнесы ───────────────────────────────────────────────
    const businessValues: string[] = [];
    for (const runtime of s.businesses ?? []) {
      const cash = Number(runtime.cashBalance ?? 0);
      const monthlyGross =
        Number(runtime.baseMonthlyRevenue ?? 0) * (runtime.level ?? 1);
      const monthlyExpenses =
        Number(runtime.monthlyPayroll ?? 0) +
        Number(runtime.monthlyRent ?? 0) +
        Number(runtime.monthlyUtilities ?? 0) +
        Number(runtime.monthlyMaintenance ?? 0);
      const monthlyProfit = Math.max(0, monthlyGross - monthlyExpenses);
      businessValues.push(
        String(cash + monthlyProfit * BALANCE.businessAppraisalMultiplier),
      );
    }

    // ── Фонды (#11) ───────────────────────────────────────────
    const fundValues: string[] = (s.funds ?? []).map(
      (p) => p.currentValue,
    );

    // ── Облигации (#11) ───────────────────────────────────────
    const bondValues: string[] = (s.bonds ?? []).map(
      (p) => p.currentValue,
    );

    // ── Металлы (#11) ─────────────────────────────────────────
    const metalValues: string[] = (s.metals ?? []).map((p) =>
      String(Number(p.currentPrice) * p.quantity),
    );

    // ── Обязательства по кредитам (#11) ───────────────────────
    const liabilities: string[] = (s.loans ?? [])
      .filter((l) => l.status === 'active')
      .map((l) => String(Number(l.balance) + Number(l.arrears ?? 0)));

    // ── Расчёт ────────────────────────────────────────────────
    const breakdown = calculateCapital({
      cash: s.balanceDecimal,
      businessValues,
      fundValues,
      bondValues,
      metalValues,
      stockPositions,
      realEstateValues,
      transportValues,
      liabilities,
    });

    const snapshot: CapitalSnapshot = {
      monthIndex,
      capital: breakdown.netWorth,
      breakdown: {
        cash: breakdown.cash,
        businesses: breakdown.businesses,
        funds: breakdown.funds,
        bonds: breakdown.bonds,
        metals: breakdown.metals,
        stocks: breakdown.stocks,
        realEstate: breakdown.realEstate,
        transport: breakdown.transport,
        liabilities: breakdown.liabilities,
      },
    };

    // Удаляем снимок за этот же месяц (если был) и добавляем новый
    const filtered = s.capitalSnapshots.filter((p) => p.monthIndex !== monthIndex);
    const trimmed = [...filtered, snapshot].slice(-120);

    set({ capitalSnapshots: trimmed });
  },
    // ========== БЛОК 4: Бизнесы ==========
  openBusiness: (defId, premisesMode, operatingCapital) => {
    const s = get();
    const def = BUSINESSES.find((b) => b.id === defId);
    if (!def) return { ok: false, reason: 'Бизнес не найден' };

    // ── Расчёт стоимости открытия ────────────────────────────
    const equipment = def.startingEquipment ?? def.fixedCosts * 2;
    const premises = premisesMode === 'owned'
      ? (def.premisesPrice ?? def.fixedCosts * 24)
      : 0;
    const firstMonthRent = premisesMode === 'rent' ? def.fixedCosts * 0.7 : 0;
    const firstMonthUtilities = def.fixedCosts * 0.3;

    const priceCtx: PriceContext = {
      marketIndex: s.marketIndex ?? 1,
      activeEvents: s.activeEvents ?? [],
      monthIndex: Math.floor(s.totalGameMonths),
    };
    const procDiscount = getOfficeBonuses(s).purchaseDiscount;

    // ── Разовое оборудование по каналу 1 (1.00 × P_market) ──────────────
    let requiredEquipmentCost = 0;
    for (const [resId, qty] of Object.entries(def.requiredEquipment ?? {})) {
      requiredEquipmentCost += getNpcUnitPrice(resId, priceCtx, procDiscount) * qty;
    }

    // ── Стартовые ресурсы: keyResources × 1 месяц по 1.00 × P_market ──
    let initialResourcesCost = 0;
    const initialInventory: Record<string, { quantity: number; averageUnitCost: Money }> = {};
    for (const [resId, qty] of Object.entries(def.keyResources)) {
      const unitCost = getNpcUnitPrice(resId, priceCtx, procDiscount);
      initialResourcesCost += unitCost * qty;
      initialInventory[resId] = { quantity: qty, averageUnitCost: String(unitCost) };
    }

    // ── CAPEX-пакет строительства (GDD §7.3) ──
    const capexPlan = buildCapexPlan(
      getCapexPackage(def.id, premisesMode === 'owned'),
      s.warehouses,
      priceCtx,
      {
        procurementDiscount: procDiscount,
        capexDiscount: getCapexDiscount({
          hasConstructionCo: s.businesses.some(
            (b) => b.defId === 'construction_co' && b.status === 'operating',
          ),
          hasProjectBureau: s.enterprises.some(
            (e) => e.defId === 'off_project_bureau' && e.status === 'operating',
          ),
        }),
      },
    );

    // Бонус проектного бюро — только для строительных бизнесов
    const officeBonuses = getOfficeBonuses(s);
    const isConstruction = def.id === 'construction_co';
    const constructionMult = isConstruction ? (1 - officeBonuses.constructionDiscount) : 1;

    const total =
      Math.round(
        (equipment + premises + firstMonthRent + firstMonthUtilities +
          requiredEquipmentCost + initialResourcesCost + operatingCapital) * constructionMult,
      ) + capexPlan.marketTotal;
    if (moneyToNumber(s.balanceDecimal) < total) {
      return {
        ok: false,
        reason: `Нужно ${Math.ceil(total)} ₽, есть ${Math.floor(moneyToNumber(s.balanceDecimal))} ₽`,
      };
    }

    // ── Списать деньги ───────────────────────────────────────
    const tx = get().recordTransaction({
      direction: 'expense',
      amount: total,
      category: 'business_open',
      description: `Открытие: ${def.name}`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Не удалось списать деньги' };

    // ── Создать BusinessRuntime ──────────────────────────────
    const runtime = businessDefToRuntime(def, { premisesMode });
    runtime.cashBalance = String(operatingCapital);
    runtime.inventory = initialInventory;

    set({
      businesses: [...s.businesses, runtime],
      warehouses: consumeCapexFromWarehouses(s.warehouses, capexPlan),
    });

    toast.success(`Открыт бизнес: «${def.name}»`, {
      description: capexPlan.warehouseUnits > 0
        ? `CAPEX: со склада ${capexPlan.warehouseUnits} ед. + рынок ${formatMoney(String(capexPlan.marketTotal))}`
        : `CAPEX-пакет: ${formatMoney(String(capexPlan.marketTotal))}`,
    });
    return { ok: true };
  },

  upgradeBusinessRuntime: (instanceId) => {
    const s = get();
    const idx = s.businesses.findIndex((b) => b.id === instanceId);
    if (idx < 0) return { ok: false, reason: 'Бизнес не найден' };

    const runtime = s.businesses[idx];
    const def = findDefForRuntime(runtime, BUSINESSES);
    if (!def) return { ok: false, reason: 'Данные бизнеса не найдены' };

    const nextLevel = runtime.level + 1;
    const equipment = def.startingEquipment ?? def.fixedCosts * 2;

    // Бонус проектного бюро — только для строительных бизнесов
    const officeBonuses = getOfficeBonuses(s);
    const isConstruction = runtime.defId === 'construction_co';
    const constructionMult = isConstruction ? (1 - officeBonuses.constructionDiscount) : 1;

    // Стоимость улучшения = equipment × ratio × level × строительный множитель
    const cost = Math.round(
      equipment * BALANCE.upgradeCostRatio * runtime.level * constructionMult,
    );

    if (moneyToNumber(s.balanceDecimal) < cost) {
      return { ok: false, reason: `Нужно ${cost} ₽` };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: cost,
      category: 'business_upgrade',
      description: `Улучшение: ${runtime.name} → ур.${nextLevel}`,
      relatedEntityId: instanceId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Не удалось списать деньги' };

    set({
      businesses: s.businesses.map((b) =>
        b.id === instanceId ? { ...b, level: nextLevel } : b,
      ),
    });
    toast.success(`«${runtime.name}» улучшен до ур.${nextLevel}`);
    return { ok: true };
  },

  withdrawFromBusiness: (instanceId, amount) => {
    const s = get();
    const idx = s.businesses.findIndex((b) => b.id === instanceId);
    if (idx < 0) return { ok: false, reason: 'Бизнес не найден' };

    const runtime = s.businesses[idx];
    const amountMoney = String(Math.max(0, Math.floor(amount)));
    if (Number(amountMoney) <= 0) return { ok: false, reason: 'Некорректная сумма' };
    if (Number(runtime.cashBalance) < Number(amountMoney)) {
      return { ok: false, reason: 'У бизнеса недостаточно средств' };
    }

    // Списать с бизнеса
    const nextCash = String(Number(runtime.cashBalance) - Number(amountMoney));

    // Зачислить на player balance
    const tx = get().recordTransaction({
      direction: 'income',
      amount: amountMoney,
      category: 'business_withdraw',
      description: `Перевод из: ${runtime.name}`,
      relatedEntityId: instanceId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка перевода' };

    set({
      businesses: s.businesses.map((b) =>
        b.id === instanceId ? { ...b, cashBalance: nextCash } : b,
      ),
    });
    return { ok: true };
  },
    addToBusinessCash: (instanceId, amount) => {
    const s = get();
    const idx = s.businesses.findIndex((b) => b.id === instanceId);
    if (idx < 0) return { ok: false, reason: 'Бизнес не найден' };

    const runtime = s.businesses[idx];
    const amountMoney = String(Math.max(0, Math.floor(amount)));
    if (Number(amountMoney) <= 0) {
      return { ok: false, reason: 'Некорректная сумма' };
    }
    if (moneyToNumber(s.balanceDecimal) < Number(amountMoney)) {
      return { ok: false, reason: 'Недостаточно средств на кошельке' };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: amountMoney,
      category: 'business_deposit',
      description: `Пополнение кассы: ${runtime.name}`,
      relatedEntityId: instanceId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка перевода' };

    set({
      businesses: s.businesses.map((b) =>
        b.id === instanceId
          ? {
              ...b,
              cashBalance: String(
                Number(b.cashBalance) + Number(amountMoney),
              ),
            }
          : b,
      ),
    });
    return { ok: true };
  },

  hireEmployee: (businessId, role) => {
    const s = get();
    const business = s.businesses.find((b) => b.id === businessId);
    if (!business) return { ok: false, reason: 'Бизнес не найден' };

    const def = EMPLOYEE_ROLES_BY_ID[role];
    if (!def) return { ok: false, reason: 'Неизвестная роль' };

    const businessDef = BUSINESSES.find((b) => b.id === business.defId);
    const workerStaff = businessDef?.workerStaff ?? {};

    // ── Проверка лимитов ─────────────────────────
    const isMgmt = isManagementRole(role);
    if (!isMgmt) {
      const maxCount = workerStaff[role] ?? 0;
      if (maxCount === 0) {
        return { ok: false, reason: 'Эта роль недоступна для этого бизнеса' };
      }
      const currentCount = s.employees.filter(
        (e) => e.businessId === businessId && e.role === role,
      ).length;
      if (currentCount >= maxCount) {
        return { ok: false, reason: 'Лимит по этой роли достигнут' };
      }
    }

    // ── Зарплата ─────────────────────────────────
    // Рабочие: доля каталожного ФОТ (GDD §9.1). Управленцы: вилка + сверх ФОТ.
    const workerSalaries = computeWorkerSalaries(businessDef?.payroll ?? 0, workerStaff);
    const salary = !isMgmt && workerSalaries[role]
      ? workerSalaries[role]
      : role === 'hr'
        ? Math.round(def.salaryMin * 0.9)
        : Math.round(def.salaryMin + Math.random() * (def.salaryMax - def.salaryMin));

    const months = Math.round(
      def.contractMinMonths +
        Math.random() * (def.contractMaxMonths - def.contractMinMonths),
    );

    const officeBonuses = getOfficeBonuses(s);
    const baseQual = 1 + Math.floor(Math.random() * 3);
    const boostedQual = Math.min(
      5,
      baseQual + Math.round(officeBonuses.hireQuality * 5),
    );

    const employee: EmployeeRuntime = {
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      businessId,
      role,
      name: def.name,
      qualification: boostedQual,
      monthlySalary: String(salary),
      monthsEmployed: 0,
      monthsRemaining: months,
    };

    const result = hireEmployeeEngine(s.employees, employee);
    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    let nextEmployees = result.employees;

    // ── HR: автозаполнение всех вакансий ─────────
    if (role === 'hr') {
      // GDD §9.2: штатный HR закрывает рабочие вакансии.
      // Управляющий и бухгалтер — осознанный найм игроком сверх базового ФОТ.
      const toHire: Array<{ role: EmployeeRole; count: number }> =
        Object.entries(workerStaff).map(([r, c]) => ({
          role: r as EmployeeRole,
          count: c,
        }));
      for (const item of toHire) {
        const currentCount = nextEmployees.filter(
          (e) => e.businessId === businessId && e.role === item.role,
        ).length;
        const needed = item.count - currentCount;
        if (needed <= 0) continue;

        const roleDef = EMPLOYEE_ROLES_BY_ID[item.role];
        if (!roleDef) continue;

        for (let i = 0; i < needed; i++) {
          const newSalary = workerSalaries[item.role] ?? Math.round(roleDef.salaryMin * 0.9);
          const newMonths = Math.round(
            roleDef.contractMinMonths +
              Math.random() * (roleDef.contractMaxMonths - roleDef.contractMinMonths),
          );
          const newBaseQual = 1 + Math.floor(Math.random() * 3);
          const newQual = Math.min(
            5,
            newBaseQual + Math.round(officeBonuses.hireQuality * 5),
          );

          nextEmployees.push({
            id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            businessId,
            role: item.role,
            name: roleDef.name,
            qualification: newQual,
            monthlySalary: String(newSalary),
            monthsEmployed: 0,
            monthsRemaining: newMonths,
          });
        }
      }
    }

    set({ employees: nextEmployees });

    const hiredCount = nextEmployees.length - s.employees.length;
    if (role === 'hr' && hiredCount > 1) {
      toast.success(`Нанят HR: ${def.name}`, {
        description: `HR подобрал ещё ${hiredCount - 1} сотрудников`,
      });
    } else {
      toast.success(`Нанят: ${def.name}`, {
        description: `${salary.toLocaleString('ru-RU')} ₽ / мес, ${months} мес`,
      });
    }
    return { ok: true };
  },

  dismissEmployee: (employeeId) => {
    const s = get();
    set({ employees: dismissEmployeeEngine(s.employees, employeeId) });
  },
    // ========== СКЛАДЫ ==========
  renameWarehouse: (warehouseId, name) => {
    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, customName: name.trim() || w.customName } : w,
      ),
    }));
  },

  sellResourceFromWarehouse: (warehouseId, resourceId, quantity) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, reason: 'Некорректное количество' };
    }

    const item = wh.items[resourceId];
    if (!item || item.quantity < quantity) {
      return { ok: false, reason: 'Недостаточно товара на складе' };
    }

    const res = RESOURCES_BY_ID[resourceId];
    if (!res) return { ok: false, reason: 'Ресурс не найден' };

    // ── Канал 3 (B2B 0.90×) в пределах спроса + канал 5 (слив 0.45×) сверх ──
    const priceCtx: PriceContext = {
      marketIndex: s.marketIndex ?? 1,
      activeEvents: s.activeEvents ?? [],
      monthIndex: Math.floor(s.totalGameMonths),
    };
    const remaining = getRemainingNpcDemand(s.monthlyNpcSold, resourceId);
    const b2bQty = Math.min(quantity, remaining);
    const dumpQty = quantity - b2bQty;
    const soldQty = quantity;

    const total =
      getB2BUnitPrice(resourceId, priceCtx) * b2bQty +
      getDumpUnitPrice(resourceId, priceCtx) * dumpQty;

    const tx = s.recordTransaction({
      direction: 'income',
      amount: total,
      category: 'warehouse_sale',
      description: `Продажа: ${b2bQty} ${res.unit} ${res.name} по B2B${
        dumpQty > 0 ? ` + ${dumpQty} слив сверх спроса` : ''
      }`,
      relatedEntityId: warehouseId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Не удалось провести транзакцию' };

    set((st) => ({
      warehouses: st.warehouses.map((w) => {
        if (w.id !== warehouseId) return w;
        const nextItems = { ...w.items };
        const nextQty = (nextItems[resourceId]?.quantity ?? 0) - soldQty;
        if (nextQty <= 0) {
          delete nextItems[resourceId];
        } else {
          nextItems[resourceId] = { ...nextItems[resourceId], quantity: nextQty };
        }
        return { ...w, items: nextItems };
      }),
      monthlyNpcSold: {
        ...st.monthlyNpcSold,
        [resourceId]: (st.monthlyNpcSold[resourceId] ?? 0) + b2bQty,
      },
    }));

    return { ok: true, total: String(total), soldQty: soldQty};
  },

  hireWarehouseEmployee: (warehouseId, role) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };

    // Лимиты по размеру склада. Водитель — 1 на грузовик (GDD §5.3).
    const limits = {
      small:  { storekeeper: 1, loader: 1, manager: 1, hr: 1, accountant: 1, driver: 1 },
      medium: { storekeeper: 2, loader: 2, manager: 1, hr: 1, accountant: 1, driver: 1 },
      large:  { storekeeper: 3, loader: 3, manager: 1, hr: 1, accountant: 1, driver: 1 },
      huge:   { storekeeper: 3, loader: 5, manager: 1, hr: 1, accountant: 1, driver: 1 },
    }[wh.size];

    const current = wh.employees.filter((e) => e.role === role).length;
    if (current >= limits[role]) {
      return { ok: false, reason: 'Лимит по этой роли на складе достигнут' };
    }

    const salaries: Record<WarehouseRole, [number, number]> = {
      manager:     [80_000, 120_000],
      hr:          [50_000, 80_000],
      accountant:  [40_000, 70_000],
      storekeeper: [40_000, 60_000],
      loader:      [30_000, 50_000],
      driver:      [45_000, 65_000],
    };
    const [minSal, maxSal] = salaries[role];
    const salary = Math.round(minSal + Math.random() * (maxSal - minSal));

    const names: Record<WarehouseRole, string> = {
      manager: 'Управляющий складом',
      hr: 'HR-специалист',
      accountant: 'Бухгалтер',
      storekeeper: 'Кладовщик',
      loader: 'Грузчик',
      driver: 'Водитель',
    };

    const emp: WarehouseEmployee = {
      id: `whe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      warehouseId,
      role,
      name: names[role],
      monthlySalary: salary,
      monthsEmployed: 0,
    };

    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, employees: [...w.employees, emp] } : w,
      ),
    }));
    toast.success(`Нанят: ${emp.name}`, {
      description: `${salary.toLocaleString('ru-RU')} ₽ / мес`,
    });
    return { ok: true };
  },

  dismissWarehouseEmployee: (warehouseId, employeeId) => {
    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, employees: w.employees.filter((e) => e.id !== employeeId) }
          : w,
      ),
    }));
  },

  buyWarehouseTruck: (warehouseId) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };
    if (wh.hasTrucks) return { ok: false, reason: 'Грузовик уже куплен' };

    const prices = { small: 500_000, medium: 1_500_000, large: 3_000_000, huge: 5_000_000 };
    const price = prices[wh.size];

    if (moneyToNumber(s.balanceDecimal) < price) {
      return { ok: false, reason: `Нужно ${price.toLocaleString('ru-RU')} ₽` };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: price,
      category: 'warehouse_truck',
      description: `Грузовик для склада: ${wh.customName}`,
      relatedEntityId: warehouseId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, hasTrucks: true } : w,
      ),
    }));
    toast.success('Грузовик куплен', {
      description: 'Наймите водителя — без него парк не работает',
    });
    return { ok: true };
  },

  payFleetInvoice: (warehouseId) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };
    if (!wh.fleetInvoice) return { ok: false, reason: 'Нет неоплаченного счёта' };

    const settled = settleFleetInvoice(wh, wh.fleetInvoice);
    const cost = Math.round(settled.purchaseCost);

    if (cost > 0) {
      const tx = get().recordTransaction({
        direction: 'expense',
        amount: cost,
        category: 'fleet_upkeep',
        description: `Обслуживание парка «${wh.customName}»: топливо, запчасти, смазка`,
        relatedEntityId: warehouseId,
      });
      if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Недостаточно средств' };
    }

    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, items: settled.items, fleetInvoice: undefined } : w,
      ),
    }));

    toast.success('Счёт за парк оплачен', {
      description: cost > 0
        ? `Докуплено расходников на ${formatMoney(String(cost))}`
        : 'Все расходники взяты со склада',
    });
    return { ok: true };
  },
    checkoutCart: (items, mode, target) => {
    if (items.length === 0) return { ok: false, reason: 'Корзина пуста' };
    const s = get();

    // ── 1. Найти склад (для опта обязателен) ──────
    let wh: WarehouseRuntime | null = null;
    let whIdx = -1;
    if (target.type === 'warehouse') {
      whIdx = (s.warehouses ?? []).findIndex((w) => w.id === target.warehouseId);
      if (whIdx < 0) return { ok: false, reason: 'Склад не найден' };
      wh = s.warehouses[whIdx];
    }

    // ── 2. Валидация режима ──────────────────────
    if (mode === 'wholesale' && !wh) {
      return { ok: false, reason: 'Опт доступен только при покупке на склад' };
    }

    // ── 3. Канал 1: 1.00 × P_market × (1 − скидка), кап 20% ──
    const officeBonuses = getOfficeBonuses(s);
    const currentMonthForEvents = Math.floor(s.totalGameMonths);
    const priceCtx: PriceContext = {
      marketIndex: s.marketIndex ?? 1,
      activeEvents: s.activeEvents ?? [],
      monthIndex: currentMonthForEvents,
    };
    const hasOwnTransport = isFleetOperational(wh);

    // ── 4. Стоимость товаров + наёмная доставка (+12%, мин. 2 500 ₽) ──
    let goodsCost = 0;
    let totalQty = 0;
    for (const item of items) {
      if (item.quantity <= 0) continue;
      const res = RESOURCES_BY_ID[item.resourceId];
      if (!res) return { ok: false, reason: `Ресурс ${item.resourceId} не найден` };
      goodsCost += getNpcUnitPrice(item.resourceId, priceCtx, officeBonuses.purchaseDiscount) * item.quantity;
      totalQty += item.quantity;
    }
    const deliveryFee = getExternalDeliveryFee(goodsCost, hasOwnTransport);
    const totalCost = goodsCost + deliveryFee;
    // Доставка размазывается по себестоимости партии.
    const landedMult = goodsCost > 0 ? totalCost / goodsCost : 1;
    if (totalQty <= 0) return { ok: false, reason: 'Некорректное количество' };
    if (moneyToNumber(s.balanceDecimal) < totalCost) {
      return { ok: false, reason: 'Недостаточно денег' };
    }

    // ── 5. Проверка места ──────────────────────────
    if (wh) {
      const usedInWh = Object.values(wh.items).reduce((sum, i) => sum + i.quantity, 0);
      const reservedInWh = Object.values(wh.reserved ?? {}).reduce((sum, v) => sum + v, 0);
      const inTransitToWh = s.pendingDeliveries
        .filter((d) => d.warehouseId === wh!.id)
        .reduce((sum, d) => sum + d.quantity, 0);
      const free = wh.capacity - usedInWh - reservedInWh - inTransitToWh;
      if (totalQty > free) {
        return { ok: false, reason: `Не хватает места на складе (свободно ${free})` };
      }
    }

    if (target.type === 'business') {
      // Инвентарь бизнеса: ограничение 1 000 000 (виртуальное)
      const biz = s.businesses.find((b) => b.id === target.businessId);
      if (!biz) return { ok: false, reason: 'Бизнес не найден' };
      const usedInBiz = Object.values(biz.inventory ?? {}).reduce((sum, i) => sum + i.quantity, 0);
      const inTransitToBiz = s.pendingDeliveries
        .filter((d) => d.businessId === target.businessId)
        .reduce((sum, d) => sum + d.quantity, 0);
      const free = 1_000_000 - usedInBiz - inTransitToBiz;
      if (totalQty > free) {
        return { ok: false, reason: `Не хватает места в бизнесе (свободно ${free})` };
      }
    }

    // ── 6. Списать деньги ──────────────────────────
    const tx = get().recordTransaction({
      direction: 'expense',
      amount: Math.round(totalCost),
      category: 'business_purchase',
      description: `Закупка (${mode === 'wholesale' ? 'опт' : 'розница'}): ${items.length} поз.`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    // ── 7. Доставка: мгновенно (опт + грузовик) или через месяц ──
    const currentMonth = Math.floor(s.totalGameMonths);
    const isInstant = mode === 'wholesale' && isFleetOperational(wh);
    const arrivalAtMonth = isInstant ? currentMonth : currentMonth + 1;

    if (isInstant && wh) {
      // Кладём сразу в склад
      const newItems = { ...wh.items };
      for (const item of items) {
        const res = RESOURCES_BY_ID[item.resourceId];
        if (!res) continue;
        const unitCost = getNpcUnitPrice(item.resourceId, priceCtx, officeBonuses.purchaseDiscount) * landedMult;
        const existing = newItems[item.resourceId];
        if (existing) {
          const newQty = existing.quantity + item.quantity;
          const oldCost = Number(existing.averageUnitCost) * existing.quantity;
          const addCost = unitCost * item.quantity;
          newItems[item.resourceId] = {
            resourceId: item.resourceId,
            quantity: newQty,
            averageUnitCost: String((oldCost + addCost) / newQty),
          };
        } else {
          newItems[item.resourceId] = {
            resourceId: item.resourceId,
            quantity: item.quantity,
            averageUnitCost: String(unitCost),
          };
        }
      }
      set((st) => ({
        warehouses: st.warehouses.map((w) =>
          w.id === wh!.id
            ? { ...w, items: newItems, fleetVolumeMonth: (w.fleetVolumeMonth ?? 0) + goodsCost }
            : w,
        ),
      }));
      toast.success(`Заказ доставлен мгновенно (свой парк)`, {
        description: `${items.length} позиций на складе «${wh.customName}»`,
      });
    } else {
      // Доставка через месяц
      const newDeliveries: PendingDelivery[] = items.map((item) => {
        const cost = getNpcUnitPrice(item.resourceId, priceCtx, officeBonuses.purchaseDiscount) * item.quantity * landedMult;        return {
          id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          resourceId: item.resourceId,
          quantity: item.quantity,
          orderedAtMonth: currentMonth,
          arrivalAtMonth,
          cost: String(Math.round(cost)),
          warehouseId: target.type === 'warehouse' ? target.warehouseId : undefined,
          businessId: target.type === 'business' ? target.businessId : undefined,
        };
      });
      set((st) => ({ pendingDeliveries: [...st.pendingDeliveries, ...newDeliveries] }));
      toast.success('Заказ оформлен', {
        description: `Прибудет через 1 месяц`,
      });
    }

    return { ok: true, total: String(Math.round(totalCost)) };
  },
  // ========== ПРОИЗВОДСТВА И ОФИСНЫЕ КОМПАНИИ ==========
  openProduction: (premisesId, productionId) => {
    const s = get();
    const def = PRODUCTIONS_BY_ID[productionId];
    if (!def) return { ok: false, reason: 'Производство не найдено' };

    // Проверка: помещение куплено и это промпомещение
    if (!s.ownedProperty.includes(premisesId)) {
      return { ok: false, reason: 'Помещение не куплено' };
    }
    const premises = REAL_ESTATE.find((r) => r.id === premisesId);
    if (!premises || premises.category !== 'industrial') {
      return { ok: false, reason: 'Это не промышленное помещение' };
    }

    // Проверка: помещение не занято другим производством
    const occupied = s.enterprises.find(
      (e) => e.premisesId === premisesId && e.status !== 'closed',
    );
    if (occupied) return { ok: false, reason: 'Помещение уже занято' };

    // Расчёт стоимости по каналу 1 (1.00 × P_market)
    const priceCtx: PriceContext = {
      marketIndex: s.marketIndex ?? 1,
      activeEvents: s.activeEvents ?? [],
      monthIndex: Math.floor(s.totalGameMonths),
    };
    const procDiscount = getOfficeBonuses(s).purchaseDiscount;
    const equipment = def.startingEquipment;
    const requiredEquipCost = Object.entries(def.requiredEquipment ?? {}).reduce(
      (sum, [resId, qty]) => sum + getNpcUnitPrice(resId, priceCtx, procDiscount) * qty,
      0,
    );
    const initialInv: Record<string, { quantity: number; averageUnitCost: Money }> = {};
    let initialCost = 0;
    for (const [resId, qty] of Object.entries(def.keyResources)) {
      const unitCost = getNpcUnitPrice(resId, priceCtx, procDiscount);
      initialCost += unitCost * qty;
      initialInv[resId] = { quantity: qty, averageUnitCost: String(unitCost) };
    }
    const firstMonthRent = Math.round(premises.rentalIncome * 0.5);
    const capexPlan = buildCapexPlan(getCapexPackage(productionId, true), s.warehouses, priceCtx, {
      procurementDiscount: procDiscount,
      capexDiscount: getCapexDiscount({
        hasConstructionCo: s.businesses.some(
          (b) => b.defId === 'construction_co' && b.status === 'operating',
        ),
        hasProjectBureau: s.enterprises.some(
          (e) => e.defId === 'off_project_bureau' && e.status === 'operating',
        ),
      }),
    });
    const total = equipment + requiredEquipCost + initialCost + firstMonthRent + capexPlan.marketTotal;

    if (moneyToNumber(s.balanceDecimal) < total) {
      return { ok: false, reason: `Нужно ${Math.ceil(total).toLocaleString('ru-RU')} ₽` };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: Math.round(total),
      category: 'production_open',
      description: `Открытие производства: ${def.name}`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const runtime: EnterpriseRuntime = {
      id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'production',
      defId: productionId,
      premisesId,
      level: 1,
      status: 'operating',
      cashBalance: '0',
      inventory: initialInv,
      employees: [],
      monthlyPayroll: '0',
      monthlyRent: String(firstMonthRent),
      monthlyUtilities: String(Math.round(premises.rentalIncome * 0.2)),
      monthlyMaintenance: String(Math.round(premises.rentalIncome * 0.15)),
      taxRate: TAXES.businessProfit,
      baseMonthlyRevenue: String(def.baseRevenue),
      demandMultiplier: 1,
      productivityMultiplier: 1,
      startedAtMonth: Math.floor(s.totalGameMonths),
      productionDistribution: {},
    };

    set((st) => ({
      enterprises: [...st.enterprises, runtime],
      warehouses: consumeCapexFromWarehouses(st.warehouses, capexPlan),
    }));
    toast.success(`Производство открыто: ${def.name}`, {
      description: premises.name,
    });
    return { ok: true };
  },

  openOfficeCompany: (officeId, companyId) => {
    const s = get();
    const def = OFFICE_COMPANIES_BY_ID[companyId];
    if (!def) return { ok: false, reason: 'Офисная компания не найдена' };

    if (!s.ownedProperty.includes(officeId)) {
      return { ok: false, reason: 'Офис не куплен' };
    }
    const office = REAL_ESTATE.find((r) => r.id === officeId);
    if (!office || office.category !== 'office') {
      return { ok: false, reason: 'Это не офис' };
    }

    const occupied = s.enterprises.find(
      (e) => e.premisesId === officeId && e.status !== 'closed',
    );
    if (occupied) return { ok: false, reason: 'Офис уже занят' };

    const priceCtx: PriceContext = {
      marketIndex: s.marketIndex ?? 1,
      activeEvents: s.activeEvents ?? [],
      monthIndex: Math.floor(s.totalGameMonths),
    };
    const procDiscount = getOfficeBonuses(s).purchaseDiscount;
    const requiredEquipCost = Object.entries(def.requiredEquipment ?? {}).reduce(
      (sum, [resId, qty]) => sum + getNpcUnitPrice(resId, priceCtx, procDiscount) * qty,
      0,
    );
    const firstMonthRent = Math.round(office.rentalIncome * 0.5);
    const capexPlan = buildCapexPlan(getCapexPackage(companyId, true), s.warehouses, priceCtx, {
      procurementDiscount: procDiscount,
      capexDiscount: getCapexDiscount({
        hasConstructionCo: s.businesses.some(
          (b) => b.defId === 'construction_co' && b.status === 'operating',
        ),
        hasProjectBureau: s.enterprises.some(
          (e) => e.defId === 'off_project_bureau' && e.status === 'operating',
        ),
      }),
    });
    const total = def.startingEquipment + requiredEquipCost + firstMonthRent + capexPlan.marketTotal;

    if (moneyToNumber(s.balanceDecimal) < total) {
      return { ok: false, reason: `Нужно ${Math.ceil(total).toLocaleString('ru-RU')} ₽` };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: Math.round(total),
      category: 'office_open',
      description: `Открытие офисной компании: ${def.name}`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    const runtime: EnterpriseRuntime = {
      id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'office',
      defId: companyId,
      premisesId: officeId,
      level: 1,
      status: 'operating',
      cashBalance: '0',
      inventory: {},
      employees: [],
      monthlyPayroll: '0',
      monthlyRent: String(firstMonthRent),
      monthlyUtilities: String(Math.round(office.rentalIncome * 0.2)),
      monthlyMaintenance: String(Math.round(office.rentalIncome * 0.15)),
      taxRate: TAXES.businessProfit,
      baseMonthlyRevenue: String(def.baseRevenue),
      demandMultiplier: 1,
      productivityMultiplier: 1,
      startedAtMonth: Math.floor(s.totalGameMonths),
    };

    set((st) => ({
      enterprises: [...st.enterprises, runtime],
      warehouses: consumeCapexFromWarehouses(st.warehouses, capexPlan),
    }));
    toast.success(`Компания открыта: ${def.name}`, {
      description: office.name,
    });
    return { ok: true };
  },

  closeEnterprise: (enterpriseId) => {
    const s = get();
    const ent = s.enterprises.find((e) => e.id === enterpriseId);
    if (!ent) return { ok: false, reason: 'Не найдено' };

    // Возврат остатка с кассы
    const cash = Number(ent.cashBalance);
    if (cash > 0) {
      get().recordTransaction({
        direction: 'income',
        amount: cash,
        category: 'enterprise_close',
        description: `Закрытие: возврат остатка`,
      });
    }

    set((st) => ({
      enterprises: st.enterprises.map((e) =>
        e.id === enterpriseId ? { ...e, status: 'closed' } : e,
      ),
    }));
    toast.info('Компания закрыта, помещение свободно');
    return { ok: true };
  },

  setHeadOffice: (officeId) => {
    if (officeId === null) {
      set({ headOfficeId: null });
      return;
    }
    const s = get();
    if (!s.ownedProperty.includes(officeId)) return;
    const office = REAL_ESTATE.find((r) => r.id === officeId);
    if (!office || office.category !== 'office') return;
    set({ headOfficeId: officeId });
    toast.success(`Головной офис: ${office.name}`);
  },

  setProductionDistribution: (enterpriseId, resourceId, toWarehouse, toSell) => {
    set((st) => ({
      enterprises: st.enterprises.map((e) =>
        e.id === enterpriseId
          ? {
              ...e,
              productionDistribution: {
                ...(e.productionDistribution ?? {}),
                [resourceId]: { toWarehouse, toSell },
              },
            }
          : e,
      ),
    }));
  },
  hireEnterpriseEmployee: (enterpriseId, role) => {
    const s = get();
    const ent = s.enterprises.find((e) => e.id === enterpriseId);
    if (!ent) return { ok: false, reason: 'Предприятие не найдено' };

    const def = EMPLOYEE_ROLES_BY_ID[role];
    if (!def) return { ok: false, reason: 'Неизвестная роль' };

    const entDef = ent.type === 'production'
      ? PRODUCTIONS_BY_ID[ent.defId]
      : OFFICE_COMPANIES_BY_ID[ent.defId];
    const workerStaff = entDef?.workerStaff ?? {};

    const isMgmt = isManagementRole(role);
    if (!isMgmt) {
      const maxCount = workerStaff[role] ?? 0;
      if (maxCount === 0) {
        return { ok: false, reason: 'Эта роль недоступна для этого предприятия' };
      }
      const currentCount = s.employees.filter(
        (e) => e.businessId === enterpriseId && e.role === role,
      ).length;
      if (currentCount >= maxCount) {
        return { ok: false, reason: 'Лимит по этой роли достигнут' };
      }
    }

    const salary = role === 'hr'
      ? Math.round(def.salaryMin * 0.9)
      : Math.round(def.salaryMin + Math.random() * (def.salaryMax - def.salaryMin));

    const months = Math.round(
      def.contractMinMonths +
        Math.random() * (def.contractMaxMonths - def.contractMinMonths),
    );

    const officeBonuses = getOfficeBonuses(s);
    const baseQual = 1 + Math.floor(Math.random() * 3);
    const boostedQual = Math.min(
      5,
      baseQual + Math.round(officeBonuses.hireQuality * 5),
    );

    const employee: EmployeeRuntime = {
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      businessId: enterpriseId,
      role,
      name: def.name,
      qualification: boostedQual,
      monthlySalary: String(salary),
      monthsEmployed: 0,
      monthsRemaining: months,
    };

    const result = hireEmployeeEngine(s.employees, employee);
    if (!result.ok) return { ok: false, reason: result.reason };

    let nextEmployees = result.employees;

    if (role === 'hr') {
      const toHire: Array<{ role: EmployeeRole; count: number }> = [
        { role: 'manager', count: 1 },
        { role: 'accountant', count: 1 },
        ...Object.entries(workerStaff).map(([r, c]) => ({
          role: r as EmployeeRole,
          count: c,
        })),
      ];

      for (const item of toHire) {
        const currentCount = nextEmployees.filter(
          (e) => e.businessId === enterpriseId && e.role === item.role,
        ).length;
        const needed = item.count - currentCount;
        if (needed <= 0) continue;

        const roleDef = EMPLOYEE_ROLES_BY_ID[item.role];
        if (!roleDef) continue;

        for (let i = 0; i < needed; i++) {
          const newSalary = Math.round(roleDef.salaryMin * 0.9);
          const newMonths = Math.round(
            roleDef.contractMinMonths +
              Math.random() * (roleDef.contractMaxMonths - roleDef.contractMinMonths),
          );
          const newBaseQual = 1 + Math.floor(Math.random() * 3);
          const newQual = Math.min(
            5,
            newBaseQual + Math.round(officeBonuses.hireQuality * 5),
          );

          nextEmployees.push({
            id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            businessId: enterpriseId,
            role: item.role,
            name: roleDef.name,
            qualification: newQual,
            monthlySalary: String(newSalary),
            monthsEmployed: 0,
            monthsRemaining: newMonths,
          });
        }
      }
    }

    set({ employees: nextEmployees });

    const hiredCount = nextEmployees.length - s.employees.length;
    if (role === 'hr' && hiredCount > 1) {
      toast.success(`Нанят HR: ${def.name}`, {
        description: `HR подобрал ещё ${hiredCount - 1} сотрудников`,
      });
    } else {
      toast.success(`Нанят: ${def.name}`, {
        description: `${salary.toLocaleString('ru-RU')} ₽ / мес`,
      });
    }
    return { ok: true };
  },

  dismissEnterpriseEmployee: (employeeId) => {
    const s = get();
    set({ employees: dismissEmployeeEngine(s.employees, employeeId) });
  },
    resolveWarehouseEvent: (warehouseId) => {
    const s = get();
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };
    if (!wh.activeEvent || wh.activeEvent.resolved) {
      return { ok: false, reason: 'Нет активного события' };
    }

    const cost = wh.activeEvent.cost;
    if (moneyToNumber(s.balanceDecimal) < cost) {
      return { ok: false, reason: `Нужно ${cost.toLocaleString('ru-RU')} ₽` };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: cost,
      category: 'warehouse_repair',
      description: `Устранение события на складе «${wh.customName}»`,
      relatedEntityId: warehouseId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, activeEvent: w.activeEvent ? { ...w.activeEvent, resolved: true } : undefined, blockedUntilMonth: undefined }
          : w,
      ),
    }));
    toast.success('Событие устранено, склад снова работает');
    return { ok: true };
  },
    linkWarehouseToEnterprise: (enterpriseId, warehouseId) => {
    const s = get();
    const ent = s.enterprises.find((e) => e.id === enterpriseId);
    if (!ent) return { ok: false, reason: 'Предприятие не найдено' };
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };

    set((st) => ({
      enterprises: st.enterprises.map((e) =>
        e.id === enterpriseId ? { ...e, linkedWarehouseId: warehouseId } : e,
      ),
    }));
    toast.success(`Привязано к складу «${wh.customName}»`);
    return { ok: true };
  },

  unlinkWarehouseFromEnterprise: (enterpriseId) => {
    set((st) => ({
      enterprises: st.enterprises.map((e) =>
        e.id === enterpriseId ? { ...e, linkedWarehouseId: undefined } : e,
      ),
    }));
  },
    linkWarehouseToBusiness: (businessId, warehouseId) => {
    const s = get();
    const business = s.businesses.find((b) => b.id === businessId);
    if (!business) return { ok: false, reason: 'Бизнес не найден' };
    const wh = s.warehouses.find((w) => w.id === warehouseId);
    if (!wh) return { ok: false, reason: 'Склад не найден' };

    set((st) => ({
      businesses: st.businesses.map((b) =>
        b.id === businessId ? { ...b, linkedWarehouseId: warehouseId } : b,
      ),
    }));
    toast.success(`«${business.name}» привязан к складу «${wh.customName}»`);
    return { ok: true };
  },

  unlinkWarehouseFromBusiness: (businessId) => {
    const s = get();
    const business = s.businesses.find((b) => b.id === businessId);
    const whId = business?.linkedWarehouseId;

    set((st) => ({
      businesses: st.businesses.map((b) =>
        b.id === businessId ? { ...b, linkedWarehouseId: undefined } : b,
      ),
      warehouses: whId
        ? st.warehouses.map((w) => {
            if (w.id !== whId) return w;
            const newReserved = { ...w.reserved };
            delete newReserved[businessId];
            return { ...w, reserved: newReserved };
          })
        : st.warehouses,
    }));
  },

  // ========== АРЕНДА НЕДВИЖИМОСТИ ==========
  togglePropertyMode: (propertyId) => {
    set((st) => {
      const current = st.propertyMode[propertyId] ?? 'personal';
      return {
        propertyMode: {
          ...st.propertyMode,
          [propertyId]: current === 'personal' ? 'rent' : 'personal',
        },
      };
    });
  },

  findTenants: (propertyId) => {
    const property = REAL_ESTATE.find((r) => r.id === propertyId);
    if (!property) return;

    const names = [
      'Алексей Смирнов', 'Мария Иванова', 'Дмитрий Козлов', 'Анна Петрова',
      'Сергей Волков', 'Елена Соколова', 'Павел Морозов', 'Ольга Лебедева',
    ];
    const durations = [6, 9, 12, 16, 18, 24, 36];

    const offers: RentalOffer[] = Array.from({ length: 3 }).map((_, i) => {
      const variation = 0.7 + Math.random() * 0.6;
      return {
        id: `${propertyId}_offer_${Date.now()}_${i}`,
        name: names[Math.floor(Math.random() * names.length)],
        rentPrice: Math.round(property.rentalIncome * variation),
        duration: durations[Math.floor(Math.random() * durations.length)],
      };
    });

    set((st) => ({
      activeRentalOffers: { ...st.activeRentalOffers, [propertyId]: offers },
    }));
  },

  acceptTenant: (propertyId, offerId) => {
    const s = get();
    const offer = s.activeRentalOffers[propertyId]?.find((o) => o.id === offerId);
    if (!offer) return { ok: false, reason: 'Предложение не найдено' };

    set((st) => {
      const newRented = { ...st.rentedProperties };
      newRented[propertyId] = {
        id: propertyId,
        tenantName: offer.name,
        rentPrice: offer.rentPrice,
        monthsLeft: offer.duration,
        totalMonths: offer.duration,
      };
      const newOffers = { ...st.activeRentalOffers };
      delete newOffers[propertyId];
      return {
        rentedProperties: newRented,
        activeRentalOffers: newOffers,
        propertyMode: { ...st.propertyMode, [propertyId]: 'rent' },
      };
    });
    toast.success(`Арендатор найден: ${offer.name}`, {
      description: `${offer.rentPrice.toLocaleString('ru-RU')} ₽/мес · ${offer.duration} мес`,
    });
    return { ok: true };
  },

  evictTenant: (propertyId) => {
    const s = get();
    const rental = s.rentedProperties[propertyId];
    if (!rental) return { ok: false, reason: 'Нет арендатора' };

    const penalty = rental.rentPrice;
    const tx = get().recordTransaction({
      direction: 'expense',
      amount: penalty,
      category: 'rental_penalty',
      description: `Штраф за выселение арендатора ${rental.tenantName}`,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => {
      const newRented = { ...st.rentedProperties };
      delete newRented[propertyId];
      return {
        rentedProperties: newRented,
        propertyMode: { ...st.propertyMode, [propertyId]: 'personal' },
      };
    });
    toast.info('Арендатор выселен (штраф ' + penalty.toLocaleString('ru-RU') + ' ₽)');
    return { ok: true };
  },
    acceptContract: (contractId) => {
    const s = get();
    const idx = s.contracts.findIndex((c) => c.id === contractId);
    if (idx < 0) return;

    const contract = s.contracts[idx];
    const next = acceptContractEngine(contract, Math.floor(s.totalGameMonths));
    set({
      contracts: s.contracts.map((c) => (c.id === contractId ? next : c)),
    });
    toast.success(`Контракт принят: ${contract.title}`);
  },

  deliverContract: (contractId, quantity, warehouseId) => {
    const s = get();
    const idx = s.contracts.findIndex((c) => c.id === contractId);
    if (idx < 0) return { ok: false, reason: 'Контракт не найден' };

    const whIdx = s.warehouses.findIndex((w) => w.id === warehouseId);
    if (whIdx < 0) return { ok: false, reason: 'Склад не найден' };

    const contract = s.contracts[idx];
    const wh = s.warehouses[whIdx];
    const adaptedWh: Warehouse = { capacity: wh.capacity, items: wh.items };

    const result = deliverContractGoods({
      contract,
      warehouse: adaptedWh,
      requestedQuantity: quantity,
      currentMonth: Math.floor(s.totalGameMonths),
      balance: s.balanceDecimal,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    // Обновить выбранный склад и контракт
    set((st) => ({
      warehouses: st.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, items: result.warehouse.items } : w,
      ),
      contracts: st.contracts.map((c) =>
        c.id === contractId ? result.contract : c,
      ),
    }));

    // Награда при завершении
    if (result.completed) {
      const officeBonuses = getOfficeBonuses(get());
      const boostedReward = Math.round(
        Number(result.contract.reward) * (1 + officeBonuses.contractBonus),
      );

      get().recordTransaction({
        direction: 'income',
        amount: boostedReward,
        category: 'contract_reward',
        description: `Контракт: ${contract.title}${officeBonuses.contractBonus > 0 ? ` (+${Math.round(officeBonuses.contractBonus * 100)}%)` : ''}`,
        relatedEntityId: contractId,
      });
      set((st) => ({
        news: [
          {
            id: `news_contract_${Date.now()}`,
            monthIndex: Math.floor(st.totalGameMonths),
            title: '✅ Контракт выполнен',
            body: `${contract.title} · +${result.contract.reward} ₽`,
            companyId: contract.clientCompanyId,
            category: 'contract',
          },
          ...st.news,
        ].slice(0, 200),
      }));
    }

    return {
      ok: true,
      deliveredNow: result.deliveredNow,
      completed: result.completed,
    };
  },
  tickDeliveries: (currentMonth) => {
    const s = get();
    if (s.pendingDeliveries.length === 0) return;

    const arrived: PendingDelivery[] = [];
    const stillInTransit: PendingDelivery[] = [];

    for (const d of s.pendingDeliveries) {
      if (d.arrivalAtMonth <= currentMonth) arrived.push(d);
      else stillInTransit.push(d);
    }

    if (arrived.length === 0) return;

    const warehouses = (s.warehouses ?? []).map((w) => ({
      ...w,
      items: { ...w.items },
    }));
    const businesses = (s.businesses ?? []).map((b) => ({
      ...b,
      inventory: b.inventory ? { ...b.inventory } : undefined,
    }));
    const remainingDeliveries: PendingDelivery[] = [...stillInTransit];

    for (const d of arrived) {
      const actualUnitCost = d.quantity > 0 ? Number(d.cost) / d.quantity : 0;

      // ── 1. Склад ─────────────────────────────────────
      if (d.warehouseId) {
        const whIdx = warehouses.findIndex((w) => w.id === d.warehouseId);
        if (whIdx < 0) {
          remainingDeliveries.push(d);
          continue;
        }
        const wh = warehouses[whIdx];

        // C.2.2: склад заблокирован событием → не принимаем
        if (wh.activeEvent && !wh.activeEvent.resolved) {
          remainingDeliveries.push(d);
          continue;
        }

        const used = Object.values(wh.items).reduce((sum, i) => sum + i.quantity, 0);
        const reservedTotal = Object.values(wh.reserved ?? {}).reduce((sum, v) => sum + v, 0);
        const free = wh.capacity - used - reservedTotal;
        if (d.quantity > free) {
          remainingDeliveries.push(d);
          continue;
        }

        const existing = wh.items[d.resourceId];
        if (existing) {
          const newQty = existing.quantity + d.quantity;
          const oldCost = Number(existing.averageUnitCost) * existing.quantity;
          const addCost = actualUnitCost * d.quantity;
          wh.items[d.resourceId] = {
            ...existing,
            quantity: newQty,
            averageUnitCost: String((oldCost + addCost) / newQty),
          };
        } else {
          wh.items[d.resourceId] = {
            resourceId: d.resourceId,
            quantity: d.quantity,
            averageUnitCost: String(actualUnitCost),
          };
        }
        continue;
      }

      // ── 2. Бизнес (розница напрямую) ──────────────────
      if (d.businessId) {
        const bizIdx = businesses.findIndex((b) => b.id === d.businessId);
        if (bizIdx < 0) {
          remainingDeliveries.push(d);
          continue;
        }
        const biz = businesses[bizIdx];
        if (!biz.inventory) biz.inventory = {};
        const existing = biz.inventory[d.resourceId];
        if (existing) {
          const newQty = existing.quantity + d.quantity;
          const oldCost = Number(existing.averageUnitCost) * existing.quantity;
          const addCost = actualUnitCost * d.quantity;
          biz.inventory[d.resourceId] = {
            quantity: newQty,
            averageUnitCost: String((oldCost + addCost) / newQty),
          };
        } else {
          biz.inventory[d.resourceId] = {
            quantity: d.quantity,
            averageUnitCost: String(actualUnitCost),
          };
        }
        continue;
      }

      // ── 3. Безадресная доставка (старое сохранение) — потеряна ──
      toast.error(`Доставка потеряна: ${d.quantity} × ${d.resourceId}`);
    }

    set({
      warehouses,
      businesses,
      pendingDeliveries: remainingDeliveries,
    });

    toast.success(`Прибыли доставки: ${arrived.length}`);
  },
  saveGame: () => {
    saveToStorage(browserStorage, get().getSavePayload());
  },

  loadGame: (saveData: any) => {
    if (!saveData || typeof saveData !== 'object') return;

    // Миграция старого сейва: если был legacy-warehouse, переносим его в warehouses.
    const legacyWh = saveData.warehouse as Warehouse | undefined;
    const migratedWarehouses: WarehouseRuntime[] = saveData.warehouses ?? [];

    if (legacyWh && legacyWh.items && Object.keys(legacyWh.items).length > 0 && migratedWarehouses.length === 0) {
      migratedWarehouses.push({
        id: 'wh_legacy',
        customName: 'Старый склад',
        size: 'small',
        capacity: legacyWh.capacity ?? 10_000,
        items: { ...legacyWh.items },
        employees: [],
        hasTrucks: false,
        mode: 'personal',
        reserved: {},
      });
    }

    const { warehouse: _legacyWarehouse, ...restSaveData } = saveData as Record<string, unknown>;
    void _legacyWarehouse;
    set(restSaveData as Partial<GameState>);
    set({
      warehouses: migratedWarehouses,
      propertyMode: saveData.propertyMode ?? {},
      activeRentalOffers: saveData.activeRentalOffers ?? {},
      rentedProperties: saveData.rentedProperties ?? {},
      enterprises: saveData.enterprises ?? [],
      headOfficeId: saveData.headOfficeId ?? null,
      gameOver: saveData.gameOver ?? false,
      monthlyNpcSold: saveData.monthlyNpcSold ?? {},
      marketIndex: saveData.marketIndex ?? 1,
    });
    // Миграция: удалённые бизнесы — вернуть деньги.
    const REMOVED_BUSINESS_IDS = [
      'fastfood', 'warehouse',
      'coffee_roastery', 'food_factory', 'energy_drinks_plant', 'snack_factory',
      'it_startup', 'web_studio', 'ad_agency',
    ];
    const isRemoved = (b: { defId?: string }) =>
      b.defId !== undefined && REMOVED_BUSINESS_IDS.includes(b.defId);
    const removedBiz = get().businesses.filter(isRemoved);
    if (removedBiz.length > 0) {
      const refund = removedBiz.reduce((sum, b) => {
        const cash = Number(b.cashBalance ?? 0);
        const monthlyGross = Number(b.baseMonthlyRevenue ?? 0) * (b.level ?? 1);
        const monthlyExpenses =
          Number(b.monthlyPayroll ?? 0) +
          Number(b.monthlyRent ?? 0) +
          Number(b.monthlyUtilities ?? 0) +
          Number(b.monthlyMaintenance ?? 0);
        const monthlyProfit = Math.max(0, monthlyGross - monthlyExpenses);
        return sum + cash + monthlyProfit * 12;
      }, 0);
      set((st) => ({
        businesses: st.businesses.filter((b) => !isRemoved(b)),
      }));
      if (refund > 0) {
        get().recordTransaction({
          direction: 'income',
          amount: String(refund),
          category: 'business_refund',
          description: 'Возврат при удалении бизнеса',
        });
      }
    }
    // Синхронизировать clock с сохранённым totalGameMonths
    const { totalGameMonths } = get();
    if (typeof totalGameMonths === 'number') {
      useClockStore.getState().load({ monthIndex: totalGameMonths });
      // Рыночный тик месячный: индекс == номеру месяца. Догоняющих тиков нет.
      set({
        lastMarketTickIndex: totalGameMonths,
        marketTickMinuteIndex: totalGameMonths,
      });
    }
  },

  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  refreshQuestsIfNeeded: () => {
    const s = get();
    const key = todayKey();
    if (s.questsDate !== key) {
      set({ quests: pickDailyQuests(Date.now()), questsDate: key });
    }
  },

  buyProperty: (id) => {
    const def = REAL_ESTATE.find((r) => r.id === id);
    if (!def) return;
    const s = get();
    if (s.ownedProperty.includes(id)) return;
    if (moneyToNumber(s.balanceDecimal) < def.price) return;
    const result = get().recordTransaction({
      direction: 'expense',
      amount: def.price,
      category: 'property',
      description: `Покупка недвижимости: ${def.name}`,
      relatedEntityId: id,
    });
    if (!result.ok) return;

    // Если это склад — создаём WarehouseRuntime
    const newWarehouses = [...s.warehouses];
    if (def.category === 'warehouse') {
      const size: 'small' | 'medium' | 'large' | 'huge' =
        def.area >= 300_000 ? 'huge' :
        def.area >= 150_000 ? 'large' :
        def.area >= 50_000 ? 'medium' : 'small';

      newWarehouses.push({
        id,
        customName: def.name,
        size,
        capacity: def.area,
        items: {},
        employees: [],
        hasTrucks: false,
        mode: 'personal',
        reserved: {},
        createdAtMonth: Math.floor(s.totalGameMonths),
      });
    }

    set((st) => ({
      ownedProperty: [...st.ownedProperty, id],
      warehouses: newWarehouses,
    }));

    toast.success(`Приобретено: «${def.name}»`, {
      description: def.category === 'warehouse'
        ? 'Склад доступен в разделе Бизнесы → Склады'
        : `+${def.bonusPercent}% к доходу бизнесов`,
    });
    get().pushNotification(`Приобретено имущество: «${def.name}»`);
  },
  buyTransport: (id) => {
    const def = TRANSPORT.find((t) => t.id === id);
    if (!def) return;
    const s = get();
    if (s.ownedTransport.includes(id)) return;
    if (moneyToNumber(s.balanceDecimal) < def.price) return;
    const result = get().recordTransaction({
      direction: 'expense',
      amount: def.price,
      category: 'transport',
      description: `Покупка транспорта: ${def.name}`,
      relatedEntityId: id,
    });
    if (!result.ok) return;
    set((st) => ({ ownedTransport: [...st.ownedTransport, id] }));
    toast.success(`Приобретено: «${def.name}»`, {
      description: `+${def.reputation.toLocaleString('ru-RU')} репутации`,
    });
    get().pushNotification(`Приобретён транспорт: «${def.name}»`);
  },

  claimQuest: (id) => {
    const s = get();
    const quest = s.quests.find((q) => q.id === id);
    if (!quest || quest.claimed || quest.progress < quest.target) return;
    const result = get().recordTransaction({
      direction: 'income',
      amount: quest.reward,
      category: 'quest',
      description: `Квест: ${id}`,
    });
    if (!result.ok) return;
    set((st) => ({
      quests: st.quests.map((q) => (q.id === id ? { ...q, claimed: true } : q)),
    }));  },

  claimAchievement: (id) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    const s = get();
    if (s.achievementsClaimed.includes(id)) return;
    let current = 0;
    if (def.type === 'totalEarned') current = s.totalEarned;
    if (def.type === 'businessCount') current = (s.businesses ?? []).length;
    if (def.type === 'companyLevel') current = getCompanyLevel(s);
    if (def.type === 'gamesPlayed') current = s.lifetimeGames;
    if (current < def.target) return;
    const result = get().recordTransaction({
      direction: 'income',
      amount: def.reward,
      category: 'achievement',
      description: `Достижение: ${id}`,
      relatedEntityId: id,
    });
    if (!result.ok) return;
    set((st) => ({ achievementsClaimed: [...st.achievementsClaimed, id] }));
  },

  setCompanyName: (name) => set({ companyName: name.slice(0, 24) || 'Моя Империя' }),
  setTheme: (theme) => set((st) => ({ settings: { ...st.settings, theme } })),
  toggleSetting: (key) => set((st) => ({ settings: { ...st.settings, [key]: !st.settings[key] } })),
  setSetting: (key, value) => set((st) => ({ settings: { ...st.settings, [key]: value } })),
  toggleFavorite: (id) =>
    set((st) => ({
      favoriteBusinesses: st.favoriteBusinesses.includes(id)
        ? st.favoriteBusinesses.filter((f) => f !== id)
        : [...st.favoriteBusinesses, id],
    })),


  changeCareer: (careerId) => {
  set({ currentCareerId: careerId });
  toast.success(`Вы устроились на новую должность!`);
},
workCareer: () => {
  const s = get();
  if (!s.currentCareerId) return { ok: false, reason: 'Выберите профессию' };
  const career = CAREERS_BY_ID[s.currentCareerId];
  if (!career) return { ok: false, reason: 'Профессия не найдена' };
  
  const prog = s.careerProgress[s.currentCareerId] || { careerId: s.currentCareerId, stageIndex: 0, experience: 0, lastWorkedMonth: -1 };
  if (Math.floor(s.totalGameMonths) <= prog.lastWorkedMonth) {
    return { ok: false, reason: 'Вы уже работали в этом месяце' };
  }
  if (s.energy < career.energyCost) return { ok: false, reason: 'Недостаточно энергии' };

  const mult = career.levelMultipliers[prog.stageIndex];
  const paid = career.baseIncome * mult;
  
  const nextExp = prog.experience + 10;
  let nextStageIndex = prog.stageIndex;
  // Повышение ступени (каждые 100 опыта, до 9 ступени)
  while (nextStageIndex < 8 && nextExp >= (nextStageIndex + 1) * 100) {
    nextStageIndex++;
  }

  const nextProg = { ...prog, experience: nextExp, stageIndex: nextStageIndex, lastWorkedMonth: Math.floor(s.totalGameMonths) };
  
  get().recordTransaction({ direction: 'income', amount: paid, category: 'work', description: `Работа: ${career.name}` });
  set({
    energy: s.energy - career.energyCost,
    careerProgress: { ...s.careerProgress, [s.currentCareerId]: nextProg },
    totalEarned: s.totalEarned + paid
  });
  toast.success(`Вы заработали ${formatMoney(paid)}!`);
  return { ok: true };
},
rest: () => {
  const s = get();
  if (Math.floor(s.totalGameMonths) <= s.lastRestMonth) return { ok: false, reason: 'Отдыхать можно раз в месяц' };
  set({ energy: 100, lastRestMonth: Math.floor(s.totalGameMonths) });
  toast.success('Вы отдохнули. Энергия восстановлена!');
  return { ok: true };
},
  // ========== ДОСТАВКА НА ДОМ ==========
  buyFoodItem: (foodId, quantity) => {
    const def = FOOD_ITEMS_BY_ID[foodId];
    if (!def) return { ok: false, reason: 'Блюдо не найдено' };
    if (quantity <= 0) return { ok: false, reason: 'Некорректное количество' };

    const total = def.price * quantity;
    const s = get();
    if (moneyToNumber(s.balanceDecimal) < total) {
      return { ok: false, reason: 'Недостаточно средств' };
    }

    const tx = get().recordTransaction({
      direction: 'expense',
      amount: total,
      category: 'food_delivery',
      description: `Доставка: ${def.name} × ${quantity}`,
      relatedEntityId: foodId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Ошибка' };

    set((st) => ({
      personalInventory: {
        ...st.personalInventory,
        [foodId]: (st.personalInventory[foodId] ?? 0) + quantity,
      },
    }));
    toast.success(`Заказано: ${def.name} × ${quantity}`, {
      description: `${def.emoji} +${def.energyRestore * quantity} энергии при употреблении`,
    });
    return { ok: true };
  },

  consumeFoodItem: (foodId) => {
    const def = FOOD_ITEMS_BY_ID[foodId];
    if (!def) return { ok: false, reason: 'Блюдо не найдено' };
    const s = get();
    const have = s.personalInventory[foodId] ?? 0;
    if (have <= 0) return { ok: false, reason: 'Нет в инвентаре' };

    const nextEnergy = Math.min(100, s.energy + def.energyRestore);
    set((st) => {
      const nextInv = { ...st.personalInventory };
      if (have - 1 <= 0) delete nextInv[foodId];
      else nextInv[foodId] = have - 1;
      return { energy: nextEnergy, personalInventory: nextInv };
    });
    toast.success(`Съедено: ${def.name}`, {
      description: `+${nextEnergy - s.energy} энергии`,
    });
    return { ok: true };
  },
  // ===== DevTools =====
  addBalance: (amount: number) => {
    if (amount === 0) return;
    get().recordTransaction({
      direction: amount > 0 ? 'income' : 'expense',
      amount: Math.abs(amount),
      category: 'devtools',
      description: 'DevTools: addBalance',
    });
    if (amount > 0) {
      set((s) => ({ totalEarned: s.totalEarned + amount }));
    }
  },
      recordTransaction: (input) => {
    const s = get();
    const monthIndex = s.totalGameMonths;

    const result = applyWalletTransaction({
      balance: s.balanceDecimal,
      amount: toDecimal(input.amount).toString(),
      direction: input.direction,
      monthIndex,
      accountId: 'player_main',
      category: input.category,
      description: input.description,
      allowNegative: input.allowNegative,
      relatedEntityId: input.relatedEntityId,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    // Обрезаем журнал — храним только последние N месяцев
    const minMonth = monthIndex - s.financeJournalKeepMonths;
    const trimmedJournal = [
      ...s.financeJournal.filter((e) => e.monthIndex >= minMonth),
      result.entry,
    ];

    set({
      balanceDecimal: result.balance,
      balance: moneyToNumber(result.balance),
      financeJournal: trimmedJournal,
    });

    return { ok: true };
  },

  getMonthLedger: (monthIndex) => {
    const allEntries = get().financeJournal.filter(
      (e) => e.monthIndex === monthIndex,
    );
    // Считаем только операции по кошельку игрока. Бизнес-счета
    // (accountId = 'business:xxx') — внутренние, в доход/расход игрока не идут.
    let income: Money = '0';
    let expenses: Money = '0';
    for (const entry of allEntries) {
      if (entry.accountId !== 'player_main') continue;
      if (entry.direction === 'income') {
        income = moneyAdd(income, entry.amount);
      } else {
        expenses = moneyAdd(expenses, entry.amount);
      }
    }
    return {
      income,
      expenses,
      net: moneySub(income, expenses),
      entries: allEntries,
    };
  },
    getMonthLedgerByCategory: (monthIndex) => {
    const entries = get().financeJournal.filter((e) => e.monthIndex === monthIndex);
    const income: Record<string, Money> = {};
    const expenses: Record<string, Money> = {};

    for (const entry of entries) {
      const bucket = entry.direction === 'income' ? income : expenses;
      const current = bucket[entry.category];
      bucket[entry.category] = current
        ? moneyAdd(current, entry.amount)
        : entry.amount;
    }

    return { income, expenses };
  },

  // ========== ФОНДОВЫЙ РЫНОК ==========
  buyShares: (companyId, shares) => {
    const s = get();
    const company = s.marketCompanies.find((c) => c.id === companyId);
    if (!company) return { ok: false, reason: 'Компания не найдена' };

    const existing = s.marketPositions.find((p) => p.companyId === companyId);
    const result = buyShares({
      cash: s.balanceDecimal,
      companyId,
      currentPrice: company.price,
      shares,
      existingPosition: existing,
      policy: TRADE_POLICY,
    });
    if (!result.ok) return { ok: false, reason: result.reason };

    const { result: trade } = result;
    const gross = trade.grossAmount;
    const commission = trade.commission;
    const total = moneyAdd(gross, commission);

    // Списать деньги (gross + commission) через recordTransaction
    const tx = get().recordTransaction({
      direction: 'expense',
      amount: total,
      category: 'stock_buy',
      description: `Покупка акций: ${company.name} × ${shares}`,
      relatedEntityId: companyId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Не удалось списать' };

    // Обновить портфель
    const newPositions = existing
      ? s.marketPositions.map((p) => (p.companyId === companyId ? trade.position! : p))
      : [...s.marketPositions, trade.position!];

    set({
      marketPositions: newPositions,
    });

    toast.success(`Куплено ${shares} акций ${company.name}`, {
      description: `Потрачено ${formatMoney(total)}`,
    });
    return { ok: true };
  },

  sellShares: (companyId, shares) => {
    const s = get();
    const company = s.marketCompanies.find((c) => c.id === companyId);
    if (!company) return { ok: false, reason: 'Компания не найдена' };
    const position = s.marketPositions.find((p) => p.companyId === companyId);
    if (!position) return { ok: false, reason: 'Нет такой позиции' };

    const result = sellShares({
      cash: s.balanceDecimal,
      companyId,
      currentPrice: company.price,
      shares,
      position,
      policy: TRADE_POLICY,
    });
    if (!result.ok) return { ok: false, reason: result.reason };

    const { result: trade } = result;
    const net = trade.cash;
    const proceeds = moneySub(net, s.balanceDecimal); // разница

    // Начислить средства через recordTransaction
    const tx = get().recordTransaction({
      direction: 'income',
      amount: proceeds,
      category: 'stock_sell',
      description: `Продажа акций: ${company.name} × ${shares}`,
      relatedEntityId: companyId,
    });
    if (!tx.ok) return { ok: false, reason: tx.reason ?? 'Не удалось начислить' };

    const newPositions = trade.position
      ? s.marketPositions.map((p) => (p.companyId === companyId ? trade.position! : p))
      : s.marketPositions.filter((p) => p.companyId !== companyId);

    set({ marketPositions: newPositions });

    const profit = trade.realizedPnl;
    toast.success(`Продано ${shares} акций ${company.name}`, {
      description: `Получено ${formatMoney(proceeds)} · P&L ${formatMoney(profit)}`,
    });
    return { ok: true, profit };
  },

  hardReset: () => {
    const initial = (useGameStore as any).getInitialState?.();
    if (initial) set(initial);
    useClockStore.getState().reset();
  },
}));

export { QUEST_POOL };

// Сохраняем "чистое" начальное состояние для сброса.
// ВАЖНО: не пропускаем через JSON — иначе вырежутся все actions (функции),
// и после hardReset стор останется без recordTransaction, buyShares и т.д.
const _initial = useGameStore.getState();
(useGameStore as any).getInitialState = () => _initial;
// DevTools: доступ к стору из консоли браузера (только в dev).
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as any).__game = useGameStore;
}