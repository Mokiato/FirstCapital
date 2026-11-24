// src/data/businesses.ts
// Каталог 21 базового бизнеса. Баланс — GDD v2.0, Таблица 14.2.
// Сырьё = Σ keyResources × basePrice при 1.00 × P_market.
// ФОТ (payroll) — базовый рабочий штат; управленцы нанимаются сверх него.

export type BusinessKind = 'service' | 'retail' | 'production' | 'logistics' | 'office';
export type RoomType = 'rent' | 'buy_or_rent' | 'warehouse' | 'production';
export type StaffRole = 'manager' | 'hr' | 'accountant' | 'holding_manager';
export type ManualOp = 'clean' | 'order_stock' | 'pay_bills';

export interface BusinessDef {
  id: string;
  name: string;
  kind: BusinessKind;
  roomType: RoomType;
  keyResources: Record<string, number>;
  /** Ориентир выручки при 100% загрузке (GDD §7.1). */
  baseRevenue: number;
  fixedCosts: number;
  /** Базовый месячный ФОТ рабочего штата (GDD §9.1). */
  payroll: number;
  /** Ориентир наценки к себестоимости сырья (для перехода на продажи). */
  retailMarkup: number;
  staffRoles: StaffRole[];
  unlockLevel: number;
  paybackTarget: [number, number];
  startingEquipment?: number;
  premisesPrice?: number;
  manualOps?: ManualOp[];
  produces?: Record<string, number>;
  requiredEquipment?: Record<string, number>;
  workerStaff?: Record<string, number>;
}

export const BUSINESSES: BusinessDef[] = [
  // ─── Услуги ─────────────────────────────────────────────────────────────
  {
    id: 'coffee_shop', name: 'Кофейня', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { roasted_coffee: 40, milk: 280, water: 120, packaging: 160 },
    baseRevenue: 210_000, fixedCosts: 35_000, payroll: 48_000, retailMarkup: 3.39,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 0,
    paybackTarget: [6, 9], startingEquipment: 223_000, premisesPrice: 700_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { barista: 2, cashier: 1 },
  },
  {
    id: 'tea_house', name: 'Чайная', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { tea: 32, milk: 200, water: 160 },
    baseRevenue: 190_000, fixedCosts: 30_000, payroll: 45_000, retailMarkup: 3.65,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 1,
    paybackTarget: [5, 8], startingEquipment: 208_000, premisesPrice: 600_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { tea_master: 2, cashier: 1, waiter: 1 },
  },
  {
    id: 'restaurant', name: 'Ресторан', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { food: 550, drinks: 350, semi_finished: 200, packaging: 400 },
    baseRevenue: 620_000, fixedCosts: 110_000, payroll: 165_000, retailMarkup: 2.88,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 5,
    paybackTarget: [9, 12], startingEquipment: 625_000, premisesPrice: 2_200_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { cook_brigadier: 1, cook: 2, waiter: 2, cashier: 1, dishwasher: 1 },
  },
  {
    id: 'fitness', name: 'Фитнес-клуб', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { water: 1500, cleaning: 100, drinks: 200 },
    baseRevenue: 420_000, fixedCosts: 85_000, payroll: 145_000, retailMarkup: 7.64,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 7,
    paybackTarget: [8, 11], startingEquipment: 810_000, premisesPrice: 1_850_000,
    manualOps: ['clean', 'pay_bills'],
    workerStaff: { trainer: 2, receptionist: 1, hall_cleaner: 1 },
  },
  {
    id: 'cinema', name: 'Кинотеатр', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { snacks: 600, drinks: 400, energy_drinks: 100, cleaning: 45 },
    baseRevenue: 640_000, fixedCosts: 130_000, payroll: 180_000, retailMarkup: 4.92,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 12,
    paybackTarget: [10, 13], startingEquipment: 1_260_000, premisesPrice: 2_900_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { electronics: 2, refrigeration: 1 },
    workerStaff: { ticket_cashier: 1, buffet_seller: 1, projectionist: 1, hall_cleaner: 1, guard: 1 },
  },
  {
    id: 'hotel', name: 'Гостиница', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { food: 450, drinks: 300, cleaning: 100 },
    baseRevenue: 880_000, fixedCosts: 180_000, payroll: 260_000, retailMarkup: 6.29,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 15,
    paybackTarget: [9, 12], startingEquipment: 1_838_000, premisesPrice: 4_200_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { furniture: 5, lighting: 3, filters: 1 },
    workerStaff: { receptionist: 2, maid: 3, building_technician: 1, breakfast_cook: 1, breakfast_staff: 1 },
  },
  {
    id: 'autoservice', name: 'Автосервис', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { parts: 30, chem: 40, fuel: 100, lubricants: 20 },
    baseRevenue: 480_000, fixedCosts: 70_000, payroll: 145_000, retailMarkup: 3.10,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 9,
    paybackTarget: [9, 12], startingEquipment: 619_000, premisesPrice: 1_500_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { metal_structures: 2 },
    workerStaff: { auto_mechanic: 3, auto_electrician: 1, reception_master: 1 },
  },
  {
    id: 'carwash', name: 'Автомойка', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { water: 1500, chem: 80, cleaning: 80 },
    baseRevenue: 250_000, fixedCosts: 45_000, payroll: 70_000, retailMarkup: 4.55,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [7, 10], startingEquipment: 380_000, premisesPrice: 950_000,
    manualOps: ['clean', 'order_stock'],
    workerStaff: { car_washer: 3, cashier: 1, equipment_technician: 1 },
  },
  {
    id: 'construction_co', name: 'Строительная компания', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { building_mat: 20, construction_mix: 220, windows: 10 },
    baseRevenue: 1_200_000, fixedCosts: 160_000, payroll: 360_000, retailMarkup: 2.86,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 20,
    paybackTarget: [11, 14], startingEquipment: 1_820_000, premisesPrice: 3_600_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { engineer_constructor: 1, welder: 2, locksmith_assembler: 2, building_tech: 1, document_specialist: 1 },
  },

  // ─── Розница ────────────────────────────────────────────────────────────
  {
    id: 'grocery_store', name: 'Продуктовый магазин', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { food: 700, drinks: 500, snacks: 250, semi_finished: 80 },
    baseRevenue: 435_000, fixedCosts: 55_000, payroll: 65_000, retailMarkup: 1.81,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 2,
    paybackTarget: [8, 11], startingEquipment: 125_000, premisesPrice: 1_150_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { refrigeration: 2 },
    workerStaff: { cashier: 2, seller_floor: 2, storekeeper_retail: 1 },
  },
  {
    id: 'electronics_store', name: 'Магазин электроники', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { electronics: 30, lighting: 6, packaging: 40 },
    baseRevenue: 845_000, fixedCosts: 95_000, payroll: 120_000, retailMarkup: 1.80,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 10,
    paybackTarget: [9, 12], startingEquipment: 670_000, premisesPrice: 2_100_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { lighting: 5 },
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'clothing_store', name: 'Магазин одежды', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { clothes: 190 },
    baseRevenue: 560_000, fixedCosts: 75_000, payroll: 90_000, retailMarkup: 1.96,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 6,
    paybackTarget: [8, 11], startingEquipment: 400_000, premisesPrice: 1_600_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'sport_store', name: 'Магазин спорттоваров', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { sport_goods: 94 },
    baseRevenue: 455_000, fixedCosts: 60_000, payroll: 75_000, retailMarkup: 1.94,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 5,
    paybackTarget: [9, 12], startingEquipment: 325_000, premisesPrice: 1_300_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'pharmacy', name: 'Аптека', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { meds: 550, med_supplies: 60 },
    baseRevenue: 395_000, fixedCosts: 50_000, payroll: 75_000, retailMarkup: 2.03,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [9, 12], startingEquipment: 315_000, premisesPrice: 1_100_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { pharmacist: 2, cashier: 1 },
  },

  // ─── Медицина ───────────────────────────────────────────────────────────
  {
    id: 'clinic', name: 'Медицинская клиника', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { meds: 600, med_supplies: 200, cleaning: 200 },
    baseRevenue: 1_350_000, fixedCosts: 200_000, payroll: 420_000, retailMarkup: 4.22,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 20,
    paybackTarget: [11, 14], startingEquipment: 1_080_000, premisesPrice: 4_500_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { med_equipment: 1 },
    workerStaff: { doctor: 2, nurse: 2, registrar: 1, lab_assistant: 1 },
  },

  // ─── Логистика ──────────────────────────────────────────────────────────
  {
    id: 'courier_service', name: 'Курьерская служба', kind: 'logistics', roomType: 'warehouse',
    keyResources: { fuel: 750, packaging: 250 },
    baseRevenue: 280_000, fixedCosts: 45_000, payroll: 90_000, retailMarkup: 4.31,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 3,
    paybackTarget: [7, 10], startingEquipment: 340_000, premisesPrice: 900_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { courier: 4, order_operator: 1 },
  },
  {
    id: 'logistics_company', name: 'Логистическая компания', kind: 'logistics', roomType: 'warehouse',
    keyResources: { fuel: 1500, parts: 22, packaging: 40 },
    baseRevenue: 680_000, fixedCosts: 105_000, payroll: 210_000, retailMarkup: 3.49,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 8,
    paybackTarget: [9, 12], startingEquipment: 950_000, premisesPrice: 2_200_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { truck_driver: 3, loader_logistics: 2, dispatcher: 1 },
  },

  // ─── Пищевые производства ───────────────────────────────────────────────
  {
    id: 'bakery', name: 'Пекарня', kind: 'production', roomType: 'production',
    keyResources: { flour: 2500, milk: 800, sugar: 300, packaging: 346 },
    baseRevenue: 349_920, fixedCosts: 40_000, payroll: 55_000, retailMarkup: 1.92,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 2,
    paybackTarget: [7, 10], startingEquipment: 178_200, premisesPrice: 800_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    produces: { pastry: 6480 },
    workerStaff: { baker: 2, baker_assistant: 1, cashier: 1 },
  },
  {
    id: 'confectionery', name: 'Кондитерская', kind: 'production', roomType: 'production',
    keyResources: { flour: 1500, sugar: 900, oil: 350, packaging: 822 },
    baseRevenue: 375_840, fixedCosts: 45_000, payroll: 70_000, retailMarkup: 1.95,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [9, 12], startingEquipment: 242_400, premisesPrice: 900_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    produces: { sweets: 5220 },
    workerStaff: { confectioner: 2, confectioner_assistant: 1, cashier: 1 },
  },

  // ─── Нефтяная отрасль ───────────────────────────────────────────────────
  {
    id: 'oil_extraction', name: 'Нефтедобывающая компания', kind: 'production', roomType: 'buy_or_rent',
    keyResources: { building_mat: 50, parts: 80, fuel: 1600, filters: 4 },
    baseRevenue: 1_944_000, fixedCosts: 260_000, payroll: 360_000, retailMarkup: 2.25,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 25,
    paybackTarget: [9, 12], startingEquipment: 2_476_000, premisesPrice: 5_200_000,
    manualOps: ['order_stock', 'pay_bills'],
    produces: { crude_oil: 1440 },
    workerStaff: { well_operator: 2, drilling_operator: 2, repair_mechanic: 1, safety_specialist: 1 },
  },
  {
    id: 'oil_refinery', name: 'Нефтеперерабатывающий завод', kind: 'production', roomType: 'buy_or_rent',
    keyResources: { crude_oil: 1640 },
    baseRevenue: 4_100_400, fixedCosts: 380_000, payroll: 480_000, retailMarkup: 1.67,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 30,
    paybackTarget: [8, 11], startingEquipment: 2_304_000, premisesPrice: 7_800_000,
    manualOps: ['order_stock', 'pay_bills'],
    produces: { fuel: 40800, chem: 3000, lubricants: 1000 },
    requiredEquipment: { automation: 2, filters: 2 },
    workerStaff: { process_operator: 4, pipe_fitter: 2, lab_technician: 1, safety_specialist: 1 },
  },
];

export const BUSINESSES_BY_ID: Record<string, BusinessDef> = Object.fromEntries(
  BUSINESSES.map(b => [b.id, b]),
);