import type {
  CompetitorRuntime,
  MarketCompany,
} from '../domain/types';

export const MAX_ACTIVE_COMPETITORS = 20;

export function activateCompetitors(
  candidates: MarketCompany[],
  activeCompetitors: CompetitorRuntime[],
  playerSectors: string[],
  playerCompanyLevel: number,
  currentMonth: number,
  random: () => number = Math.random,
): CompetitorRuntime[] {
  const slots =
    MAX_ACTIVE_COMPETITORS - activeCompetitors.length;

  if (slots <= 0 || playerCompanyLevel < 5) {
    return [];
  }

  const eligible = candidates.filter(
    (company) =>
      company.competitorEligible &&
      !company.isActiveCompetitor &&
      playerSectors.includes(company.sectorId),
  );

  if (eligible.length === 0) {
    return [];
  }

  /*
   * Конкуренты появляются постепенно.
   * Чем выше уровень игрока, тем больше может добавиться за один месяц.
   */
  const maxNewCompetitors = Math.max(
    1,
    Math.min(3, Math.floor(playerCompanyLevel / 20) + 1),
  );

  const count = Math.min(
    slots,
    maxNewCompetitors,
    eligible.length,
  );

  const shuffled = [...eligible].sort(
    () => random() - 0.5,
  );

  return shuffled.slice(0, count).map((company) => ({
    id: `competitor-${company.id}`,
    companyId: company.id,
    companyName: company.name,
    sectorId: company.sectorId,

    priceMultiplier: 1,
    reputation: Math.max(0, Math.min(100, company.reputation)),
    marketShare: Math.max(0, Math.min(1, company.marketShare)),
    aggressiveness: 0.2 + random() * 0.6,

    activeSinceMonth: currentMonth,
  }));
}

export function simulateCompetitorMonth(
  competitor: CompetitorRuntime,
  random: () => number = Math.random,
): CompetitorRuntime {
  const priceMove = (random() - 0.5) * 0.1;
  const reputationMove = (random() - 0.48) * 4;

  return {
    ...competitor,
    priceMultiplier: Math.max(
      0.7,
      Math.min(1.4, competitor.priceMultiplier + priceMove),
    ),
    reputation: Math.max(
      0,
      Math.min(100, competitor.reputation + reputationMove),
    ),
    marketShare: Math.max(
      0,
      Math.min(
        0.9,
        competitor.marketShare +
          (random() - 0.5) * competitor.aggressiveness * 0.03,
      ),
    ),
  };
}

export function estimateDemandMultiplier(input: {
  playerPriceMultiplier: number;
  playerReputation: number;
  competitors: CompetitorRuntime[];
  sectorId: string;
}): number {
  const rivals = input.competitors.filter(
    (competitor) => competitor.sectorId === input.sectorId,
  );

  if (rivals.length === 0) {
    return 1;
  }

  const averageRivalPrice =
    rivals.reduce(
      (total, competitor) =>
        total + competitor.priceMultiplier,
      0,
    ) / rivals.length;

  const averageRivalReputation =
    rivals.reduce(
      (total, competitor) => total + competitor.reputation,
      0,
    ) / rivals.length;

  const priceAdvantage =
    (averageRivalPrice - input.playerPriceMultiplier) * 0.35;

  const reputationAdvantage =
    (input.playerReputation - averageRivalReputation) / 250;

  return Math.max(
    0.5,
    Math.min(1.5, 1 + priceAdvantage + reputationAdvantage),
  );
}