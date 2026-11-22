// src/data/resources.ts
// Единый каталог ресурсов. Все бизнесы и магазин ссылаются сюда по id.

export type ResourceGroup = 'raw' | 'goods' | 'industrial' | 'equipment' | 'food' | 'fuel';

export interface ResourceDef {
  id: string;
  name: string;
  group: ResourceGroup;
  unit: 'кг' | 'л' | 'шт' | 'упак.' | 'компл.' | 'банка' | 'порция' | 'карат' | 'т' | 'барр.';
  basePrice: number;
  /** ID компаний из companies.ts, которые продают этот ресурс (NPC-опт). */
  sellers: string[];
    /** Максимальный спрос NPC на этот ресурс за один игровой месяц. */
  npcMonthlyDemand?: number;
}

export const RESOURCES: ResourceDef[] = [
  // ─── Сырьё (15) ─────────────────────────────────────────────────────────
  { id: 'green_coffee', name: 'Зелёный кофе',       group: 'raw', unit: 'кг',     basePrice: 400,    sellers: ['coffeeroast', 'chaiko'] },
  { id: 'tea_leaf',     name: 'Чайный лист',         group: 'raw', unit: 'кг',     basePrice: 600,    sellers: ['chaiko'] },
  { id: 'milk',         name: 'Молоко',              group: 'raw', unit: 'л',      basePrice: 60,     sellers: ['milkway'] },
  { id: 'flour',        name: 'Мука',                group: 'raw', unit: 'кг',     basePrice: 40,     sellers: ['magistral'] },
  { id: 'sugar',        name: 'Сахар',               group: 'raw', unit: 'кг',     basePrice: 55,     sellers: ['magistral'] },
  { id: 'water',        name: 'Вода (питьевая)',     group: 'raw', unit: 'л',      basePrice: 10,     sellers: ['vodokanalplus'] },
  { id: 'potato',       name: 'Картофель (сырьё)',   group: 'raw', unit: 'кг',     basePrice: 35,     sellers: ['magistral'] },
  { id: 'oil',          name: 'Масло растительное',  group: 'raw', unit: 'л',      basePrice: 120,    sellers: ['magistral'] },
  { id: 'taurine_mix',  name: 'Сырьё для энергетиков', group: 'raw', unit: 'кг',   basePrice: 500,    sellers: ['energoboost'] },
  { id: 'building_mat', name: 'Стройматериалы',      group: 'raw', unit: 'т',      basePrice: 8000,   sellers: ['steelforge', 'rudprom'] },
  { id: 'wood',         name: 'Древесина',           group: 'raw', unit: 'кг',     basePrice: 200,    sellers: ['magistral', 'gorstroy'] },
  { id: 'textile',      name: 'Ткани',               group: 'raw', unit: 'кг',     basePrice: 500,    sellers: ['magistral', 'freshmarket'] },
  { id: 'glass',        name: 'Стекло',              group: 'raw', unit: 'кг',     basePrice: 300,    sellers: ['silicon_rus', 'gorstroy'] },
  { id: 'waste',        name: 'Отходы',              group: 'raw', unit: 'кг',     basePrice: 20,     sellers: ['wasteclean'] },
  { id: 'crude_oil',    name: 'Нефть сырая',         group: 'raw', unit: 'барр.',  basePrice: 1500,   sellers: ['petrogrand', 'neftmagistral'] },

  // ─── Промежуточные товары (15) ──────────────────────────────────────────
  { id: 'roasted_coffee', name: 'Обжаренный кофе',   group: 'goods', unit: 'кг',    basePrice: 900,   sellers: ['coffeeroast'] },
  { id: 'tea',            name: 'Чай',               group: 'goods', unit: 'кг',    basePrice: 1200,  sellers: ['chaiko'] },
  { id: 'semi_finished',  name: 'Полуфабрикаты',     group: 'goods', unit: 'кг',    basePrice: 250,   sellers: ['magistral'] },
  { id: 'food',           name: 'Продукты (общее)',  group: 'goods', unit: 'кг',    basePrice: 200,   sellers: ['magistral'] },
  { id: 'drinks',         name: 'Напитки',           group: 'goods', unit: 'л',     basePrice: 100,   sellers: ['magistral'] },
  { id: 'snacks',         name: 'Снеки',             group: 'goods', unit: 'упак.', basePrice: 120,   sellers: ['snackempire'] },
  { id: 'energy_drinks',  name: 'Энергетики',        group: 'goods', unit: 'банка', basePrice: 90,    sellers: ['energoboost'] },
  { id: 'pastry',         name: 'Выпечка',           group: 'goods', unit: 'шт',    basePrice: 60,    sellers: ['sweetlab'] },
  { id: 'sweets',         name: 'Кондитерка',        group: 'goods', unit: 'шт',    basePrice: 80,    sellers: ['sweetlab'] },
  { id: 'clothes',        name: 'Одежда',            group: 'goods', unit: 'шт',    basePrice: 1500,  sellers: ['magistral'] },
  { id: 'sport_goods',    name: 'Спорттовары',       group: 'goods', unit: 'шт',    basePrice: 2500,  sellers: ['magistral'] },
  { id: 'meds',           name: 'Медикаменты',       group: 'goods', unit: 'упак.', basePrice: 300,   sellers: ['pharmarus', 'vitacore'] },
  { id: 'electronics',    name: 'Электроника',       group: 'goods', unit: 'шт',    basePrice: 15000, sellers: ['silicon_rus', 'digitforge'] },
  { id: 'parts',          name: 'Запчасти',          group: 'goods', unit: 'шт',    basePrice: 4000,  sellers: ['mechworks'] },
  { id: 'chem',           name: 'Автохимия',         group: 'goods', unit: 'л',     basePrice: 300,   sellers: ['magistral', 'energoboost'] },

  // ─── Промышленные товары (13) — производятся игроком ────────────────────
  { id: 'packaging',        name: 'Упаковка, тара',           group: 'industrial', unit: 'шт',    basePrice: 50,    sellers: [] },
  { id: 'construction_mix', name: 'Строительные смеси',       group: 'industrial', unit: 'кг',    basePrice: 500,   sellers: [] },
  { id: 'metal_structures', name: 'Металлоконструкции',       group: 'industrial', unit: 'шт',    basePrice: 3000,  sellers: [] },
  { id: 'furniture',        name: 'Мебель и оборудование',    group: 'industrial', unit: 'шт',    basePrice: 5000,  sellers: [] },
  { id: 'refrigeration',    name: 'Холодильное оборудование', group: 'industrial', unit: 'шт',    basePrice: 50000, sellers: [] },
  { id: 'automation',       name: 'Электрощиты и автоматика', group: 'industrial', unit: 'шт',    basePrice: 20000, sellers: [] },
  { id: 'cleaning',         name: 'Чистящие средства',        group: 'industrial', unit: 'л',     basePrice: 200,   sellers: [] },
  { id: 'med_supplies',     name: 'Медицинские расходники',   group: 'industrial', unit: 'упак.', basePrice: 500,   sellers: [] },
  { id: 'filters',          name: 'Фильтры и насосы',         group: 'industrial', unit: 'шт',    basePrice: 8000,  sellers: [] },
  { id: 'recycled',         name: 'Переработанное сырьё',     group: 'industrial', unit: 'кг',    basePrice: 100,   sellers: [] },
  { id: 'windows',          name: 'Окна и фасады',            group: 'industrial', unit: 'шт',    basePrice: 15000, sellers: [] },
  { id: 'lighting',         name: 'Осветительное оборудование', group: 'industrial', unit: 'шт',  basePrice: 3000,  sellers: [] },
  { id: 'lubricants',       name: 'Смазочные масла',          group: 'industrial', unit: 'л',     basePrice: 800,   sellers: [] },

  // ─── Топливо (1) ────────────────────────────────────────────────────────
  { id: 'fuel', name: 'Топливо', group: 'fuel', unit: 'л', basePrice: 70, sellers: ['petrogrand', 'neftmagistral'] },

  // ─── Оборудование (2) — покупается один раз ─────────────────────────────
  { id: 'med_equipment', name: 'Медоборудование', group: 'equipment', unit: 'компл.', basePrice: 2_000_000, sellers: ['cardioline'] },
  { id: 'it_equipment',  name: 'IT-оборудование', group: 'equipment', unit: 'компл.', basePrice: 500_000,   sellers: ['nexora'] },

  // ─── Личная еда (2) — для доставки на дом, не для бизнеса ───────────────
  { id: 'food_energy',  name: 'Еда (порция)',           group: 'food', unit: 'порция', basePrice: 500, sellers: [] },
  { id: 'drink_energy', name: 'Напиток (восстановление)', group: 'food', unit: 'шт',     basePrice: 300, sellers: [] },
];

export const RESOURCES_BY_ID: Record<string, ResourceDef> = Object.fromEntries(
  RESOURCES.map((r) => [r.id, r]),
);

export const RESOURCES_BY_GROUP: Record<ResourceGroup, ResourceDef[]> = RESOURCES.reduce(
  (acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  },
  {} as Record<ResourceGroup, ResourceDef[]>,
);