// src/data/officeCompanies.ts
// 11 офисных компаний. Открываются ТОЛЬКО в купленных офисах.
// Основной доход — выручка как у обычного бизнеса. Дополнительно дают
// небольшие бонусы другим бизнесам игрока.

import type { StaffRole, ManualOp } from './businesses';

export type OfficeBonusKind =
  | 'constructionDiscount'   // скидка на открытие/улучшение строительных бизнесов
  | 'itRevenue'              // +% к выручке офисных бизнесов (IT)
  | 'taxReduction'           // −% налогов бизнесам
  | 'hireQuality'            // +% к квалификации нанимаемых
  | 'fineReduction'          // −% штрафов от инспекций
  | 'purchaseDiscount'       // −% к ценам закупок на склад
  | 'contractBonus'          // +% к наградам по контрактам
  | 'breakdownReduction'     // −% к ущербу от поломок оборудования
  | 'entertainmentRevenue'   // +% к выручке развлекательных бизнесов
  | 'insuranceDiscount'      // −% к страховым выплатам
  | 'demandBonus';           // +% к спросу (demandMultiplier)

export interface OfficeBonus {
  kind: OfficeBonusKind;
  /** Значение как доля: 0.10 = 10%. */
  value: number;
}

export interface OfficeCompanyDef {
  id: string;
  name: string;
  description: string;
  baseRevenue: number;
  fixedCosts: number;
  startingEquipment: number;
  /** Разовое оборудование при открытии: id → количество (по опт-цене). */
  requiredEquipment?: Record<string, number>;
  staffRoles: StaffRole[];
  unlockLevel: number;
  paybackTarget: [number, number];
  /** Бонусы, которые компания даёт другим бизнесам игрока. */
  bonuses: OfficeBonus[];
  manualOps?: ManualOp[];
    /** Рабочий персонал: role → количество. */
  workerStaff?: Record<string, number>;
}

export const OFFICE_COMPANIES: OfficeCompanyDef[] = [
  // ─── 1. Проектное бюро ────────────────────────────────────────────────
  {
    id: 'off_project_bureau',
    name: 'Проектное бюро',
    description: 'Проектирует здания и реконструкции для строительных компаний и владельцев недвижимости.',
    baseRevenue: 350_000, fixedCosts: 120_000,
    startingEquipment: 300_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 15,
    paybackTarget: [10, 16],
    bonuses: [{ kind: 'constructionDiscount', value: 0.10 }],
    manualOps: ['pay_bills'],
    workerStaff: { architect: 2, engineer_constructor: 1, cad_specialist: 1 },
  },

  // ─── 2. Интегратор корпоративных систем ───────────────────────────────
  {
    id: 'off_system_integrator',
    name: 'Интегратор корпоративных систем',
    description: 'Устанавливает бизнес-программы, кассы, сети и защиту данных для магазинов, офисов и производств.',
    baseRevenue: 400_000, fixedCosts: 140_000,
    startingEquipment: 400_000,
    requiredEquipment: { it_equipment: 2 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 18,
    paybackTarget: [10, 16],
    bonuses: [{ kind: 'itRevenue', value: 0.05 }],
    manualOps: ['pay_bills'],
    workerStaff: { system_engineer: 2, implementation_specialist: 1, support_specialist: 1 },
  },

  // ─── 3. Бухгалтерское и аудиторское бюро ──────────────────────────────
  {
    id: 'off_accounting_bureau',
    name: 'Бухгалтерское и аудиторское бюро',
    description: 'Помогает предприятиям вести отчётность, проверять расходы и готовить документы.',
    baseRevenue: 250_000, fixedCosts: 90_000,
    startingEquipment: 200_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 12,
    paybackTarget: [8, 14],
    bonuses: [{ kind: 'taxReduction', value: 0.15 }],
    manualOps: ['pay_bills'],
    workerStaff: { bookkeeper: 2, auditor: 1, document_specialist: 1 },
  },

  // ─── 4. Кадровое бюро и учебный центр ─────────────────────────────────
  {
    id: 'off_hr_bureau',
    name: 'Кадровое бюро и учебный центр',
    description: 'Подбирает сотрудников и обучает их для компаний игрока. Дополняет внутренний HR.',
    baseRevenue: 220_000, fixedCosts: 80_000,
    startingEquipment: 250_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 10,
    paybackTarget: [10, 15],
    bonuses: [{ kind: 'hireQuality', value: 0.10 }],
    manualOps: ['pay_bills'],
    workerStaff: { recruiter: 2, trainer: 1, courses_coordinator: 1 },
  },

  // ─── 5. Юридическое и тендерное бюро ──────────────────────────────────
  {
    id: 'off_legal_bureau',
    name: 'Юридическое и тендерное бюро',
    description: 'Готовит договоры, сопровождает контракты и помогает участвовать в закупках.',
    baseRevenue: 300_000, fixedCosts: 110_000,
    startingEquipment: 300_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 14,
    paybackTarget: [10, 16],
    bonuses: [
      { kind: 'contractBonus', value: 0.10 },
      { kind: 'fineReduction', value: 0.20 },
    ],
    manualOps: ['pay_bills'],
    workerStaff: { lawyer: 2, tender_specialist: 1, document_assistant: 1 },
  },

  // ─── 6. Центр закупок и контроля затрат ───────────────────────────────
  {
    id: 'off_procurement_center',
    name: 'Центр закупок и контроля затрат',
    description: 'Сравнивает предложения поставщиков и оптимизирует закупки через «Магистраль Трейд».',
    baseRevenue: 280_000, fixedCosts: 100_000,
    startingEquipment: 300_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 16,
    paybackTarget: [10, 16],
    bonuses: [{ kind: 'purchaseDiscount', value: 0.10 }],
    manualOps: ['pay_bills'],
    workerStaff: { procurement_analyst: 2, supplier_specialist: 1, warehouse_analyst: 1 },
  },

  // ─── 7. Лаборатория качества и сертификации ───────────────────────────
  {
    id: 'off_quality_lab',
    name: 'Лаборатория качества и сертификации',
    description: 'Проверяет продукцию и помогает производствам получать сертификаты и заключать новые контракты.',
    baseRevenue: 320_000, fixedCosts: 120_000,
    startingEquipment: 500_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 20,
    paybackTarget: [12, 18],
    bonuses: [{ kind: 'contractBonus', value: 0.05 }],
    manualOps: ['pay_bills'],
    workerStaff: { lab_technician: 2, certification_specialist: 1, document_designer: 1 },
  },

  // ─── 8. Инженерный сервис ─────────────────────────────────────────────
  {
    id: 'off_engineering_service',
    name: 'Инженерный сервис',
    description: 'Планирует обслуживание станков, оборудования и инженерных систем в производствах, клиниках и коммерческих зданиях.',
    baseRevenue: 330_000, fixedCosts: 120_000,
    startingEquipment: 400_000,
    requiredEquipment: { it_equipment: 1, automation: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 22,
    paybackTarget: [12, 18],
    bonuses: [{ kind: 'breakdownReduction', value: 0.20 }],
    manualOps: ['pay_bills'],
    workerStaff: { maintenance_engineer: 2, repair_technician: 2, request_dispatcher: 1 },
  },

  // ─── 9. Игровая студия ────────────────────────────────────────────────
  {
    id: 'off_game_studio',
    name: 'Игровая студия',
    description: 'Разработка игр и интерактивных приложений для внутреннего и внешнего рынка.',
    baseRevenue: 450_000, fixedCosts: 180_000,
    startingEquipment: 600_000,
    requiredEquipment: { it_equipment: 3 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 24,
    paybackTarget: [12, 20],
    bonuses: [{ kind: 'entertainmentRevenue', value: 0.05 }],
    manualOps: ['pay_bills'],
    workerStaff: {},
  },

  // ─── 10. Страховое бюро ───────────────────────────────────────────────
  {
    id: 'off_insurance_bureau',
    name: 'Страховое бюро',
    description: 'Подбирает страховку для зданий, оборудования и транспорта через «ИншурЛайн».',
    baseRevenue: 260_000, fixedCosts: 90_000,
    startingEquipment: 250_000,
    requiredEquipment: { it_equipment: 1 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 12,
    paybackTarget: [10, 15],
    bonuses: [{ kind: 'insuranceDiscount', value: 0.20 }],
    manualOps: ['pay_bills'],
    workerStaff: { insurance_consultant: 2, risk_specialist: 1, claims_specialist: 1 },
  },

  // ─── 11. Аналитический центр ──────────────────────────────────────────
  {
    id: 'off_analytics_center',
    name: 'Аналитический центр',
    description: 'Изучает спрос и цены для магазинов и производств. Исследование рынка, а не реклама.',
    baseRevenue: 300_000, fixedCosts: 100_000,
    startingEquipment: 350_000,
    requiredEquipment: { it_equipment: 2 },
    staffRoles: ['manager', 'hr', 'accountant'],
    unlockLevel: 16,
    paybackTarget: [10, 16],
    bonuses: [{ kind: 'demandBonus', value: 0.10 }],
    manualOps: ['pay_bills'],
    workerStaff: { market_analyst: 2, data_analyst: 1, research_specialist: 1 },
  },
];

export const OFFICE_COMPANIES_BY_ID: Record<string, OfficeCompanyDef> = Object.fromEntries(
  OFFICE_COMPANIES.map((c) => [c.id, c]),
);