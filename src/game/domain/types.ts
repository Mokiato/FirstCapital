export type Id = string;
export type Money = string;

export interface ClockState {
  /**
   * Количество полностью завершённых игровых месяцев.
   * При старте обычно равно 0.
   */
  monthIndex: number;

  /**
   * Прошедшее игровое время текущего месяца в миллисекундах.
   */
  monthProgressMs: number;

  /**
   * Скорость симуляции: 1, 2, 4 и т. п.
   */
  speed: number;

  paused: boolean;
}

export type StockVolatility =
  | 'stable'
  | 'moderate'
  | 'volatile'
  | 'speculative';

export interface PricePoint {
  minuteIndex: number;
  monthIndex: number;
  price: Money;
}

export interface MarketCompany {
  id: Id;
  name: string;
  sectorId: string;

  price: Money;
  history: PricePoint[];
  lastChangePct: number;

  volatility: StockVolatility;
  annualGrowth: number;
  annualDividendYield: number;

  monthlyRevenue: Money;
  monthlyProfit: Money;
  debt: Money;
  reputation: number;
  marketShare: number;

  competitorEligible: boolean;
  isActiveCompetitor: boolean;
}

export interface StockPosition {
  companyId: Id;
  shares: number;
  averageBuyPrice: Money;
  realizedPnl: Money;
}

export type ResourceKind =
  | 'raw'
  | 'finished'
  | 'food'
  | 'drink'
  | 'equipment';

export interface ResourceDefinition {
  id: Id;
  name: string;
  category: string;
  unit: string;
  kind: ResourceKind;

  /**
   * Игровая закупочная цена за одну единицу.
   */
  unitPrice: Money;

  /**
   * Необязательный идентификатор компании-поставщика.
   */
  supplierCompanyId?: Id;
}

export interface ResourceRequirement {
  resourceId: Id;

  /**
   * Сколько единиц требуется на один уровень бизнеса в месяц.
   */
  unitsPerLevel: number;
}

export interface InventoryItem {
  resourceId: Id;
  quantity: number;
  averageUnitCost: Money;
}

export interface Warehouse {
  capacity: number;
  items: Record<Id, InventoryItem>;
}

export type BusinessStatus = 'operating' | 'stopped' | 'closed';

export interface BusinessRuntime {
  id: Id;
  /** Ссылка на BusinessDef из data/businesses.ts */
  defId?: Id;
  name: string;
  sectorId: string;
    /** ID склада, к которому привязан бизнес. Если undefined — работает напрямую. */
  linkedWarehouseId?: string;
    /** Локальный инвентарь бизнеса (для розничных закупок напрямую). */
  inventory?: Record<string, { quantity: number; averageUnitCost: Money }>;
    /** Месяц, в который бизнес получил стартовую поставку (первый месяц бесплатно). */
  initialSuppliedMonth?: number;
  level: number;

  status: BusinessStatus;

  /**
   * Оборотные средства бизнеса.
   */
  cashBalance: Money;

  /**
   * Базовая выручка за игровой месяц до множителей.
   */
  baseMonthlyRevenue: Money;

  demandMultiplier: number;
  productivityMultiplier: number;

  monthlyPayroll: Money;
  monthlyRent: Money;
  monthlyUtilities: Money;
  monthlyMaintenance: Money;

  taxRate: number;

  resourceNeeds: ResourceRequirement[];

  monthsWithoutSupply: number;
  monthsStopped: number;

  /**
   * Расходы, отражённые в учёте, но пока не оплаченные.
   */
  accruedLiabilities: Money;
    /** Насколько бизнес «чист» перед налоговой. 0..1. Заглушка под будущую налоговую. */
  compliance?: number;
}

/** Управляющий персонал — не более 1 на бизнес. */
export const MANAGEMENT_ROLES = [
  'manager', 'hr', 'logist', 'marketer', 'accountant', 'holding_manager',
] as const;

/** Специфический рабочий персонал — зависит от бизнеса/предприятия. */
export const WORKER_ROLES = [
  // Общепит
  'barista', 'waiter', 'cook_brigadier', 'cook', 'dishwasher', 'tea_master',
  'baker', 'baker_assistant', 'confectioner', 'confectioner_assistant',
  // Розница
  'cashier', 'seller_floor', 'seller_consultant', 'storekeeper_retail', 'pharmacist',
  // Медицина
  'doctor', 'nurse', 'registrar', 'lab_assistant',
  // Кино
  'ticket_cashier', 'buffet_seller', 'projectionist', 'hall_cleaner', 'guard',
  // Гостиница
  'receptionist', 'maid', 'building_technician', 'breakfast_cook', 'breakfast_staff',
  // Авто
  'auto_mechanic', 'auto_electrician', 'reception_master',
  'car_washer', 'equipment_technician',
  // Логистика
  'truck_driver', 'loader_logistics', 'dispatcher', 'courier', 'order_operator',
  // Нефть
  'well_operator', 'drilling_operator', 'repair_mechanic', 'safety_specialist',
  'process_operator', 'pipe_fitter',
  // Производства
  'line_operator', 'packer', 'mechanic', 'qc_inspector', 'mixer_operator',
  'packaging_operator', 'forklift_driver', 'lab_technician',
  'welder', 'locksmith_assembler', 'machine_operator',
  'carpenter', 'furniture_assembler', 'upholsterer',
  'parts_assembler', 'refrigeration_assembler', 'electro_mechanic',
  'equipment_tester', 'electrician_assembler', 'electronics_technician',
  'test_specialist', 'cutter', 'seamstress', 'finisher',
  'chem_operator', 'sterilization_specialist', 'medical_packer',
  'pump_technician', 'test_stand_operator',
  'waste_sorter', 'recycling_operator',
  'glass_cutter', 'window_assembler', 'glass_unit_assembler',
  'drink_operator', 'bottling_operator',
  // Офисы
  'architect', 'engineer_constructor', 'cad_specialist',
  'system_engineer', 'implementation_specialist', 'support_specialist',
  'bookkeeper', 'auditor', 'document_specialist',
  'recruiter', 'trainer', 'courses_coordinator',
  'lawyer', 'tender_specialist', 'document_assistant',
  'procurement_analyst', 'supplier_specialist', 'warehouse_analyst',
  'certification_specialist', 'document_designer',
  'maintenance_engineer', 'repair_technician', 'request_dispatcher',
  'property_specialist', 'rental_specialist', 'building_tech',
  'insurance_consultant', 'risk_specialist', 'claims_specialist',
  'market_analyst', 'data_analyst', 'research_specialist',
] as const;

export type EmployeeRole =
  | (typeof MANAGEMENT_ROLES)[number]
  | (typeof WORKER_ROLES)[number];


export interface EmployeeRuntime {
  id: Id;
  businessId: Id;
  role: EmployeeRole;
  name: string;

  qualification: number;
  monthlySalary: Money;

  monthsEmployed: number;
  monthsRemaining: number;
}

export interface CareerProgress {
  careerId: string;
  stageIndex: number;
  experience: number;
  lastWorkedMonth: number;
}


export interface EventEffect {
  kind:
    | 'sectorDemand'
    | 'sectorCost'
    | 'resourcePrice'
    | 'companyPrice';

  targetId: Id;
  multiplier: number;
}

export interface EventTemplate {
  id: Id;
  title: string;
  description: string;

  weight: number;
  durationMonths: number;

  effects: EventEffect[];
}

export interface ActiveEvent {
  id: Id;
  templateId: Id;
  title: string;
  description: string;

  startedAtMonth: number;
  endsAtMonth: number;

  effects: EventEffect[];
}

export interface NewsItem {
  id: Id;
  monthIndex: number;
  title: string;
  body: string;

  companyId?: Id;
  eventId?: Id;
  category?: string;
}

export type ContractStatus =
  | 'available'
  | 'active'
  | 'completed'
  | 'failed';

export interface ContractRuntime {
  id: Id;
  title: string;
  description: string;

  clientCompanyId?: Id;

  resourceId: Id;
  requiredQuantity: number;
  deliveredQuantity: number;

  reward: Money;

  createdAtMonth: number;
  deadlineMonth: number;

  status: ContractStatus;
}

export type LoanStatus =
  | 'active'
  | 'paid'
  | 'defaulted';
/** Срочный вклад: деньги заблокированы на N месяцев. */
export interface FixedDeposit {
  id: string;
  amount: Money;
  termMonths: number;
  monthsLeft: number;
  /** Месячная ставка с капитализацией (0.005 = 0.5% в месяц). */
  monthlyRate: number;
}
export interface LoanRuntime {
  id: Id;

  originalPrincipal: Money;
  balance: Money;
  arrears: Money;

  monthlyRate: number;
  monthlyPayment: Money;

  termMonths: number;
  monthsRemaining: number;

  overdueMonths: number;
  issuedAtMonth: number;

  status: LoanStatus;
}

export interface FundDefinition {
  id: Id;
  name: string;

  /**
   * Годовая ожидаемая доходность в долях:
   * 0.08 означает 8% годовых.
   */
  annualYield: number;

  /**
   * Максимальное ожидаемое случайное колебание за месяц.
   * Например 0.002 — примерно 0.2%.
   */
  monthlyVolatility: number;
}

export interface FundPosition {
  fundId: Id;
  invested: Money;
  currentValue: Money;
}

export interface BondDefinition {
  id: Id;
  name: string;
  annualCouponRate: number;
  maturityMonths: number;
  faceValue: Money;
  purchasePrice: Money;
}

export interface BondPosition {
  bondId: Id;
  quantity: number;
  currentValue: Money;
  monthsToMaturity: number;
}

export interface MetalPosition {
  metalId: Id;
  quantity: number;
  currentPrice: Money;
}

export interface CapitalSnapshotBreakdown {
  cash: Money;
  businesses: Money;
  funds: Money;
  bonds: Money;
  metals: Money;
  stocks: Money;
  realEstate: Money;
  transport: Money;
  liabilities: Money;
}
export interface PendingDelivery {
  id: string;
  resourceId: string;
  quantity: number;
  orderedAtMonth: number;
  arrivalAtMonth: number;
  cost: Money;
  /** Куда идёт доставка: на склад или напрямую в бизнес. */
  warehouseId?: string;
  businessId?: string;
}
export interface CapitalSnapshot {
  monthIndex: number;
  capital: Money;
  /** Детализация на момент снимка (опциональна для старых снимков) */
  breakdown?: CapitalSnapshotBreakdown;
}

export interface CareerStage {
  title: string;
  requiredExperience: number;
  incomeMultiplier: number;
  rewardDescription?: string;
}

export interface CareerDefinition {
  id: Id;
  title: string;
  unlockCompanyLevel: number;

  baseMonthlyPay: Money;
  energyCost: number;

  stages: CareerStage[];
}

export interface CompetitorRuntime {
  id: Id;
  companyId: Id;
  companyName: string;
  sectorId: Id;

  priceMultiplier: number;
  reputation: number;
  marketShare: number;
  aggressiveness: number;

  activeSinceMonth: number;
}