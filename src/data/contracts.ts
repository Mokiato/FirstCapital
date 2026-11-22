// src/data/contracts.ts

export type ContractSize = 'small' | 'large';

export interface ContractTemplate {
  size: ContractSize;
  durationMonthsRange: [number, number];
  resourcesCount: [number, number];
  rewardPercentOfMonthlyRevenue: [number, number];
  penaltyPercentOfReward: number;
  reputationGain: number;
  reputationLossOnFail: number;
  earlyBonusPercent: number;
}

export const CONTRACT_TEMPLATES: Record<ContractSize, ContractTemplate> = {
  small: {
    size: 'small',
    durationMonthsRange: [3, 3],
    resourcesCount: [1, 1],
    rewardPercentOfMonthlyRevenue: [0.15, 0.30],
    penaltyPercentOfReward: 0.30,
    reputationGain: 5,
    reputationLossOnFail: 10,
    earlyBonusPercent: 0.10,
  },
  large: {
    size: 'large',
    durationMonthsRange: [6, 12],
    resourcesCount: [1, 3],
    rewardPercentOfMonthlyRevenue: [0.50, 1.00],
    penaltyPercentOfReward: 0.50,
    reputationGain: 20,
    reputationLossOnFail: 30,
    earlyBonusPercent: 0.10,
  },
};

export function computeContractReward(
  size: ContractSize,
  monthlyRevenue: number,
  durationMonths: number,
  multiplier = 1,
): { reward: number; penalty: number; earlyBonus: number } {
  const t = CONTRACT_TEMPLATES[size];
  const [lo, hi] = t.rewardPercentOfMonthlyRevenue;
  const pct = lo + Math.random() * (hi - lo);
  const reward = monthlyRevenue * pct * durationMonths * multiplier;
  return {
    reward,
    penalty: reward * t.penaltyPercentOfReward,
    earlyBonus: reward * t.earlyBonusPercent,
  };
}