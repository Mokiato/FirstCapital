export type Category =
  | 'food'
  | 'retail'
  | 'services'
  | 'production'
  | 'tech'
  | 'media'
  | 'energy'
  | 'finance'
  | 'transport'
  | 'medicine';
// Реэкспорт типов каталога компаний (единственный источник — data/companies.ts)
export type {
  SectorId,
  StockBehavior,
  CompanySize,
  CompanyRole,
  CompanyDef,
} from './data/companies';

export interface BusinessDef {
  id: string;
  name: string;
  category: Category;
  basePrice: number;
  baseIncome: number;
  unlockLevel: number;
  emoji: string;
}

export type RealEstateCategory = 'apartment' | 'office' | 'house' | 'warehouse' | 'industrial';

export interface RealEstateDef {
  id: string;
  name: string;
  category: RealEstateCategory;
  price: number;
  bonusPercent: number;
  emoji: string;
  /** Площадь в м² (для квартир/офисов/домов) или вместимость (для складов). */
  area: number;
  /** Количество комнат (для квартир и домов). 0 — если не применимо. */
  rooms: number;
  /** Адрес объекта. */
  address: string;
  /** Аренда за месяц (если игрок захочет сдавать). */
  rentalIncome: number;
  /** Описание для карточки. */
  description: string;
}

export type TransportCategory = 'ground' | 'water' | 'air' | 'helicopter' | 'space';

export interface TransportDef {
  id: string;
  name: string;
  category: TransportCategory;
  price: number;
  offlineBonusPercent: number;
  reputation: number;
  emoji: string;
}
export type CollectionCurrency = 'rub';
export type CollectionBonusType = 'income' | 'reputation' | 'speed'  | 'deal' | 'offline';

export interface CollectionItemDef {
  id: string;
  setId: string;
  name: string;
  price: number;
  currency: CollectionCurrency;
  bonusText: string;
  bonusType: CollectionBonusType;
  bonusValue: number;
  emoji: string;
}

export interface CollectionSetDef {
  id: string;
  name: string;
  emoji: string;
  fullSetBonusText: string;
}

export type CityBuildingCategory = 'residential' | 'infrastructure' | 'industrial' | 'decor' | 'space';

export interface CityBuildingDef {
  id: string;
  name: string;
  category: CityBuildingCategory;
  price: number;
  population: number;
  happiness: number;
  energy: number;
  water: number;
  emoji: string;
}

export interface OwnedBusiness {
  id: string;
  level: number;
  stars: number;
}

export interface CityState {
  name: string;
  population: number;
  happiness: number;
  taxRate: number;
  treasury: number;
  buildings: Record<string, number>;
  research: string[];
  /** Разрешение на строительство куплено → открывает режим города. */
  constructionPermit: boolean;
}

export interface Quest {
  id: string;
  text: string;
  target: number;
  progress: number;
  reward: number;
  type: 'earn' | 'deals' | 'upgrades' | 'games';
  claimed: boolean;
}

export interface Achievement {
  id: string;
  text: string;
  target: number;
  type: 'totalEarned' | 'businessCount' | 'companyLevel' | 'dealsCount' | 'gamesPlayed';
  reward: number;
  claimed: boolean;
}

export interface JobTitle {
  levelRange: [number, number];
  title: string;
  multiplier: number;
  color: string;
}

export interface JobDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  baseIncome: number;
  requirement: { type: 'companyLevel'; value: number };
  titles: JobTitle[];
}

export interface JobState {
  level: number;
  xp: number;
}

// ========== CASES ==========
export type CaseRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

export type CosmeticType = 'avatar' | 'frame' | 'car';

export interface WheelPrize {
  id: string;
  label: string;
  color: string;
  weight: number;
  reward: { type: 'money' | 'bitcoin'; amount: number };
}

// ========== STOCKS ==========
export interface StockDef {
  id: string;
  name: string;
  ticker: string;
  category: string;
  basePrice: number;
  emoji: string;
}

// ========== HOLIDAYS ==========
export interface HolidayDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  multiplier: number;
  start: { month: number; day: number };
  end: { month: number; day: number };
}
