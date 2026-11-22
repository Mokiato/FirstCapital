import type { TransportDef } from '../types';

export const TRANSPORT: TransportDef[] = [
  { id: 't_bike', name: 'Велосипед', category: 'ground', price: 100_000, offlineBonusPercent: 1, reputation: 10, emoji: '🚲' },
  { id: 't_scooter', name: 'Скутер', category: 'ground', price: 1_000_000, offlineBonusPercent: 2, reputation: 25, emoji: '🛵' },
  { id: 't_hatchback', name: 'Малолитражка', category: 'ground', price: 5_000_000, offlineBonusPercent: 3, reputation: 50, emoji: '🚗' },
  { id: 't_sedan', name: 'Седан', category: 'ground', price: 25_000_000, offlineBonusPercent: 4, reputation: 100, emoji: '🚙' },
  { id: 't_suv', name: 'Внедорожник', category: 'ground', price: 100_000_000, offlineBonusPercent: 5, reputation: 250, emoji: '🚐' },
  { id: 't_sportscar', name: 'Спорткар', category: 'ground', price: 500_000_000, offlineBonusPercent: 6, reputation: 500, emoji: '🏎️' },
  { id: 't_boat', name: 'Катер', category: 'water', price: 2.5e9, offlineBonusPercent: 8, reputation: 1_000, emoji: '🚤' },
  { id: 't_yacht_small', name: 'Яхта малая', category: 'water', price: 12e9, offlineBonusPercent: 10, reputation: 2_500, emoji: '⛵' },
  { id: 't_helicopter', name: 'Вертолёт', category: 'helicopter', price: 60e9, offlineBonusPercent: 12, reputation: 5_000, emoji: '🚁' },
  { id: 't_jet', name: 'Бизнес-джет', category: 'air', price: 300e9, offlineBonusPercent: 15, reputation: 12_000, emoji: '🛩️' },
  { id: 't_megayacht', name: 'Мега-яхта', category: 'water', price: 1.5e12, offlineBonusPercent: 18, reputation: 30_000, emoji: '🛥️' },
  { id: 't_cruise', name: 'Круизный лайнер', category: 'water', price: 8e12, offlineBonusPercent: 22, reputation: 75_000, emoji: '🚢' },
  { id: 't_boeing', name: 'Частный Boeing', category: 'air', price: 40e12, offlineBonusPercent: 26, reputation: 180_000, emoji: '✈️' },
  { id: 't_sikorsky', name: 'Sikorsky S-92', category: 'helicopter', price: 200e12, offlineBonusPercent: 30, reputation: 400_000, emoji: '🚁' },
  { id: 't_spectre', name: 'Rolls-Royce Spectre', category: 'ground', price: 1e15, offlineBonusPercent: 36, reputation: 1_000_000, emoji: '🚘' },
  { id: 't_revuelto', name: 'Lamborghini Revuelto', category: 'ground', price: 5e15, offlineBonusPercent: 42, reputation: 2_500_000, emoji: '🚗' },
  { id: 't_chiron', name: 'Bugatti Chiron', category: 'ground', price: 25e15, offlineBonusPercent: 50, reputation: 6_000_000, emoji: '🏁' },
  { id: 't_galactic_cruiser', name: 'Галактический круизер', category: 'space', price: 150e15, offlineBonusPercent: 60, reputation: 15_000_000, emoji: '🛸' },
  { id: 't_starship_infinity', name: 'Звездолёт «Бесконечность»', category: 'space', price: 800e15, offlineBonusPercent: 75, reputation: 40_000_000, emoji: '🚀' },
  { id: 't_elon_fleet', name: 'Флот Илона', category: 'space', price: 5e18, offlineBonusPercent: 100, reputation: 100_000_000, emoji: '🌌' },
];
