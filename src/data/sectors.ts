// src/data/sectors.ts
import type { SectorId } from './companies';

export interface SectorDef {
  id: SectorId;
  name: string;
  icon: string;
}

export const SECTORS: SectorDef[] = [
  { id: 'it',             name: 'IT и Технологии',    icon: '💻' },
  { id: 'healthcare',     name: 'Здравоохранение',    icon: '🩺' },
  { id: 'finance',        name: 'Финансы',            icon: '🏦' },
  { id: 'consumer',       name: 'Потребительские',    icon: '🛒' },
  { id: 'industrial',     name: 'Промышленность',     icon: '🏭' },
  { id: 'energy',         name: 'Энергетика',         icon: '⚡' },
  { id: 'raw',            name: 'Сырьё',              icon: '⛏️' },
  { id: 'utilities',      name: 'ЖКХ',                icon: '🚰' },
  { id: 'realestate',     name: 'Недвижимость',       icon: '🏢' },
  { id: 'communications', name: 'Коммуникации',       icon: '📡' },
];

export const SECTOR_BY_ID: Record<SectorId, SectorDef> = Object.fromEntries(
  SECTORS.map(s => [s.id, s]),
) as Record<SectorId, SectorDef>;