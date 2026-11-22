import type { RealEstateDef } from '../types';

// Склады — 28 объектов: 2 малых, 6 средних, 10 больших, 10 огромных.

const SMALL_RENT = 5_000;
const MEDIUM_RENT = 25_000;
const LARGE_RENT = 75_000;
const HUGE_RENT = 120_000;

const SMALL_CAP = 10_000;
const MEDIUM_CAP = 50_000;
const LARGE_CAP = 150_000;
const HUGE_CAP = 300_000;

export const WAREHOUSES: RealEstateDef[] = [
  // ─── Малые (2) ───────────────────────────────────────
  {
    id: 'wh_small_1', name: 'Малый склад «Логист-1»', category: 'warehouse',
    area: SMALL_CAP, rooms: 0,
    price: 500_000, rentalIncome: SMALL_RENT, bonusPercent: 1, emoji: '📦',
    address: 'г. Новоград, Промышленный район, ул. Заводская, д. 12, корп. 1',
    description: 'Компактный склад для небольшого бизнеса. Отличное решение для старта снабжения.'
  },
  {
    id: 'wh_small_2', name: 'Малый склад «Южный»', category: 'warehouse',
    area: SMALL_CAP, rooms: 0,
    price: 570_000, rentalIncome: 5_500, bonusPercent: 1, emoji: '📦',
    address: 'г. Новоград, Южный район, ул. Солнечная, д. 8, склад 3',
    description: 'Компактный склад рядом с торговыми точками. Удобные подъездные пути.'
  },

  // ─── Средние (6) ─────────────────────────────────────
  {
    id: 'wh_medium_1', name: 'Средний склад «Магистраль»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 2_500_000, rentalIncome: MEDIUM_RENT, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Вокзальный район, ул. Вокзальная, д. 15',
    description: 'Универсальный склад рядом с ж/д узлом. Оптимально для снабжения сети бизнесов.'
  },
  {
    id: 'wh_medium_2', name: 'Средний склад «Северный»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 2_650_000, rentalIncome: 26_000, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Северный район, ул. Полярная, д. 4',
    description: 'Склад с современной вентиляцией и охраной. Подходит для хранения продуктов.'
  },
  {
    id: 'wh_medium_3', name: 'Средний склад «Порт»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 2_800_000, rentalIncome: 27_500, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Речной район, Пристанская ул., д. 12',
    description: 'Склад в портовой зоне. Удобно для импорта и экспорта товаров.'
  },
  {
    id: 'wh_medium_4', name: 'Средний склад «Заречье»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 2_350_000, rentalIncome: 23_500, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Заречный район, ул. Речная, д. 27',
    description: 'Склад в спальном районе с низкой арендой. Идеален для локальной торговли.'
  },
  {
    id: 'wh_medium_5', name: 'Средний склад «Академический»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 2_950_000, rentalIncome: 29_000, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Академический район, пр-т Научный, д. 14',
    description: 'Склад у технопарка. Пользуется спросом у IT-компаний и стартапов.'
  },
  {
    id: 'wh_medium_6', name: 'Средний склад «Центральный»', category: 'warehouse',
    area: MEDIUM_CAP, rooms: 0,
    price: 3_000_000, rentalIncome: 30_000, bonusPercent: 3, emoji: '🏗️',
    address: 'г. Новоград, Центральный район, ул. Складская, д. 6',
    description: 'Центральный склад в шаговой доступности. Идеален для обслуживания городских бизнесов.'
  },

  // ─── Большие (10) ─────────────────────────────────────
  {
    id: 'wh_large_1', name: 'Большой склад «Логистик-Центр»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 7_500_000, rentalIncome: LARGE_RENT, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Промышленный район, ул. Индустриальная, д. 1',
    description: 'Крупный логистический хаб с собственной погрузочной техникой.'
  },
  {
    id: 'wh_large_2', name: 'Большой склад «Восточный»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 7_950_000, rentalIncome: 78_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Восточный район, ул. Рассветная, д. 45',
    description: 'Большой склад с возможностью расширения. Подъезд для фур и ж/д ветка.'
  },
  {
    id: 'wh_large_3', name: 'Большой склад «Западный»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 7_200_000, rentalIncome: 72_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Западный район, ул. Закатная, д. 33',
    description: 'Современный склад класса B. Автоматизированный учёт.'
  },
  {
    id: 'wh_large_4', name: 'Большой склад «Машиностроительный»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 8_000_000, rentalIncome: 80_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Промышленный район, ул. Машиностроителей, д. 7',
    description: 'Склад для тяжёлых грузов. Усиленные полы и кран-балка.'
  },
  {
    id: 'wh_large_5', name: 'Большой склад «Речной порт»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 8_250_000, rentalIncome: 82_500, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Речной район, ул. Набережная, д. 22',
    description: 'Склад у речного порта. Прямой выход к причалу для водных грузоперевозок.'
  },
  {
    id: 'wh_large_6', name: 'Большой склад «Аэропорт»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 8_500_000, rentalIncome: 85_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Авиационный район, Аэропортовская ул., д. 1',
    description: 'Склад рядом с аэропортом. Удобен для скоропортящихся товаров.'
  },
  {
    id: 'wh_large_7', name: 'Большой склад «Кленовый»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 7_350_000, rentalIncome: 73_500, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, мкр-н Кленовый, ул. Каштановая, д. 100',
    description: 'Склад в жилом массиве. Хорошо подходит для обслуживания торговых сетей.'
  },
  {
    id: 'wh_large_8', name: 'Большой склад «Строительный»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 7_800_000, rentalIncome: 78_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Строительный район, ул. Бетонная, д. 15',
    description: 'Склад для стройматериалов. Открытая площадка и крытые ангары.'
  },
  {
    id: 'wh_large_9', name: 'Большой склад «Пищевой»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 8_750_000, rentalIncome: 87_500, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Пищевой район, ул. Консервная, д. 4',
    description: 'Склад-холодильник. Подходит для хранения продуктов и напитков.'
  },
  {
    id: 'wh_large_10', name: 'Большой склад «Универсальный»', category: 'warehouse',
    area: LARGE_CAP, rooms: 0,
    price: 9_000_000, rentalIncome: 90_000, bonusPercent: 5, emoji: '🏭',
    address: 'г. Новоград, Деловой район, ул. Транспортная, д. 11',
    description: 'Универсальный склад класса A. Автоматизированные стеллажные системы.'
  },

  // ─── Огромные (10) ────────────────────────────────────
  {
    id: 'wh_huge_1', name: 'Огромный склад «Мега-Логистик»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 15_000_000, rentalIncome: HUGE_RENT, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Логистический парк, ул. Терминальная, д. 1',
    description: 'Крупнейший склад города. Полная автоматизация и собственная ж/д ветка.'
  },
  {
    id: 'wh_huge_2', name: 'Огромный склад «Транзит»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 15_900_000, rentalIncome: 126_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Вокзальный район, ул. Сортировочная, д. 3',
    description: 'Склад-транзит для перевалки грузов между ж/д и автотранспортом.'
  },
  {
    id: 'wh_huge_3', name: 'Огромный склад «Порт-Терминал»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 14_400_000, rentalIncome: 115_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Речной район, Морской пр-д, д. 7',
    description: 'Склад-терминал в порту. Прямой доступ к кранам и причалам.'
  },
  {
    id: 'wh_huge_4', name: 'Огромный склад «Индустрия»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 16_000_000, rentalIncome: 128_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Промышленный район, ул. Индустриальная, д. 50',
    description: 'Промышленный склад с кранами и тяжёлыми стеллажами.'
  },
  {
    id: 'wh_huge_5', name: 'Огромный склад «Агро-Центр»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 14_100_000, rentalIncome: 113_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Аграрный район, ул. Урожайная, д. 22',
    description: 'Склад для сельхозпродукции. Контроль влажности и температуры.'
  },
  {
    id: 'wh_huge_6', name: 'Огромный склад «Фарма»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 16_500_000, rentalIncome: 132_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Медицинский район, ул. Здоровья, д. 9',
    description: 'Склад-холодильник для медикаментов. Сертифицирован по стандартам GMP.'
  },
  {
    id: 'wh_huge_7', name: 'Огромный склад «Технопарк»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 13_800_000, rentalIncome: 110_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Академический район, пр-т Научный, д. 50',
    description: 'Склад для электроники. Климат-контроль и антистатическая защита.'
  },
  {
    id: 'wh_huge_8', name: 'Огромный склад «Стройбаза»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 15_600_000, rentalIncome: 124_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Строительный район, ул. Кирпичная, д. 100',
    description: 'Склад для стройматериалов с открытой площадкой 5 000 м².'
  },
  {
    id: 'wh_huge_9', name: 'Огромный склад «Холод»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 17_000_000, rentalIncome: 136_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Северный район, ул. Морозная, д. 1',
    description: 'Крупнейший холодильный склад. Температура до −40 °C.'
  },
  {
    id: 'wh_huge_10', name: 'Огромный склад «Федеральный»', category: 'warehouse',
    area: HUGE_CAP, rooms: 0,
    price: 18_000_000, rentalIncome: 144_000, bonusPercent: 8, emoji: '🏗️',
    address: 'г. Новоград, Федеральная трасса, км 12, складской комплекс «Федеральный»',
    description: 'Флагманский склад у федеральной трассы. Крупнейший хаб для межрегиональных перевозок.'
  },
];