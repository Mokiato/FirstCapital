// src/data/businesses.ts
// Каталог бизнесов игрока. Производства (14) — в productions.ts.

export type BusinessKind = 'service' | 'retail' | 'production' | 'logistics' | 'office';
export type RoomType = 'rent' | 'buy_or_rent' | 'warehouse' | 'production';
/** Управляющий персонал: manager, hr, accountant. Рабочий персонал зависит от бизнеса. */
export type StaffRole = 'manager' | 'hr' | 'accountant' | 'holding_manager';
export type ManualOp = 'clean' | 'order_stock' | 'pay_bills';

export interface BusinessDef {
  id: string;
  name: string;
  kind: BusinessKind;
  roomType: RoomType;
  keyResources: Record<string, number>;
  baseRevenue: number;
  fixedCosts: number;
  staffRoles: StaffRole[];
  unlockLevel: number;
  paybackTarget: [number, number];
  startingEquipment?: number;
  premisesPrice?: number;
  manualOps?: ManualOp[];
  produces?: Record<string, number>;
  /** Разовое оборудование при открытии: id ресурса → количество. Покупается по опт-цене. */
  requiredEquipment?: Record<string, number>;
  /** Рабочий персонал: role → количество. Управляющий персонал сюда не входит. */
  workerStaff?: Record<string, number>;
}

export const BUSINESSES: BusinessDef[] = [
  // ─── Услуги ─────────────────────────────────────────────────────────────
  {
    id: 'coffee_shop', name: 'Кофейня', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { roasted_coffee: 40, milk: 300, water: 100, packaging: 200 },
    baseRevenue: 120_000, fixedCosts: 35_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 0,
    paybackTarget: [6, 12], startingEquipment: 150_000, premisesPrice: 2_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { barista: 2, cashier: 1 },
  },
  {
    id: 'tea_house', name: 'Чайная', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { tea: 30, milk: 200, water: 80 },
    baseRevenue: 100_000, fixedCosts: 30_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 1,
    paybackTarget: [6, 12], startingEquipment: 120_000, premisesPrice: 1_800_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { tea_master: 2, cashier: 1, waiter: 1 },
  },
  {
    id: 'restaurant', name: 'Ресторан', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { food: 800, drinks: 500, semi_finished: 300, packaging: 400 },
    baseRevenue: 400_000, fixedCosts: 150_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 5,
    paybackTarget: [9, 18], startingEquipment: 800_000, premisesPrice: 8_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { cook_brigadier: 1, cook: 2, waiter: 2, cashier: 1, dishwasher: 1 },
  },
  {
    id: 'fitness', name: 'Фитнес-клуб', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { water: 200, cleaning: 50 },
    baseRevenue: 220_000, fixedCosts: 80_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 7,
    paybackTarget: [10, 18], startingEquipment: 600_000, premisesPrice: 6_000_000,
    manualOps: ['clean', 'pay_bills'],
    workerStaff: {},
  },
  {
    id: 'cinema', name: 'Кинотеатр', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { snacks: 400, drinks: 300, energy_drinks: 100, cleaning: 30 },
    baseRevenue: 300_000, fixedCosts: 110_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 12,
    paybackTarget: [12, 24], startingEquipment: 1_200_000, premisesPrice: 10_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { electronics: 2, refrigeration: 1 },
    workerStaff: { ticket_cashier: 1, buffet_seller: 1, projectionist: 1, hall_cleaner: 1, guard: 1 },
  },
  {
    id: 'hotel', name: 'Гостиница', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { food: 500, drinks: 400, cleaning: 100 },
    baseRevenue: 450_000, fixedCosts: 160_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 15,
    paybackTarget: [14, 24], startingEquipment: 1_500_000, premisesPrice: 15_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { furniture: 5, lighting: 3, filters: 1 },
    workerStaff: { receptionist: 2, maid: 3, building_technician: 1, breakfast_cook: 1, breakfast_staff: 1 },
  },
  {
    id: 'autoservice', name: 'Автосервис', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { parts: 40, chem: 50, fuel: 100, lubricants: 30 },
    baseRevenue: 240_000, fixedCosts: 70_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 9,
    paybackTarget: [8, 15], startingEquipment: 700_000, premisesPrice: 5_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { metal_structures: 2 },
    workerStaff: { auto_mechanic: 3, auto_electrician: 1, reception_master: 1 },
  },
  {
    id: 'carwash', name: 'Автомойка', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { water: 500, chem: 40, cleaning: 20 },
    baseRevenue: 150_000, fixedCosts: 45_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [6, 12], startingEquipment: 300_000, premisesPrice: 3_000_000,
    manualOps: ['clean', 'order_stock'],
    workerStaff: { car_washer: 3, cashier: 1, equipment_technician: 1 },
  },
  {
    id: 'construction_co', name: 'Строительная компания', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { building_mat: 500, construction_mix: 200, windows: 50 },
    baseRevenue: 600_000, fixedCosts: 200_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 20,
    paybackTarget: [12, 24], startingEquipment: 2_000_000, premisesPrice: 12_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: {  },
  },

  // ─── Розница ────────────────────────────────────────────────────────────
  {
    id: 'grocery_store', name: 'Продуктовый магазин', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { food: 600, drinks: 400, snacks: 200, semi_finished: 100 },
    baseRevenue: 300_000, fixedCosts: 90_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 2,
    paybackTarget: [6, 12], startingEquipment: 400_000, premisesPrice: 4_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { refrigeration: 2 },
    workerStaff: { cashier: 2, seller_floor: 2, storekeeper_retail: 1 },
  },
  {
    id: 'electronics_store', name: 'Магазин электроники', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { electronics: 20, lighting: 10 },
    baseRevenue: 500_000, fixedCosts: 120_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 10,
    paybackTarget: [8, 15], startingEquipment: 800_000, premisesPrice: 7_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { lighting: 5 },
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'clothing_store', name: 'Магазин одежды', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { clothes: 100 },
    baseRevenue: 350_000, fixedCosts: 100_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 6,
    paybackTarget: [8, 15], startingEquipment: 500_000, premisesPrice: 5_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'sport_store', name: 'Магазин спорттоваров', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { sport_goods: 60 },
    baseRevenue: 280_000, fixedCosts: 85_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 5,
    paybackTarget: [8, 15], startingEquipment: 400_000, premisesPrice: 4_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { seller_consultant: 2, cashier: 1, storekeeper_retail: 1 },
  },
  {
    id: 'pharmacy', name: 'Аптека', kind: 'retail', roomType: 'buy_or_rent',
    keyResources: { meds: 200, med_supplies: 50 },
    baseRevenue: 260_000, fixedCosts: 75_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [8, 15], startingEquipment: 400_000, premisesPrice: 4_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { pharmacist: 2, cashier: 1 },
  },

  // ─── Медицина ───────────────────────────────────────────────────────────
  {
    id: 'clinic', name: 'Медицинская клиника', kind: 'service', roomType: 'buy_or_rent',
    keyResources: { meds: 300, med_supplies: 150, cleaning: 80 },
    baseRevenue: 600_000, fixedCosts: 200_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 20,
    paybackTarget: [15, 25], startingEquipment: 3_000_000, premisesPrice: 15_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    requiredEquipment: { med_equipment: 1 },
    workerStaff: { doctor: 2, nurse: 2, registrar: 1, lab_assistant: 1 },
  },

  // ─── Логистика ──────────────────────────────────────────────────────────
  {
    id: 'courier_service', name: 'Курьерская служба', kind: 'logistics', roomType: 'warehouse',
    keyResources: { fuel: 200 },
    baseRevenue: 180_000, fixedCosts: 50_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 3,
    paybackTarget: [6, 12], startingEquipment: 300_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { courier: 4, order_operator: 1 },
  },
  {
    id: 'logistics_company', name: 'Логистическая компания', kind: 'logistics', roomType: 'warehouse',
    keyResources: { fuel: 600, parts: 20 },
    baseRevenue: 420_000, fixedCosts: 130_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 8,
    paybackTarget: [10, 18], startingEquipment: 800_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { truck_driver: 3, loader_logistics: 2, dispatcher: 1 },
  },

  // ─── Производства (в бизнесах, без помещения) ───────────────────────────
  {
    id: 'bakery', name: 'Пекарня', kind: 'production', roomType: 'production',
    keyResources: { flour: 500, milk: 200, sugar: 80, packaging: 300 },
    baseRevenue: 180_000, fixedCosts: 50_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 2,
    paybackTarget: [6, 12], startingEquipment: 500_000, premisesPrice: 3_500_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    produces: { pastry: 3000 },
    workerStaff: { baker: 2, baker_assistant: 1, cashier: 1 },
  },
  {
    id: 'confectionery', name: 'Кондитерская', kind: 'production', roomType: 'production',
    keyResources: { flour: 400, sugar: 250, oil: 100, packaging: 200 },
    baseRevenue: 200_000, fixedCosts: 60_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 4,
    paybackTarget: [7, 14], startingEquipment: 550_000, premisesPrice: 4_000_000,
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    produces: { sweets: 2000 },
    workerStaff: { confectioner: 2, confectioner_assistant: 1, cashier: 1 },
  },

  // ─── Нефтяная отрасль (kind='production', но без помещения) ─────────────
  {
    id: 'oil_extraction', name: 'Нефтедобывающая компания', kind: 'production', roomType: 'buy_or_rent',
    keyResources: { building_mat: 5, parts: 3, fuel: 200 },
    baseRevenue: 600_000, fixedCosts: 300_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 25,
    paybackTarget: [6, 9], startingEquipment: 2_000_000,
    manualOps: ['order_stock', 'pay_bills'],
    produces: { crude_oil: 30 },
    workerStaff: { well_operator: 2, drilling_operator: 2, repair_mechanic: 1, safety_specialist: 1 },
  },
  {
    id: 'oil_refinery', name: 'Нефтеперерабатывающий завод', kind: 'production', roomType: 'buy_or_rent',
    keyResources: { crude_oil: 50 },
    baseRevenue: 1_200_000, fixedCosts: 600_000,
    staffRoles: ['manager', 'hr', 'accountant'], unlockLevel: 30,
    paybackTarget: [8, 12], startingEquipment: 4_000_000,
    manualOps: ['order_stock', 'pay_bills'],
    produces: { fuel: 300, lubricants: 40 },
    requiredEquipment: { automation: 2, filters: 2 },
    workerStaff: { process_operator: 4, pipe_fitter: 2, lab_technician: 1, safety_specialist: 1 },
  },
];

export const BUSINESSES_BY_ID: Record<string, BusinessDef> = Object.fromEntries(
  BUSINESSES.map(b => [b.id, b]),
);