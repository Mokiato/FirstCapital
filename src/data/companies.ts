// src/data/companies.ts
// Единственный источник правды по 80 NPC-корпорациям.
// 10 секторов × 8 компаний = 80. Из них 44 large и 36 small.
// Названия вымышленные. Роли: supplier / buyer / competitor / issuer.

export type SectorId =
  | 'it'
  | 'healthcare'
  | 'finance'
  | 'consumer'
  | 'industrial'
  | 'energy'
  | 'raw'
  | 'utilities'
  | 'realestate'
  | 'communications';

export type StockBehavior = 'stable' | 'moderate' | 'volatile' | 'speculative';
export type CompanySize = 'large' | 'small';
export type CompanyRole = 'supplier' | 'buyer' | 'competitor' | 'issuer';

export interface CompanyDef {
  id: string;
  name: string;
  sector: SectorId;
  size: CompanySize;
  roles: CompanyRole[];
  stockBehavior: StockBehavior;
  dividends: boolean;
  /** Базовая игровая цена акции в рублях */
  basePrice: number;
  /** ID бизнесов игрока, с которыми компания связана (поставки/закупки/конкуренция) */
  linkedBusinesses: string[];
}

export const COMPANIES: CompanyDef[] = [
  // ─── 1. Информационные технологии (5 large / 3 small) ───────────────────
  {
    id: 'nexora', name: 'Nexora Systems', sector: 'it', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2800,
    linkedBusinesses: ['it_startup', 'web_studio', 'ad_agency'],
  },
  {
    id: 'kvantsoft', name: 'KvantSoft', sector: 'it', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 4200,
    linkedBusinesses: ['it_startup', 'web_studio'],
  },
  {
    id: 'astrion_cloud', name: 'Astrion Cloud', sector: 'it', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 1200,
    linkedBusinesses: ['it_startup'],
  },
  {
    id: 'silicon_rus', name: 'SiliconRus', sector: 'it', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 1500,
    linkedBusinesses: ['electronics_store'],
  },
  {
    id: 'digitforge', name: 'DigitForge', sector: 'it', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2000,
    linkedBusinesses: ['electronics_store', 'it_startup'],
  },
  {
    id: 'bytehive', name: 'ByteHive', sector: 'it', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 120,
    linkedBusinesses: [],
  },
  {
    id: 'codenest', name: 'CodeNest', sector: 'it', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 700,
    linkedBusinesses: ['web_studio'],
  },
  {
    id: 'logicwave', name: 'LogicWave', sector: 'it', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 200,
    linkedBusinesses: [],
  },

  // ─── 2. Здравоохранение (4 / 4) ─────────────────────────────────────────
  {
    id: 'vitacore', name: 'VitaCore Pharma', sector: 'healthcare', size: 'large',
    roles: ['supplier', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 4800,
    linkedBusinesses: ['pharmacy', 'clinic'],
  },
  {
    id: 'medisana', name: 'Medisana Group', sector: 'healthcare', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2500,
    linkedBusinesses: ['clinic', 'pharmacy'],
  },
  {
    id: 'biolume', name: 'BioLume', sector: 'healthcare', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 1400,
    linkedBusinesses: ['clinic'],
  },
  {
    id: 'pharmarus', name: 'PharmaRus', sector: 'healthcare', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3600,
    linkedBusinesses: ['pharmacy'],
  },
  {
    id: 'nanocure', name: 'NanoCure Labs', sector: 'healthcare', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 180,
    linkedBusinesses: [],
  },
  {
    id: 'zdravomed', name: 'ZdravoMed', sector: 'healthcare', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 900,
    linkedBusinesses: ['clinic'],
  },
  {
    id: 'immunotech', name: 'ImmunoTech', sector: 'healthcare', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 400,
    linkedBusinesses: [],
  },
  {
    id: 'cardioline', name: 'CardioLine', sector: 'healthcare', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 800,
    linkedBusinesses: ['clinic'],
  },

  // ─── 3. Финансовый сектор (5 / 3) ───────────────────────────────────────
  {
    id: 'capitaltrust', name: 'CapitalTrust Bank', sector: 'finance', size: 'large',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 5000,
    linkedBusinesses: [],
  },
  {
    id: 'finaxiom', name: 'FinAxiom', sector: 'finance', size: 'large',
    roles: ['buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 3200,
    linkedBusinesses: [],
  },
  {
    id: 'rusinvest', name: 'RusInvest', sector: 'finance', size: 'large',
    roles: ['buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2800,
    linkedBusinesses: [],
  },
  {
    id: 'securepay', name: 'SecurePay', sector: 'finance', size: 'large',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 1600,
    linkedBusinesses: [],
  },
  {
    id: 'aurobank', name: 'AuroBank', sector: 'finance', size: 'large',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 4400,
    linkedBusinesses: [],
  },
  {
    id: 'microkapital', name: 'MicroKapital', sector: 'finance', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 300,
    linkedBusinesses: [],
  },
  {
    id: 'insurline', name: 'InsurLine', sector: 'finance', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 1100,
    linkedBusinesses: [],
  },
  {
    id: 'brokerpro', name: 'BrokerPro', sector: 'finance', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 220,
    linkedBusinesses: [],
  },

  // ─── 4. Потребительские товары (4 / 4) ──────────────────────────────────
  {
    id: 'prodmagistral', name: 'Magistral Trade', sector: 'consumer', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3000,
    linkedBusinesses: ['grocery_store', 'restaurant', 'fastfood', 'bakery', 'confectionery', 'clothing_store', 'sport_store'],
  },
  {
    id: 'chaiko', name: 'ChaiKo', sector: 'consumer', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2200,
    linkedBusinesses: ['tea_house', 'coffee_shop'],
  },
  {
    id: 'energoboost', name: 'EnergoBoost', sector: 'consumer', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 1800,
    linkedBusinesses: ['grocery_store', 'cinema', 'energy_drinks_plant'],
  },
  {
    id: 'snackempire', name: 'SnackEmpire', sector: 'consumer', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 1600,
    linkedBusinesses: ['grocery_store', 'cinema', 'snack_factory'],
  },
  {
    id: 'coffeeroast', name: 'CoffeeRoast', sector: 'consumer', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 500,
    linkedBusinesses: ['coffee_shop', 'coffee_roastery'],
  },
  {
    id: 'freshmarket', name: 'FreshMarket', sector: 'consumer', size: 'small',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 1200,
    linkedBusinesses: ['grocery_store', 'clothing_store'],
  },
  {
    id: 'sweetlab', name: 'SweetLab', sector: 'consumer', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 150,
    linkedBusinesses: ['confectionery', 'grocery_store'],
  },
  {
    id: 'milkway', name: 'MilkWay', sector: 'consumer', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 850,
    linkedBusinesses: ['coffee_shop', 'tea_house', 'bakery'],
  },

  // ─── 5. Промышленный сектор (5 / 3) ─────────────────────────────────────
  {
    id: 'titanmash', name: 'TitanMarine', sector: 'industrial', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3400,
    linkedBusinesses: ['autoservice', 'construction_co'],
  },
  {
    id: 'aerolux', name: 'AeroLux', sector: 'industrial', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'volatile', dividends: true, basePrice: 1500,
    linkedBusinesses: [],
  },
  {
    id: 'steelforge', name: 'SteelForge', sector: 'industrial', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2600,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'heavyline', name: 'HeavyLine', sector: 'industrial', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2400,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'mechworks', name: 'MechWorks', sector: 'industrial', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2000,
    linkedBusinesses: ['autoservice'],
  },
  {
    id: 'precision_tools', name: 'PrecisionTools', sector: 'industrial', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 450,
    linkedBusinesses: ['autoservice'],
  },
  {
    id: 'litomash', name: 'LitoMash', sector: 'industrial', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 800,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'conveyorplus', name: 'ConveyorPlus', sector: 'industrial', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 180,
    linkedBusinesses: [],
  },

  // ─── 6. Энергетика (4 / 4) ──────────────────────────────────────────────
  {
    id: 'petrogrand', name: 'PetroGrand', sector: 'energy', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 3200,
    linkedBusinesses: ['courier_service', 'logistics_company', 'autoservice'],
  },
  {
    id: 'gazpromsib', name: 'GazPromSib', sector: 'energy', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 4600,
    linkedBusinesses: [],
  },
  {
    id: 'neftmagistral', name: 'NeftMagistral', sector: 'energy', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: true, basePrice: 1800,
    linkedBusinesses: ['courier_service', 'logistics_company'],
  },
  {
    id: 'energoatom', name: 'EnergoAtom', sector: 'energy', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3800,
    linkedBusinesses: [],
  },
  {
    id: 'solarpeak', name: 'SolarPeak', sector: 'energy', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 350,
    linkedBusinesses: [],
  },
  {
    id: 'windforce', name: 'WindForce', sector: 'energy', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 120,
    linkedBusinesses: [],
  },
  {
    id: 'oilfieldco', name: 'OilFieldCo', sector: 'energy', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 400,
    linkedBusinesses: [],
  },
  {
    id: 'heatline', name: 'HeatLine', sector: 'energy', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 700,
    linkedBusinesses: [],
  },

  // ─── 7. Сырьевой сектор (4 / 4) ─────────────────────────────────────────
  {
    id: 'rudprom', name: 'RudProm', sector: 'raw', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2200,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'normetall', name: 'NorMetall', sector: 'raw', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3200,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'goldrush', name: 'GoldRush Corp', sector: 'raw', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: true, basePrice: 1600,
    linkedBusinesses: [],
  },
  {
    id: 'diamondline', name: 'DiamondLine', sector: 'raw', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 900,
    linkedBusinesses: [],
  },
  {
    id: 'coalpeak', name: 'CoalPeak', sector: 'raw', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 280,
    linkedBusinesses: [],
  },
  {
    id: 'silvermine', name: 'SilverMine Co', sector: 'raw', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 260,
    linkedBusinesses: [],
  },
  {
    id: 'platinum_group', name: 'PlatinumGroup', sector: 'raw', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 210,
    linkedBusinesses: [],
  },
  {
    id: 'oretrade', name: 'OreTrade', sector: 'raw', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 650,
    linkedBusinesses: ['construction_co'],
  },

  // ─── 8. Коммунальные услуги (4 / 4) ────────────────────────────────────
  {
    id: 'vodokanalplus', name: 'VodokanalPlus', sector: 'utilities', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 2800,
    linkedBusinesses: ['carwash', 'energy_drinks_plant'],
  },
  {
    id: 'teploset', name: 'TeploSet', sector: 'utilities', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 2600,
    linkedBusinesses: [],
  },
  {
    id: 'elektrosbyt', name: 'ElektroSbyt', sector: 'utilities', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3000,
    linkedBusinesses: [],
  },
  {
    id: 'gorgaz', name: 'GorGaz', sector: 'utilities', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 2900,
    linkedBusinesses: [],
  },
  {
    id: 'wasteclean', name: 'WasteClean', sector: 'utilities', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 800,
    linkedBusinesses: [],
  },
  {
    id: 'utilitypro', name: 'UtilityPro', sector: 'utilities', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 700,
    linkedBusinesses: [],
  },
  {
    id: 'aquiline', name: 'AquaLine', sector: 'utilities', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 650,
    linkedBusinesses: [],
  },
  {
    id: 'heatservice', name: 'HeatService', sector: 'utilities', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 600,
    linkedBusinesses: [],
  },

  // ─── 9. Недвижимость (5 / 3) ────────────────────────────────────────────
  {
    id: 'gorstroy', name: 'GorStroy', sector: 'realestate', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2400,
    linkedBusinesses: [],
  },
  {
    id: 'megapolis_estate', name: 'Megapolis Estate', sector: 'realestate', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2600,
    linkedBusinesses: [],
  },
  {
    id: 'renthold', name: 'RentHold', sector: 'realestate', size: 'large',
    roles: ['supplier', 'buyer', 'competitor', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3400,
    linkedBusinesses: [],
  },
  {
    id: 'capitalbuild', name: 'CapitalBuild', sector: 'realestate', size: 'large',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: true, basePrice: 1500,
    linkedBusinesses: ['construction_co'],
  },
  {
    id: 'dominvest', name: 'DomInvest', sector: 'realestate', size: 'large',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2000,
    linkedBusinesses: [],
  },
  {
    id: 'kvartiraplus', name: 'KvartiraPlus', sector: 'realestate', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 700,
    linkedBusinesses: [],
  },
  {
    id: 'officespace', name: 'OfficeSpace', sector: 'realestate', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 800,
    linkedBusinesses: ['it_startup', 'web_studio', 'ad_agency'],
  },
  {
    id: 'renovationpro', name: 'RenovationPro', sector: 'realestate', size: 'small',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 160,
    linkedBusinesses: ['construction_co'],
  },

  // ─── 10. Коммуникационные услуги (4 / 4) ───────────────────────────────
  {
    id: 'svyaztelecom', name: 'SvyazTelecom', sector: 'communications', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3800,
    linkedBusinesses: [],
  },
  {
    id: 'mediawave', name: 'MediaWave', sector: 'communications', size: 'large',
    roles: ['buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: true, basePrice: 2000,
    linkedBusinesses: ['ad_agency'],
  },
  {
    id: 'streamplus', name: 'StreamPlus', sector: 'communications', size: 'large',
    roles: ['buyer', 'competitor', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 1200,
    linkedBusinesses: ['ad_agency', 'cinema'],
  },
  {
    id: 'infonet', name: 'InfoNet', sector: 'communications', size: 'large',
    roles: ['supplier', 'issuer'],
    stockBehavior: 'stable', dividends: true, basePrice: 3000,
    linkedBusinesses: [],
  },
  {
    id: 'podcasthub', name: 'PodcastHub', sector: 'communications', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'speculative', dividends: false, basePrice: 140,
    linkedBusinesses: ['ad_agency'],
  },
  {
    id: 'adsignal', name: 'AdSignal', sector: 'communications', size: 'small',
    roles: ['buyer', 'competitor', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 750,
    linkedBusinesses: ['ad_agency'],
  },
  {
    id: 'mobileline', name: 'MobileLine', sector: 'communications', size: 'small',
    roles: ['supplier', 'buyer', 'issuer'],
    stockBehavior: 'volatile', dividends: false, basePrice: 500,
    linkedBusinesses: [],
  },
  {
    id: 'radiostar', name: 'RadioStar', sector: 'communications', size: 'small',
    roles: ['buyer', 'issuer'],
    stockBehavior: 'moderate', dividends: false, basePrice: 680,
    linkedBusinesses: ['ad_agency'],
  },
];

// ─── Производные индексы ────────────────────────────────────────────────────
export const COMPANY_NAMES_RU: Record<string, string> = {
  nexora: 'Нексора', kvantsoft: 'КвантСофт', astrion_cloud: 'Астрион Клауд', silicon_rus: 'СиликонРус', digitforge: 'ДиджитФордж', bytehive: 'БайтХайв', codenest: 'КодНест', logicwave: 'ЛоджикВейв',
  vitacore: 'ВитаКор', medisana: 'Медисана', biolume: 'БиоЛюм', pharmarus: 'ФармаРус', nanocure: 'НаноКьюр', zdravomed: 'ЗдравоМед', immunotech: 'ИммуноТек', cardioline: 'КардиоЛайн',
  capitaltrust: 'КапиталТраст', finaxiom: 'ФинАксиом', rusinvest: 'РусИнвест', securepay: 'СекьюрПэй', aurobank: 'АуроБанк', microkapital: 'МикроКапитал', insurline: 'ИншурЛайн', brokerpro: 'БрокерПро',
  prodmagistral: 'ПродМагистраль', chaiko: 'ЧайКо', energoboost: 'ЭнергоБуст', snackempire: 'СнэкЭмпайр', coffeeroast: 'КофеРоаст', freshmarket: 'ФрешМаркет', sweetlab: 'СвитЛаб', milkway: 'МилкВэй',
  titanmash: 'ТитанМаш', aerolux: 'АэроЛюкс', steelforge: 'СтилФордж', heavyline: 'ХэвиЛайн', mechworks: 'МекВоркс', precision_tools: 'ПрецижнТулс', litomash: 'ЛитоМаш', conveyorplus: 'КонвейерПлюс',
  petrogrand: 'ПетроГранд', gazpromsib: 'ГазПромСиб', neftmagistral: 'НефтьМагистраль', energoatom: 'ЭнергоАтом', solarpeak: 'СоларПик', windforce: 'ВиндФорс', oilfieldco: 'ОйлФилдКо', heatline: 'ХитЛайн',
  rudprom: 'РудПром', normetall: 'НорМеталл', goldrush: 'ГолдРаш', diamondline: 'ДаймондЛайн', coalpeak: 'КоулПик', silvermine: 'СильверМайн', platinum_group: 'ПлатинумГрупп', oretrade: 'ОрТрейд',
  vodokanalplus: 'ВодоканалПлюс', teploset: 'ТеплоСеть', elektrosbyt: 'ЭлектроСбыт', gorgaz: 'ГорГаз', wasteclean: 'ВейстКлин', utilitypro: 'ЮтилитиПро', aquiline: 'АкваЛайн', heatservice: 'ХитСервис',
  gorstroy: 'ГорСтрой', megapolis_estate: 'Мегаполис Эстейт', renthold: 'РентХолд', capitalbuild: 'КапиталБилд', dominvest: 'ДомИнвест', kvartiraplus: 'КвартираПлюс', officespace: 'ОфисСпейс', renovationpro: 'РеновацияПро',
  svyaztelecom: 'СвязьТелеком', mediawave: 'МедиаВэйв', streamplus: 'СтримПлюс', infonet: 'ИнфоНет', podcasthub: 'ПодкастХаб', adsignal: 'АдСигнал', mobileline: 'МобайлЛайн', radiostar: 'РадиоСтар'
};
export const COMPANY_BY_ID: Record<string, CompanyDef> = Object.fromEntries(
  COMPANIES.map(c => [c.id, c]),
);

export const COMPANIES_BY_SECTOR: Record<SectorId, CompanyDef[]> = COMPANIES.reduce(
  (acc, c) => {
    (acc[c.sector] ||= []).push(c);
    return acc;
  },
  {} as Record<SectorId, CompanyDef[]>,
);

/** Компании, которые могут стать активными конкурентами (роль competitor). */
export const POTENTIAL_COMPETITORS: CompanyDef[] = COMPANIES.filter(c =>
  c.roles.includes('competitor'),
);

/** Максимум одновременно активных конкурентов — по ТЗ. */
export const MAX_ACTIVE_COMPETITORS = 20;