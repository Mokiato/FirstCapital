
// src/data/events.ts

export type EventType =
  | 'raw_price_spike' | 'demand_boom' | 'inspection' | 'logistics_strike'
  | 'npc_success' | 'npc_fail' | 'seasonal_demand' | 'resource_shortage'
  | 'tax_audit' | 'festival' | 'employee_poach' | 'credit_downgrade'
  | 'oil_shock' | 'cat_barista' | 'heat_wave' | 'bread_meme' | 'container_stuck'
  | 'traffic_cleared' | 'logistics_tariffs' | 'energy_tariffs' | 'truck_stuck'
  | 'retail_closing' | 'factory_second_shift' | 'cat_conveyor' | 'bank_limits'
  | 'construction_prices' | 'grain_export' | 'courier_record' | 'office_workshops'
  | 'gromov_production' | 'gromov_checks' | 'gromov_traffic';

export interface EventTemplate {
  id: EventType;
  name: string;
  description: string;
  durationMonths: [number, number];
  affectedSectors?: string[];
  affectedResources?: string[];
  effects: string;
  playerActions: string[];
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  { id: 'raw_price_spike',  name: 'Скачок цен на сырьё',      description: '+20–40% к цене ресурса',           durationMonths: [1, 3], effects: 'Цены ресурсов растут',                    playerActions: ['Закупиться заранее', 'Переждать'] },
  { id: 'demand_boom',      name: 'Рост спроса на категорию', description: '+25% к выручке сектора',           durationMonths: [1, 2], effects: 'Выручка сектора растёт',                  playerActions: ['Расширить склад', 'Повысить цены'] },
  { id: 'inspection',       name: 'Проверка предприятия',     description: 'Штраф при нарушениях',              durationMonths: [1, 1], effects: 'Проверка',                                playerActions: ['Назначить управляющего', 'Найм юриста'] },
  { id: 'logistics_strike', name: 'Забастовка логистов',      description: '+50% к стоимости доставки',         durationMonths: [1, 1], effects: 'Доставка дороже',                         playerActions: ['Свой транспорт', 'Свой логист'] },
  { id: 'npc_success',      name: 'Успех NPC-компании',       description: 'Её акции +15%',                     durationMonths: [1, 1], effects: 'Акции растут',                            playerActions: ['Продать на пике', 'Держать'] },
  { id: 'npc_fail',         name: 'Провал NPC-компании',      description: 'Её акции −20%',                     durationMonths: [1, 1], effects: 'Акции падают',                            playerActions: ['Купить на падении', 'Пропустить'] },
  { id: 'seasonal_demand',  name: 'Сезонный спрос',           description: '+30% к выручке отдельных бизнесов', durationMonths: [1, 2], effects: 'Спрос растёт',                            playerActions: ['Сделать запас', 'Принять контракт'] },
  { id: 'resource_shortage', name: 'Временный дефицит',       description: 'Ресурс недоступен частично',        durationMonths: [1, 1], effects: 'Ресурс пропадает с рынка',                playerActions: ['Использовать склад', 'Переждать'] },
  { id: 'tax_audit',        name: 'Налоговая проверка',       description: 'Доп. налог 5–10%',                  durationMonths: [1, 1], effects: 'Доп. налог',                              playerActions: ['Бухгалтер снижает риск', 'Заплатить'] },
  { id: 'festival',         name: 'Городской фестиваль',      description: 'Спрос на еду/развлечения +40%',     durationMonths: [1, 1], effects: 'Спрос растёт',                            playerActions: ['Повысить цены', 'Сделать запас'] },
  { id: 'employee_poach',   name: 'Переманивание сотрудника', description: 'Риск ухода управленца',             durationMonths: [1, 1], effects: 'Сотрудник может уйти',                    playerActions: ['Повысить зарплату', 'Найти замену'] },
  { id: 'credit_downgrade', name: 'Ужесточение кредитования', description: '+2% к ставке',                      durationMonths: [2, 2], effects: 'Кредиты дороже',                          playerActions: ['Не брать кредит', 'Погасить досрочно'] },
    // ─── Мемные события (Фаза 4) ─────────────────────────
  { id: 'oil_shock',       name: 'Нефтяной шок',                  description: 'Цены на топливо +25%, акции нефтяных компаний растут', durationMonths: [3, 3], effects: 'Топливо дорожает',                        playerActions: ['Закупиться заранее', 'Купить акции нефтяных'] },
  { id: 'cat_barista',     name: 'Кот-бариста завирусился',       description: 'Спрос на кофейни и кафе +30%',                        durationMonths: [2, 2], effects: 'Спрос в услугах растёт',                    playerActions: ['Закупить зёрна', 'Открыть кофейню'] },
  { id: 'heat_wave',       name: 'Аномальная жара',               description: 'Напитки +40%, выручка магазинов +20%',                durationMonths: [2, 2], effects: 'Спрос на напитки растёт',                   playerActions: ['Закупить напитки', 'Расширить склад'] },
  { id: 'bread_meme',      name: 'Домашний хлеб — мем недели',    description: 'Выпечка +20% к спросу, мука +10% к цене',              durationMonths: [2, 2], effects: 'Спрос на выпечку растёт',                   playerActions: ['Закупить муку', 'Открыть пекарню'] },
  { id: 'container_stuck', name: 'Контейнеры застряли в порту',   description: 'Импортные товары +15% к цене',                      durationMonths: [2, 2], effects: 'Электроника и запчасти дорожают',           playerActions: ['Закупиться заранее', 'Перейти на местное'] },
    // ─── Серьёзные события (Фаза 5) ─────────────────────
  { id: 'traffic_cleared',      name: 'Пробки на Объездной рассосались',  description: 'Логистика ускоряется, фуры едут. Поставки +5%, топливо −2%',       durationMonths: [2, 2], effects: 'Логистика дешевеет',                playerActions: ['Закупиться', 'Ускорить поставки'] },
  { id: 'logistics_tariffs',    name: 'Логистика предупредила о росте тарифов', description: '«Всё подорожало, даже воздух в фуре». Топливо +5%',           durationMonths: [2, 2], effects: 'Топливо дорожает',                  playerActions: ['Свой транспорт', 'Запастись заранее'] },
  { id: 'energy_tariffs',       name: 'Энергетики предупредили о росте тарифов', description: '«Свет стал умнее — и дороже». Топливо +4%',                   durationMonths: [2, 2], effects: 'Топливо дорожает',                  playerActions: ['Запастись заранее', 'Снизить энергозатраты'] },
  { id: 'truck_stuck',          name: 'Фура с пряниками застряла на трассе', description: 'Поставки сладостей под угрозой, цены растут',                    durationMonths: [1, 1], effects: 'Сладости дорожают',                 playerActions: ['Использовать склад', 'Закупиться заранее'] },
  { id: 'retail_closing',       name: 'Крупный ритейлер закрыл 10 точек',    description: '«Это не закрытие, а перестановка». Спрос в ретейле −3%',         durationMonths: [2, 2], effects: 'Спрос в ретейле падает',            playerActions: ['Переждать', 'Снизить цены'] },
  { id: 'factory_second_shift', name: 'Завод «Прогресс» — вторая смена',    description: 'Рабочие: «Главное — не третья». Спрос на продукцию +10%',        durationMonths: [2, 2], effects: 'Спрос на промышленное растёт',      playerActions: ['Увеличить выпуск', 'Заключить контракт'] },
  { id: 'cat_conveyor',         name: 'Завод остановился из-за кота на конвейере', description: 'Кот ушёл, смена кончилась. Спрос на продукцию завода −5%',  durationMonths: [1, 1], effects: 'Спрос на промышленное падает',      playerActions: ['Переждать', 'Подстраховаться'] },
  { id: 'bank_limits',          name: 'Банк ввёл временные ограничения',     description: 'В соседнем отделении очередь из оптимистов. Акции банка −5%',     durationMonths: [1, 1], effects: 'Акции банка падают',                playerActions: ['Продать акции', 'Купить на падении'] },
  { id: 'construction_prices',  name: 'Стройматериалы подорожали',           description: '«Цемент тоже хочет кушать». Стройматериалы +6%',                 durationMonths: [2, 2], effects: 'Стройматериалы дорожают',           playerActions: ['Закупиться заранее', 'Переждать'] },
  { id: 'grain_export',         name: 'Экспорт зерна вырос',                 description: '«Хлеб есть, и это уже новость». Мука дешевеет',                  durationMonths: [2, 2], effects: 'Мука дешевеет',                     playerActions: ['Закупиться', 'Открыть пекарню'] },
  { id: 'courier_record',       name: 'Курьер проехал 40 км за один чек',    description: '«Новый стандарт качества». Логистика +5%',                       durationMonths: [1, 1], effects: 'Логистика дорожает',                playerActions: ['Переждать'] },
  { id: 'office_workshops',     name: 'Офисы сдаются под мастерские',        description: 'Собственники изучают спрос. Спрос на офисные услуги +3%',        durationMonths: [2, 2], effects: 'Офисные услуги растут',             playerActions: ['Расширить офисы'] },
  // ─── Мемные события с Громовым ──────────────────────
  { id: 'gromov_production',    name: 'Громов: «Однако! Производство надо поднимать!»', description: 'Рабочие аплодировали. Спрос на промышленное +4%',    durationMonths: [2, 2], effects: 'Промышленность растёт',             playerActions: ['Увеличить выпуск', 'Купить акции'] },
  { id: 'gromov_checks',        name: 'Громов пообещал «лично проверить каждый чек»',   description: 'Ретейл нервничает. Спрос −2%',                       durationMonths: [1, 1], effects: 'Ретейл осторожничает',              playerActions: ['Переждать', 'Проверить отчёты'] },
  { id: 'gromov_traffic',       name: 'Громов потребовал «убрать пробки до обеда»',     description: 'Логисты ускорились. Поставки +5%, топливо −2%',       durationMonths: [2, 2], effects: 'Логистика ускоряется',             playerActions: ['Закупиться'] },
];

export const EVENT_TEMPLATES_BY_ID: Record<EventType, EventTemplate> = Object.fromEntries(
  EVENT_TEMPLATES.map(e => [e.id, e]),
) as Record<EventType, EventTemplate>;

export const EVENT_RULES = {
  averagePerMonth: 1,
  newsRetentionMonths: 12,
};