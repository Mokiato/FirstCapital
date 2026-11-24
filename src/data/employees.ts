// src/data/employees.ts
import type { EmployeeRole } from '../game/domain/types';
import { MANAGEMENT_ROLES } from '../game/domain/types';

export interface EmployeeDef {
  role: EmployeeRole;
  name: string;
  description: string;
  salaryMin: number;
  salaryMax: number;
  contractMinMonths: number;
  contractMaxMonths: number;
}

/** Управляющий персонал — не более 1 на бизнес. */
const MANAGEMENT_DEFS: EmployeeDef[] = [
  { role: 'manager',         name: 'Управляющий',         description: 'Автозакупка и автоматизация операций',      salaryMin: 20_000,  salaryMax: 35_000,  contractMinMonths: 6, contractMaxMonths: 24 },
  { role: 'hr',              name: 'HR-специалист',       description: 'Автонайм рабочих, замена уволившихся',      salaryMin: 15_000,  salaryMax: 25_000,  contractMinMonths: 6, contractMaxMonths: 24 },
  { role: 'logist',          name: 'Логист',              description: 'Приоритет заказов и маршрутов',             salaryMin: 18_000,  salaryMax: 30_000,  contractMinMonths: 6, contractMaxMonths: 24 },
  { role: 'marketer',        name: 'Маркетолог бизнеса',  description: '+10–30% к спросу конкретного бизнеса',      salaryMin: 18_000,  salaryMax: 32_000,  contractMinMonths: 6, contractMaxMonths: 24 },
  { role: 'accountant',      name: 'Бухгалтер',           description: 'Снижает риск налоговых штрафов',            salaryMin: 12_000,  salaryMax: 22_000,  contractMinMonths: 6, contractMaxMonths: 24 },
  { role: 'holding_manager', name: 'Управляющий холдинга', description: 'Координирует управляющих предприятий',      salaryMin: 120_000, salaryMax: 250_000, contractMinMonths: 12, contractMaxMonths: 24 },
];

/**
 * Рабочий персонал — 3 tier'а зарплат.
 * tier 1 (базовый): 25-45K — кассиры, грузчики, уборщики, упаковщики
 * tier 2 (средний): 45-70K — бариста, официанты, водители, механики, слесари
 * tier 3 (специалист): 70-120K — врачи, инженеры, архитекторы, сварщики
 */
const WORKER_TIER_1: EmployeeRole[] = [
  'cashier', 'seller_floor', 'storekeeper_retail', 'hall_cleaner', 'guard',
  'ticket_cashier', 'buffet_seller', 'maid', 'breakfast_staff',
  'car_washer', 'loader_logistics', 'courier', 'order_operator',
  'packer', 'packaging_operator', 'forklift_driver', 'medical_packer',
  'waste_sorter', 'glass_unit_assembler', 'bottling_operator',
  'document_specialist', 'document_assistant', 'document_designer',
];

const WORKER_TIER_2: EmployeeRole[] = [
  'barista', 'waiter', 'cook', 'dishwasher', 'tea_master',
  'baker', 'baker_assistant', 'confectioner', 'confectioner_assistant',
  'seller_consultant', 'pharmacist',
  'nurse', 'registrar', 'lab_assistant',
  'projectionist', 'receptionist',
  'auto_mechanic', 'auto_electrician', 'reception_master',
  'truck_driver', 'dispatcher',
  'well_operator', 'drilling_operator', 'repair_mechanic',
  'line_operator', 'mechanic', 'mixer_operator',
  'locksmith_assembler', 'machine_operator',
  'carpenter', 'furniture_assembler', 'upholsterer',
  'parts_assembler', 'refrigeration_assembler', 'electro_mechanic',
  'electrician_assembler', 'electronics_technician',
  'cutter', 'seamstress', 'finisher',
  'chem_operator', 'recycling_operator',
  'window_assembler', 'drink_operator',
  'cad_specialist', 'support_specialist',
  'bookkeeper', 'recruiter', 'trainer', 'courses_coordinator',
  'supplier_specialist', 'warehouse_analyst',
  'repair_technician', 'request_dispatcher',
  'property_specialist', 'rental_specialist', 'building_tech',
  'insurance_consultant', 'claims_specialist',
  'market_analyst', 'data_analyst', 'research_specialist',
];

const WORKER_TIER_3: EmployeeRole[] = [
  'cook_brigadier', 'doctor',
  'safety_specialist', 'process_operator', 'pipe_fitter',
  'welder', 'qc_inspector', 'lab_technician',
  'equipment_tester', 'test_specialist', 'pump_technician', 'test_stand_operator',
  'sterilization_specialist', 'glass_cutter',
  'architect', 'engineer_constructor',
  'system_engineer', 'implementation_specialist',
  'auditor', 'lawyer', 'tender_specialist',
  'procurement_analyst', 'certification_specialist',
  'maintenance_engineer', 'risk_specialist',
];

const TIER_SALARY: Record<'t1' | 't2' | 't3', [number, number]> = {
  t1: [25_000, 45_000],
  t2: [45_000, 70_000],
  t3: [70_000, 120_000],
};

/** Вес роли при распределении каталожного ФОТ бизнеса (GDD §9.1). */
export const WORKER_TIER_WEIGHT: Record<'t1' | 't2' | 't3', number> = {
  t1: 1.0,
  t2: 1.35,
  t3: 2.0,
};

export function getWorkerTier(role: EmployeeRole): 't1' | 't2' | 't3' {
  if (WORKER_TIER_3.includes(role)) return 't3';
  if (WORKER_TIER_2.includes(role)) return 't2';
  return 't1';
}

/**
 * Раскладывает каталожный ФОТ бизнеса по рабочим ролям пропорционально весу.
 * Управленческие роли сюда не входят — они нанимаются сверх базового ФОТ.
 */
export function computeWorkerSalaries(
  payroll: number,
  workerStaff: Record<string, number>,
): Record<string, number> {
  const entries = Object.entries(workerStaff ?? {}).filter(([, n]) => n > 0);
  if (entries.length === 0 || payroll <= 0) return {};
  let totalWeight = 0;
  for (const [role, count] of entries) {
    totalWeight += WORKER_TIER_WEIGHT[getWorkerTier(role as EmployeeRole)] * count;
  }
  if (totalWeight <= 0) return {};
  const unit = payroll / totalWeight;
  const out: Record<string, number> = {};
  for (const [role] of entries) {
    out[role] = Math.round(unit * WORKER_TIER_WEIGHT[getWorkerTier(role as EmployeeRole)]);
  }
  return out;
}

const WORKER_NAME_MAP: Record<string, string> = {
  barista: 'Бариста', waiter: 'Официант', cook_brigadier: 'Повар-бригадир',
  cook: 'Повар', dishwasher: 'Мойщик посуды', tea_master: 'Чайный мастер',
  baker: 'Пекарь', baker_assistant: 'Помощник пекаря',
  confectioner: 'Кондитер', confectioner_assistant: 'Помощник кондитера',
  cashier: 'Кассир', seller_floor: 'Продавец зала', seller_consultant: 'Продавец-консультант',
  storekeeper_retail: 'Кладовщик', pharmacist: 'Фармацевт',
  doctor: 'Врач', nurse: 'Медсестра', registrar: 'Администратор', lab_assistant: 'Лаборант',
  ticket_cashier: 'Кассир билетной кассы', buffet_seller: 'Продавец буфета',
  projectionist: 'Киномеханик', hall_cleaner: 'Уборщик', guard: 'Охранник',
  receptionist: 'Администратор стойки', maid: 'Горничная',
  building_technician: 'Техник здания', breakfast_cook: 'Повар завтраков',
  breakfast_staff: 'Сотрудник зала',
  auto_mechanic: 'Автомеханик', auto_electrician: 'Автоэлектрик',
  reception_master: 'Мастер-приёмщик',
  car_washer: 'Мойщик авто', equipment_technician: 'Техник оборудования',
  truck_driver: 'Водитель', loader_logistics: 'Грузчик', dispatcher: 'Диспетчер',
  courier: 'Курьер', order_operator: 'Оператор заказов',
  well_operator: 'Оператор скважины', drilling_operator: 'Машинист буровой',
  repair_mechanic: 'Механик', safety_specialist: 'Спец. по безопасности',
  process_operator: 'Оператор установки', pipe_fitter: 'Слесарь-ремонтник',
  line_operator: 'Оператор линии', packer: 'Упаковщик', mechanic: 'Механик',
  qc_inspector: 'Контролёр качества', mixer_operator: 'Оператор смесителя',
  packaging_operator: 'Оператор фасовки', forklift_driver: 'Водитель погрузчика',
  lab_technician: 'Лаборант-контролёр',
  welder: 'Сварщик', locksmith_assembler: 'Слесарь-сборщик', machine_operator: 'Оператор станка',
  carpenter: 'Столяр', furniture_assembler: 'Сборщик мебели', upholsterer: 'Обивщик',
  parts_assembler: 'Сборщик деталей',
  refrigeration_assembler: 'Сборщик холодильного', electro_mechanic: 'Электромеханик',
  equipment_tester: 'Испытатель оборудования',
  electrician_assembler: 'Электромонтажник', electronics_technician: 'Техник-электронщик',
  test_specialist: 'Спец. по тестированию',
  cutter: 'Закройщик', seamstress: 'Швея', finisher: 'Отделочник',
  chem_operator: 'Оператор хим. пр-ва', sterilization_specialist: 'Спец. стерилизации',
  medical_packer: 'Упаковщик медизделий',
  pump_technician: 'Техник насосов', test_stand_operator: 'Оператор стенда',
  waste_sorter: 'Сортировщик', recycling_operator: 'Оператор переработки',
  glass_cutter: 'Оператор резки стекла',
  window_assembler: 'Сборщик рам', glass_unit_assembler: 'Сборщик стеклопакетов',
  drink_operator: 'Оператор напитков', bottling_operator: 'Оператор розлива',
  architect: 'Архитектор', engineer_constructor: 'Инженер-конструктор',
  cad_specialist: 'Спец. CAD/BIM',
  system_engineer: 'Системный инженер', implementation_specialist: 'Спец. внедрения',
  support_specialist: 'Спец. поддержки',
  bookkeeper: 'Бухгалтер', auditor: 'Аудитор', document_specialist: 'Делопроизводитель',
  recruiter: 'Рекрутер', trainer: 'Спец. обучения', courses_coordinator: 'Координатор',
  lawyer: 'Юрист', tender_specialist: 'Спец. по тендерам', document_assistant: 'Помощник',
  procurement_analyst: 'Аналитик закупок', supplier_specialist: 'Спец. по поставщикам',
  warehouse_analyst: 'Аналитик склада',
  certification_specialist: 'Спец. сертификации', document_designer: 'Оформитель',
  maintenance_engineer: 'Инженер по обслуживанию',
  repair_technician: 'Техник-ремонтник', request_dispatcher: 'Диспетчер заявок',
  property_specialist: 'Спец. по эксплуатации', rental_specialist: 'Спец. по аренде',
  building_tech: 'Техник здания',
  insurance_consultant: 'Страховой консультант', risk_specialist: 'Спец. по рискам',
  claims_specialist: 'Спец. по выплатам',
  market_analyst: 'Аналитик рынка', data_analyst: 'Аналитик данных',
  research_specialist: 'Исследователь',
};

const buildWorkerDefs = (roles: EmployeeRole[], tier: 't1' | 't2' | 't3'): EmployeeDef[] =>
  roles.map((role) => ({
    role,
    name: WORKER_NAME_MAP[role] ?? role,
    description: 'Рабочий персонал',
    salaryMin: TIER_SALARY[tier][0],
    salaryMax: TIER_SALARY[tier][1],
    contractMinMonths: 3,
    contractMaxMonths: 12,
  }));

export const EMPLOYEE_ROLES: EmployeeDef[] = [
  ...MANAGEMENT_DEFS,
  ...buildWorkerDefs(WORKER_TIER_1, 't1'),
  ...buildWorkerDefs(WORKER_TIER_2, 't2'),
  ...buildWorkerDefs(WORKER_TIER_3, 't3'),
];

export const EMPLOYEE_ROLES_BY_ID: Record<EmployeeRole, EmployeeDef> = Object.fromEntries(
  EMPLOYEE_ROLES.map((e) => [e.role, e]),
) as Record<EmployeeRole, EmployeeDef>;

export const EMPLOYEE_RULES = {
  maxPerRolePerBusiness: 1,
  fireChanceByMonths: [
    { upTo: 6,  chance: 0.05 },
    { upTo: 12, chance: 0.10 },
    { upTo: 18, chance: 0.15 },
    { upTo: 24, chance: 0.20 },
    { upTo: Infinity, chance: 0.50 },
  ] as Array<{ upTo: number; chance: number }>,
  trainingBaseCost: 50_000,
  maxQualification: 5,
};

/** Хелпер: управляющая ли роль (не более 1 на бизнес). */
export function isManagementRole(role: EmployeeRole): boolean {
  return (MANAGEMENT_ROLES as readonly string[]).includes(role);
}