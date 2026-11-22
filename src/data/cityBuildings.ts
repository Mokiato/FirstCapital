import type { CityBuildingDef } from '../types';

export const CITY_BUILDINGS: CityBuildingDef[] = [
  { id: 'cb_house1', name: 'Барачный дом', category: 'residential', price: 5_000, population: 20, happiness: 0, energy: -2, water: -2, emoji: '🏚️' },
  { id: 'cb_house2', name: 'Пятиэтажка', category: 'residential', price: 20_000, population: 60, happiness: 0, energy: -5, water: -5, emoji: '🏢' },
  { id: 'cb_house3', name: 'Многоэтажка', category: 'residential', price: 80_000, population: 150, happiness: 1, energy: -10, water: -10, emoji: '🏙️' },
  { id: 'cb_house4', name: 'Элитный ЖК', category: 'residential', price: 300_000, population: 300, happiness: 3, energy: -18, water: -18, emoji: '🏘️' },
  { id: 'cb_park', name: 'Парк', category: 'decor', price: 15_000, population: 0, happiness: 5, energy: 0, water: -1, emoji: '🌳' },
  { id: 'cb_fountain', name: 'Фонтан', category: 'decor', price: 8_000, population: 0, happiness: 3, energy: -1, water: -1, emoji: '⛲' },
  { id: 'cb_stadium', name: 'Стадион', category: 'decor', price: 500_000, population: 0, happiness: 10, energy: -8, water: -4, emoji: '🏟️' },
  { id: 'cb_mall', name: 'Торговый центр', category: 'decor', price: 250_000, population: 0, happiness: 6, energy: -6, water: -3, emoji: '🛍️' },
  { id: 'cb_school', name: 'Школа', category: 'infrastructure', price: 40_000, population: 10, happiness: 4, energy: -3, water: -3, emoji: '🏫' },
  { id: 'cb_hospital', name: 'Больница', category: 'infrastructure', price: 120_000, population: 15, happiness: 6, energy: -5, water: -5, emoji: '🏥' },
  { id: 'cb_police', name: 'Полиция', category: 'infrastructure', price: 60_000, population: 5, happiness: 4, energy: -2, water: -2, emoji: '🚓' },
  { id: 'cb_road', name: 'Дорога', category: 'infrastructure', price: 5_000, population: 0, happiness: 1, energy: 0, water: 0, emoji: '🛣️' },
  { id: 'cb_power_plant', name: 'Электростанция', category: 'infrastructure', price: 100_000, population: 0, happiness: -2, energy: 80, water: 0, emoji: '🔌' },
  { id: 'cb_water_tower', name: 'Водонапорная башня', category: 'infrastructure', price: 70_000, population: 0, happiness: 0, energy: -2, water: 80, emoji: '💧' },
  { id: 'cb_factory', name: 'Фабрика', category: 'industrial', price: 200_000, population: 0, happiness: -3, energy: -20, water: -10, emoji: '🏭' },
  { id: 'cb_warehouse', name: 'Склад', category: 'industrial', price: 90_000, population: 0, happiness: -1, energy: -8, water: -2, emoji: '📦' },
  { id: 'cb_refinery', name: 'НПЗ', category: 'industrial', price: 600_000, population: 0, happiness: -5, energy: -30, water: -15, emoji: '🛢️' },
  { id: 'cb_tech_park', name: 'Технопарк', category: 'industrial', price: 450_000, population: 0, happiness: 2, energy: -15, water: -8, emoji: '🏗️' },
  { id: 'cb_launch_pad', name: 'Стартовая площадка', category: 'space', price: 2_000_000, population: 0, happiness: 8, energy: -40, water: -10, emoji: '🚀' },
  { id: 'cb_space_center', name: 'Центр управления полётами', category: 'space', price: 5_000_000, population: 20, happiness: 12, energy: -50, water: -15, emoji: '🛰️' },
];

export const CITY_CATEGORY_LABELS: Record<string, string> = {
  residential: 'Жильё',
  infrastructure: 'Инфраструктура',
  industrial: 'Промышленность',
  decor: 'Декор',
  space: 'Космодром',
};

export interface ResearchDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  incomeBonus: number;
  emoji: string;
}

export const RESEARCH_TREE: ResearchDef[] = [
  { id: 'r_automation', name: 'Автоматизация', description: '+3% к общему доходу', cost: 30, incomeBonus: 3, emoji: '⚙️' },
  { id: 'r_logistics_net', name: 'Логистическая сеть', description: '+4% к общему доходу', cost: 60, incomeBonus: 4, emoji: '🚛' },
  { id: 'r_green_energy', name: 'Зелёная энергетика', description: '+5% к общему доходу', cost: 100, incomeBonus: 5, emoji: '🌱' },
  { id: 'r_ai', name: 'Искусственный интеллект', description: '+6% к общему доходу', cost: 180, incomeBonus: 6, emoji: '🤖' },
  { id: 'r_biotech', name: 'Биотехнологии', description: '+7% к общему доходу', cost: 280, incomeBonus: 7, emoji: '🧪' },
  { id: 'r_nanotech', name: 'Нанотехнологии', description: '+8% к общему доходу', cost: 420, incomeBonus: 8, emoji: '🔬' },
  { id: 'r_space_tech', name: 'Космические технологии', description: '+10% к общему доходу', cost: 650, incomeBonus: 10, emoji: '🛰️' },
  { id: 'r_quantum', name: 'Квантовые вычисления', description: '+15% к общему доходу', cost: 1000, incomeBonus: 15, emoji: '🧬' },
];
