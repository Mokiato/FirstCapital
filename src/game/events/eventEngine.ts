import type { ActiveEvent, EventTemplate } from '../domain/types';

function makeId(templateId: string, month: number): string {
  return `${templateId}-${month}-${Math.random().toString(36).slice(2, 8)}`;
}

export function rollMonthlyEvent(
  templates: EventTemplate[], activeEvents: ActiveEvent[], currentMonth: number,
  chance = 0.8, random: () => number = Math.random,
): { activeEvents: ActiveEvent[]; createdEvent?: ActiveEvent } {
  const stillActive = activeEvents.filter((e) => e.endsAtMonth >= currentMonth);
  if (random() > chance || templates.length === 0) return { activeEvents: stillActive };
  const available = templates.filter((t) => !stillActive.some((e) => e.templateId === t.id));
  if (available.length === 0) return { activeEvents: stillActive };
  const totalWeight = available.reduce((sum, t) => sum + Math.max(0, t.weight), 0);
  if (totalWeight <= 0) return { activeEvents: stillActive };
  let roll = random() * totalWeight;
  let selected = available[0];
  for (const t of available) { roll -= Math.max(0, t.weight); if (roll <= 0) { selected = t; break; } }
  const duration = Math.max(1, selected.durationMonths);
  const createdEvent: ActiveEvent = {
    id: makeId(selected.id, currentMonth),
    templateId: selected.id,
    title: selected.title,
    description: selected.description,
    startedAtMonth: currentMonth + 1,
    endsAtMonth: currentMonth + duration,
    effects: selected.effects,
  };
  return { activeEvents: [...stillActive, createdEvent], createdEvent };
}

export function getSectorDemandMultiplier(activeEvents: ActiveEvent[], sectorId: string, currentMonth: number): number {
  return activeEvents.filter((e) => e.startedAtMonth <= currentMonth && e.endsAtMonth >= currentMonth).flatMap((e) => e.effects)
    .filter((ef) => ef.kind === 'sectorDemand' && ef.targetId === sectorId)
    .reduce((m, ef) => m * ef.multiplier, 1);
}

export function getSectorCostMultiplier(activeEvents: ActiveEvent[], sectorId: string, currentMonth: number): number {
  return activeEvents.filter((e) => e.startedAtMonth <= currentMonth && e.endsAtMonth >= currentMonth).flatMap((e) => e.effects)
    .filter((ef) => ef.kind === 'sectorCost' && ef.targetId === sectorId)
    .reduce((m, ef) => m * ef.multiplier, 1);
}

export function getResourcePriceMultiplier(activeEvents: ActiveEvent[], resourceId: string, currentMonth: number): number {
  return activeEvents.filter((e) => e.startedAtMonth <= currentMonth && e.endsAtMonth >= currentMonth).flatMap((e) => e.effects)
    .filter((ef) => ef.kind === 'resourcePrice' && ef.targetId === resourceId)
    .reduce((m, ef) => m * ef.multiplier, 1);
}

export function getCompanyPriceMultiplier(activeEvents: ActiveEvent[], companyId: string, currentMonth: number): number {
  return activeEvents.filter((e) => e.startedAtMonth <= currentMonth && e.endsAtMonth >= currentMonth).flatMap((e) => e.effects)
    .filter((ef) => ef.kind === 'companyPrice' && ef.targetId === companyId)
    .reduce((m, ef) => m * ef.multiplier, 1);
}
