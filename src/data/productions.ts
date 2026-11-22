// src/data/productions.ts
// 14 производств, которые открываются ТОЛЬКО в купленных промпомещениях.
import type { StaffRole, ManualOp } from './businesses';

export interface ProductionDef {
  id: string;
  name: string;
  description: string;
  /** Ежемесячно потребляемые ресурсы: id → количество. */
  keyResources: Record<string, number>;
  /** Ежемесячно производимые товары: id → количество. */
  produces: Record<string, number>;
  baseRevenue: number;
  fixedCosts: number;
  startingEquipment: number;
  /** Разовое оборудование при открытии: id → кол-во (по опт-цене). */
  requiredEquipment?: Record<string, number>;
  staffRoles: StaffRole[];
  unlockLevel: number;
  paybackTarget: [number, number];
  manualOps?: ManualOp[];
  /** Рабочий персонал: role → количество. */
  workerStaff?: Record<string, number>;
}

export const PRODUCTIONS: ProductionDef[] = [
  // ─── 1. Тара и упаковка ───────────────────────────────────────────────
  {
    id: 'prod_packaging',
    name: 'Тара и упаковка',
    description: 'Производство картонных коробок, пакетов, контейнеров и этикеток для магазинов, кафе, ресторанов и пекарен.',
    keyResources: { building_mat: 5, recycled: 200 },
    produces: { packaging: 57000 },
    baseRevenue: 2_000_000, fixedCosts: 700_000,
    startingEquipment: 1_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 20,
    paybackTarget: [18, 24],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { line_operator: 2, packer: 2, mechanic: 1, qc_inspector: 1 },
  },

  // ─── 2. Строительные смеси ────────────────────────────────────────────
  {
    id: 'prod_construction_mix',
    name: 'Строительные смеси',
    description: 'Производство сухих смесей, тротуарных элементов и небольших стеновых блоков для строительных компаний.',
    keyResources: { building_mat: 15, water: 500, glass: 50 },
    produces: { construction_mix: 2000 },
    baseRevenue: 1_400_000, fixedCosts: 500_000,
    startingEquipment: 1_200_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 22,
    paybackTarget: [18, 26],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { mixer_operator: 2, packaging_operator: 2, forklift_driver: 1, lab_technician: 1 },
  },

  // ─── 3. Металлоконструкции ────────────────────────────────────────────
  {
    id: 'prod_metal',
    name: 'Металлоконструкции',
    description: 'Стеллажи, каркасы, ограждения и крепёжные детали для строительства, производства и автосервисов.',
    keyResources: { building_mat: 20, parts: 50 },
    produces: { metal_structures: 400 },
    baseRevenue: 1_800_000, fixedCosts: 600_000,
    startingEquipment: 2_000_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 24,
    paybackTarget: [20, 28],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { welder: 2, locksmith_assembler: 2, machine_operator: 1, qc_inspector: 1 },
  },

  // ─── 4. Мебель и торговое оборудование ────────────────────────────────
  {
    id: 'prod_furniture',
    name: 'Мебель и торговое оборудование',
    description: 'Столы, офисные шкафы, прилавки и стеллажи для офисов, магазинов, кафе и клиник.',
    keyResources: { wood: 500, textile: 50, metal_structures: 30 },
    produces: { furniture: 200 },
    baseRevenue: 1_500_000, fixedCosts: 500_000,
    startingEquipment: 1_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 22,
    paybackTarget: [18, 26],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { carpenter: 2, furniture_assembler: 2, upholsterer: 1, qc_inspector: 1 },
  },

  // ─── 5. Автозапчасти и расходники ─────────────────────────────────────
  {
    id: 'prod_autoparts',
    name: 'Автозапчасти и расходники',
    description: 'Фильтры, тормозные детали и небольшие металлические и пластиковые компоненты для автосервисов.',
    keyResources: { building_mat: 8, parts: 100, electronics: 5 },
    produces: { parts: 400 },
    baseRevenue: 1_600_000, fixedCosts: 600_000,
    startingEquipment: 2_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 26,
    paybackTarget: [20, 28],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { machine_operator: 2, parts_assembler: 2, qc_inspector: 1 },
  },

  // ─── 6. Холодильное оборудование ──────────────────────────────────────
  {
    id: 'prod_refrigeration',
    name: 'Холодильное оборудование',
    description: 'Холодильники, витрины и морозильные камеры для продуктовых магазинов, кафе и ресторанов.',
    keyResources: { electronics: 30, metal_structures: 50, glass: 200 },
    produces: { refrigeration: 30 },
    baseRevenue: 1_800_000, fixedCosts: 650_000,
    startingEquipment: 2_000_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 28,
    paybackTarget: [20, 30],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { refrigeration_assembler: 2, electro_mechanic: 1, equipment_tester: 1, qc_inspector: 1 },
  },

  // ─── 7. Электрощиты и автоматика ──────────────────────────────────────
  {
    id: 'prod_automation',
    name: 'Электрощиты и автоматика',
    description: 'Контрольные панели, датчики и управляющие модули для производств, офисов и складов.',
    keyResources: { electronics: 40, metal_structures: 30 },
    produces: { automation: 100 },
    baseRevenue: 2_000_000, fixedCosts: 700_000,
    startingEquipment: 2_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 30,
    paybackTarget: [22, 30],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { electrician_assembler: 2, electronics_technician: 2, test_specialist: 1 },
  },

  // ─── 8. Производство газировки ────────────────────────────────────────
  {
    id: 'prod_soda',
    name: 'Производство газировки',
    description: 'Лимонады, соки и энергетики для кафе, ресторанов и магазинов. Один завод выпускает оба типа напитков.',
    keyResources: { water: 5000, sugar: 500, taurine_mix: 200, packaging: 5000 },
    produces: { drinks: 4000, energy_drinks: 1500 },
    baseRevenue: 1_800_000, fixedCosts: 600_000,
    startingEquipment: 1_800_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 26,
    paybackTarget: [18, 26],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { drink_operator: 2, bottling_operator: 2, lab_technician: 1, packer: 1 },
  },

  // ─── 9. Чистящие и санитарные средства ───────────────────────────────
  {
    id: 'prod_cleaning',
    name: 'Чистящие и санитарные средства',
    description: 'Моющие средства, промышленная химия и дезинфекция для офисов, магазинов, клиник и производств.',
    keyResources: { chem: 500, water: 3000, packaging: 3000 },
    produces: { cleaning: 8000 },
    baseRevenue: 1_300_000, fixedCosts: 450_000,
    startingEquipment: 1_000_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 20,
    paybackTarget: [18, 24],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { chem_operator: 2, packaging_operator: 2, lab_technician: 1, packer: 1 },
  },

  // ─── 10. Медицинские расходники ───────────────────────────────────────
  {
    id: 'prod_med_supplies',
    name: 'Медицинские расходники',
    description: 'Перчатки, маски, одноразовые наборы и упаковка для медицинских центров и аптек.',
    keyResources: { textile: 300, chem: 200, packaging: 2000 },
    produces: { med_supplies: 1500 },
    baseRevenue: 1_400_000, fixedCosts: 500_000,
    startingEquipment: 1_200_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 24,
    paybackTarget: [20, 28],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { line_operator: 2, sterilization_specialist: 1, medical_packer: 2, qc_inspector: 1 },
  },

  // ─── 11. Фильтры и насосные системы ───────────────────────────────────
  {
    id: 'prod_filters',
    name: 'Фильтры и насосные системы',
    description: 'Фильтры, насосы и комплекты очистки воды для заводов, коттеджей и сервисных компаний.',
    keyResources: { metal_structures: 40, electronics: 20, recycled: 500 },
    produces: { filters: 80 },
    baseRevenue: 1_700_000, fixedCosts: 600_000,
    startingEquipment: 2_000_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 28,
    paybackTarget: [20, 30],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff:{ locksmith_assembler: 2, pump_technician: 1, test_stand_operator: 1, qc_inspector: 1 },
  },

  // ─── 12. Переработка вторсырья ────────────────────────────────────────
  {
    id: 'prod_recycling',
    name: 'Переработка вторсырья',
    description: 'Сортировка и переработка бумаги, пластика и металла для дальнейшего использования.',
    keyResources: { waste: 2000, building_mat: 3 },
    produces: { recycled: 1500 },
    baseRevenue: 1_000_000, fixedCosts: 400_000,
    startingEquipment: 1_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 18,
    paybackTarget: [15, 22],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { waste_sorter: 3, recycling_operator: 2, mechanic: 1 },
  },

  // ─── 13. Окна и фасадные системы ──────────────────────────────────────
  {
    id: 'prod_windows',
    name: 'Окна и фасадные системы',
    description: 'Стеклопакеты, оконные блоки и фасадные элементы для строительных компаний и девелоперов.',
    keyResources: { glass: 800, building_mat: 10, metal_structures: 30 },
    produces: { windows: 80 },
    baseRevenue: 1_800_000, fixedCosts: 600_000,
    startingEquipment: 1_800_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 26,
    paybackTarget: [20, 28],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { glass_cutter: 1, window_assembler: 2, glass_unit_assembler: 2, qc_inspector: 1 },
  },

  // ─── 14. Осветительное оборудование ───────────────────────────────────
  {
    id: 'prod_lighting',
    name: 'Осветительное оборудование',
    description: 'Светильники, промышленные лампы и модульные системы освещения для офисов, магазинов и производств.',
    keyResources: { electronics: 30, metal_structures: 40, glass: 200 },
    produces: { lighting: 300 },
    baseRevenue: 1_600_000, fixedCosts: 550_000,
    startingEquipment: 1_500_000,
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 24,
    paybackTarget: [18, 26],
    manualOps: ['clean', 'order_stock', 'pay_bills'],
    workerStaff: { electrician_assembler: 2, line_operator: 1, test_specialist: 1, qc_inspector: 1 },
  },
];

export const PRODUCTIONS_BY_ID: Record<string, ProductionDef> = Object.fromEntries(
  PRODUCTIONS.map((p) => [p.id, p]),
);