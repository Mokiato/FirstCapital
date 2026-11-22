import type { Achievement, Quest } from '../types';

export const QUEST_POOL: Omit<Quest, 'progress' | 'claimed'>[] = [
  { id: 'q_earn_small', text: 'Заработайте 100 К ₽', target: 100_000, reward: 20_000, type: 'earn' },
  { id: 'q_earn_medium', text: 'Заработайте 1 М ₽', target: 1_000_000, reward: 250_000, type: 'earn' },
  { id: 'q_earn_big', text: 'Заработайте 10 М ₽', target: 10_000_000, reward: 3_000_000, type: 'earn' },
  { id: 'q_deal_1', text: 'Заключите 1 сделку', target: 1, reward: 50_000, type: 'deals' },
  { id: 'q_deal_3', text: 'Заключите 3 сделки', target: 3, reward: 200_000, type: 'deals' },
  { id: 'q_upgrade_3', text: 'Улучшите бизнес 3 раза', target: 3, reward: 100_000, type: 'upgrades' },
  { id: 'q_upgrade_10', text: 'Улучшите бизнес 10 раз', target: 10, reward: 500_000, type: 'upgrades' },
  { id: 'q_games_1', text: 'Сыграйте в 1 мини-игру', target: 1, reward: 30_000, type: 'games' },
  { id: 'q_games_3', text: 'Сыграйте в 3 мини-игры', target: 3, reward: 150_000, type: 'games' },
];

export function pickDailyQuests(seed: number): Quest[] {
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const ha = Math.abs(Math.sin(seed + a.id.length));
    const hb = Math.abs(Math.sin(seed + b.id.length));
    return ha - hb;
  });
  return shuffled.slice(0, 3).map((q) => ({ ...q, progress: 0, claimed: false }));
}

export const ACHIEVEMENTS: Omit<Achievement, 'claimed'>[] = [
  { id: 'a_earn_1m', text: 'Заработать 1 М ₽ за всё время', target: 1_000_000, type: 'totalEarned', reward: 100_000 },
  { id: 'a_earn_1b', text: 'Заработать 1 Б ₽ за всё время', target: 1_000_000_000, type: 'totalEarned', reward: 10_000_000 },
  { id: 'a_earn_1t', text: 'Заработать 1 Т ₽ за всё время', target: 1_000_000_000_000, type: 'totalEarned', reward: 500_000_000 },
  { id: 'a_biz_5', text: 'Владеть 5 бизнесами', target: 5, type: 'businessCount', reward: 200_000 },
  { id: 'a_biz_15', text: 'Владеть 15 бизнесами', target: 15, type: 'businessCount', reward: 5_000_000 },
  { id: 'a_biz_30', text: 'Владеть всеми 30 бизнесами', target: 30, type: 'businessCount', reward: 1_000_000_000 },
  { id: 'a_level_10', text: 'Достичь 10 уровня компании', target: 10, type: 'companyLevel', reward: 300_000 },
  { id: 'a_level_50', text: 'Достичь 50 уровня компании', target: 50, type: 'companyLevel', reward: 50_000_000 },
  { id: 'a_deals_10', text: 'Заключить 10 сделок', target: 10, type: 'dealsCount', reward: 1_000_000 },
  { id: 'a_deals_50', text: 'Заключить 50 сделок', target: 50, type: 'dealsCount', reward: 20_000_000 },
  { id: 'a_games_10', text: 'Сыграть 10 мини-игр', target: 10, type: 'gamesPlayed', reward: 500_000 },
];

export const PROMO_CODES: Record<string, { balance?: number; quints?: number; message: string }> = {
  START2026: { balance: 200_000, message: 'Стартовый бонус +200 000 ₽' },
  VIPCLUB: { quints: 50, message: '+50 квинтов' },
  BUSINESS: { balance: 1_000_000, message: '+1 000 000 ₽' },
  LUCKYDAY: { quints: 20, balance: 500_000, message: '+500 000 ₽ и +20 квинтов' },
};
