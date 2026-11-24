// src/data/productions.ts
// 14 производств (buy_only в промзоне). GDD v2.0 §7.2, Таблица 14.3.
// Все рецепты замкнуты (нет циклов), генерируют waste.

import type { StaffRole, ManualOp } from './businesses';

export interface ProductionDef {
  id: string;
  name: string;
  description: string;
  /** Ежемесячно потребляемые ресурсы: id → количество. */
  keyResources: Record<string, number>;
  /** Ежемесячно производимые товары: id → количество. */
  produces: Record<string, number>;
  /** Побочные отходы (waste) в месяц. */
  wasteGenerated?: number;
  /** Ориентир выручки при 100% загрузке и полном B2B-спросе. */
  baseRevenue: number;
  fixedCosts: number;
  /** Базовый месячный ФОТ рабочего штата. */
  payroll: number;
  startingEquipment: number;
  requiredEquipment?: Record<string, number>;
  staffRoles: StaffRole[];
  unlockLevel: number;
  paybackTarget: [number, number];
  manualOps?: ManualOp[];
  workerStaff?: Record<string, number>;
}

export const PRODUCTIONS: ProductionDef[] = [
  // ─── 1. Переработка вторсырья ──────────────────────────────────────────
  {
    id: 'prod_recycling',
    name: 'Переработка вторсырья',
    description: 'Сортировка и переработка бумаги, пластика и металла для дальнейшего использования.',
    keyResources: { waste: 6600, building_mat: 22 },
    produces: { recycled: 5280 },
    wasteGenerated: 0,
    baseRevenue: 475_200, fixedCosts: 30_000, payroll: 45_000,
    startingEquipment: 650_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 1,
    paybackTarget: [10, 12],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { waste_sorter: 3, recycling_operator: 2, mechanic: 1 },
  },

  // ─── 2. Тара и упаковка ───────────────────────────────────────────────
  {
    id: 'prod_packaging',
    name: 'Тара и упаковка',
    description: 'Производство картонных коробок, пакетов, контейнеров и этикеток для магазинов, кафе, ресторанов и пекарен.',
    keyResources: { building_mat: 36, recycled: 720 },
    produces: { packaging: 11520 },
    wasteGenerated: 5,
    baseRevenue: 518_400, fixedCosts: 30_000, payroll: 48_000,
    startingEquipment: 700_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 2,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { line_operator: 2, packer: 2, mechanic: 1, qc_inspector: 1 },
  },

  // ─── 3. Строительные смеси ────────────────────────────────────────────
  {
    id: 'prod_construction_mix',
    name: 'Строительные смеси',
    description: 'Производство сухих смесей, тротуарных элементов и небольших стеновых блоков для строительных компаний.',
    keyResources: { building_mat: 22, water: 440, glass: 220 },
    produces: { construction_mix: 990 },
    wasteGenerated: 8,
    baseRevenue: 445_500, fixedCosts: 40_000, payroll: 60_000,
    startingEquipment: 950_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 3,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { mixer_operator: 2, packaging_operator: 2, forklift_driver: 1, lab_technician: 1 },
  },

  // ─── 4. Чистящие и санитарные средства ───────────────────────────────
  {
    id: 'prod_cleaning',
    name: 'Чистящие и санитарные средства',
    description: 'Моющие средства, промышленная химия и дезинфекция для офисов, магазинов, клиник и производств.',
    keyResources: { chem: 650, water: 2600, packaging: 2600 },
    produces: { cleaning: 2925 },
    wasteGenerated: 10,
    baseRevenue: 526_500, fixedCosts: 35_000, payroll: 52_000,
    startingEquipment: 850_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 4,
    paybackTarget: [13, 15],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { chem_operator: 2, packaging_operator: 2, lab_technician: 1, packer: 1 },
  },

  // ─── 5. Завод напитков ────────────────────────────────────────────────
  {
    id: 'prod_soda',
    name: 'Производство газировки',
    description: 'Лимонады, соки и энергетики для кафе, ресторанов и магазинов. Один завод выпускает оба типа напитков.',
    keyResources: { water: 2200, sugar: 660, taurine_mix: 110, packaging: 4400 },
    produces: { drinks: 3520, energy_drinks: 3520 },
    wasteGenerated: 12,
    baseRevenue: 601_920, fixedCosts: 50_000, payroll: 75_000,
    startingEquipment: 1_450_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 5,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { drink_operator: 2, bottling_operator: 2, lab_technician: 1, packer: 1 },
  },

  // ─── 6. Металлоконструкции ────────────────────────────────────────────
  {
    id: 'prod_metal',
    name: 'Металлоконструкции',
    description: 'Стеллажи, каркасы, ограждения и крепёжные детали для строительства, производства и автосервисов.',
    keyResources: { building_mat: 56, recycled: 840, fuel: 1400 },
    produces: { metal_structures: 336 },
    wasteGenerated: 15,
    baseRevenue: 907_200, fixedCosts: 55_000, payroll: 80_000,
    startingEquipment: 1_600_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 6,
    paybackTarget: [13, 15],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { welder: 2, locksmith_assembler: 2, machine_operator: 1, qc_inspector: 1 },
  },

  // ─── 7. Медицинские расходники ───────────────────────────────────────
  {
    id: 'prod_med_supplies',
    name: 'Медицинские расходники',
    description: 'Перчатки, маски, одноразовые наборы и упаковка для медицинских центров и аптек.',
    keyResources: { textile: 500, chem: 400, packaging: 1500 },
    produces: { med_supplies: 1500 },
    wasteGenerated: 8,
    baseRevenue: 675_000, fixedCosts: 42_000, payroll: 68_000,
    startingEquipment: 1_300_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 7,
    paybackTarget: [13, 15],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { line_operator: 2, sterilization_specialist: 1, medical_packer: 2, qc_inspector: 1 },
  },

  // ─── 8. Мебель и торговое оборудование ────────────────────────────────
  {
    id: 'prod_furniture',
    name: 'Мебель и торговое оборудование',
    description: 'Столы, офисные шкафы, прилавки и стеллажи для офисов, магазинов, кафе и клиник.',
    keyResources: { wood: 550, textile: 176, metal_structures: 44 },
    produces: { furniture: 132 },
    wasteGenerated: 10,
    baseRevenue: 594_000, fixedCosts: 50_000, payroll: 82_000,
    startingEquipment: 1_650_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 8,
    paybackTarget: [14, 16],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { carpenter: 2, furniture_assembler: 2, upholsterer: 1, qc_inspector: 1 },
  },

  // ─── 9. Осветительное оборудование ───────────────────────────────────
  {
    id: 'prod_lighting',
    name: 'Осветительное оборудование',
    description: 'Светильники, промышленные лампы и модульные системы освещения для офисов, магазинов и производств.',
    keyResources: { electronics: 24, metal_structures: 48, glass: 480 },
    produces: { lighting: 360 },
    wasteGenerated: 6,
    baseRevenue: 972_000, fixedCosts: 55_000, payroll: 90_000,
    startingEquipment: 1_900_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 10,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { electrician_assembler: 2, line_operator: 1, test_specialist: 1, qc_inspector: 1 },
  },

  // ─── 10. Автозапчасти ─────────────────────────────────────────────────
  {
    id: 'prod_autoparts',
    name: 'Автозапчасти и расходники',
    description: 'Фильтры, тормозные детали и небольшие металлические и пластиковые компоненты для автосервисов.',
    keyResources: { metal_structures: 66, lubricants: 220, electronics: 22 },
    produces: { parts: 308 },
    wasteGenerated: 8,
    baseRevenue: 1_108_800, fixedCosts: 65_000, payroll: 110_000,
    startingEquipment: 2_400_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 11,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { machine_operator: 2, parts_assembler: 2, qc_inspector: 1 },
  },

  // ─── 11. Окна и фасадные системы ──────────────────────────────────────
  {
    id: 'prod_windows',
    name: 'Окна и фасадные системы',
    description: 'Стеклопакеты, оконные блоки и фасадные элементы для строительных компаний и девелоперов.',
    keyResources: { glass: 800, metal_structures: 80, building_mat: 20 },
    produces: { windows: 80 },
    wasteGenerated: 10,
    baseRevenue: 1_080_000, fixedCosts: 75_000, payroll: 115_000,
    startingEquipment: 2_750_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 12,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { glass_cutter: 1, window_assembler: 2, glass_unit_assembler: 2, qc_inspector: 1 },
  },

  // ─── 12. Фильтры и насосные системы ───────────────────────────────────
  {
    id: 'prod_filters',
    name: 'Фильтры и насосные системы',
    description: 'Фильтры, насосы и комплекты очистки воды для заводов, коттеджей и сервисных компаний.',
    keyResources: { metal_structures: 68, electronics: 34, recycled: 1360 },
    produces: { filters: 170 },
    wasteGenerated: 6,
    baseRevenue: 1_224_000, fixedCosts: 65_000, payroll: 105_000,
    startingEquipment: 2_300_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 14,
    paybackTarget: [13, 15],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff:{ locksmith_assembler: 2, pump_technician: 1, test_stand_operator: 1, qc_inspector: 1 },
  },

  // ─── 13. Электрощиты и автоматика ──────────────────────────────────────
  {
    id: 'prod_automation',
    name: 'Электрощиты и автоматика',
    description: 'Контрольные панели, датчики и управляющие модули для производств, офисов и складов.',
    keyResources: { electronics: 36, metal_structures: 72 },
    produces: { automation: 72 },
    wasteGenerated: 5,
    baseRevenue: 1_296_000, fixedCosts: 80_000, payroll: 140_000,
    startingEquipment: 3_250_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 16,
    paybackTarget: [11, 13],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { electrician_assembler: 2, electronics_technician: 2, test_specialist: 1 },
  },

  // ─── 14. Холодильное оборудование ──────────────────────────────────────
  {
    id: 'prod_refrigeration',
    name: 'Холодильное оборудование',
    description: 'Холодильники, витрины и морозильные камеры для продуктовых магазинов, кафе и ресторанов.',
    keyResources: { electronics: 32, metal_structures: 80, glass: 320 },
    produces: { refrigeration: 32 },
    wasteGenerated: 6,
    baseRevenue: 1_440_000, fixedCosts: 95_000, payroll: 165_000,
    startingEquipment: 3_850_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 18,
    paybackTarget: [12, 14],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { refrigeration_assembler: 2, electro_mechanic: 1, equipment_tester: 1, qc_inspector: 1 },
  },
];

export const PRODUCTIONS_BY_ID: Record<string, ProductionDef> = Object.fromEntries(
  PRODUCTIONS.map((p) => [p.id, p]),
);