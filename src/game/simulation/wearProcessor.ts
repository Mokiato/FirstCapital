// src/game/simulation/wearProcessor.ts
// GDD v2.0 §8.2: Износ оборудования и страхование
// - Износ растёт на 2–5%/мес (зависит от типа предприятия)
// - При износе >70% риск поломки 4–8%/мес
// - Поломка: ущерб 3–6% от стоимости оборудования, простой 1 месяц
// - Инженерный сервис: −20% к вероятности и ущербу
// - Страхование: 0.4%/мес от стоимости, покрывает поломки полностью
// - Страховое бюро: +20% покрытия (до 90% при ЧП)

import type { MonthlyProcessor } from './monthlyKernel';
import type { GameState } from './types';
import { PRODUCTIONS_BY_ID } from '../data/productions';
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import { getOfficeBonuses } from '../selectors';

// Коэффициенты износа по типам предприятий
const WEAR_RATES: Record<string, number> = {
  // Производство (тяжёлое оборудование)
  prod_recycling: 0.04,
  prod_packaging: 0.03,
  prod_construction_mix: 0.04,
  prod_cleaning: 0.03,
  prod_soda: 0.03,
  prod_metal: 0.05,
  prod_med_supplies: 0.02,
  prod_furniture: 0.03,
  prod_lighting: 0.03,
  prod_autoparts: 0.04,
  prod_windows: 0.04,
  prod_filters: 0.03,
  prod_automation: 0.03,
  prod_refrigeration: 0.03,
  // Офисы (лёгкое оборудование)
  off_hr_bureau: 0.02,
  off_accounting_bureau: 0.02,
  off_procurement_center: 0.02,
  off_analytics_center: 0.02,
  off_insurance_bureau: 0.02,
  off_legal_bureau: 0.02,
  off_quality_lab: 0.02,
  off_engineering_service: 0.02,
  off_project_bureau: 0.02,
  off_system_integrator: 0.02,
  off_game_studio: 0.02,
};

// Базовый риск поломки при износе >70%
const BASE_BREAKDOWN_PROBABILITY = 0.06; // 6%
const BREAKDOWN_DAMAGE_MIN = 0.03; // 3% от стоимости
const BREAKDOWN_DAMAGE_MAX = 0.06; // 6% от стоимости

export const wearProcessor: MonthlyProcessor<GameState> = {
  id: 'wear',
  order: 13, // Перед enterpriseProcessor (14)
  run: (state, month) => {
    const journal = [...(state.journal || [])];
    const bonuses = getOfficeBonuses(state);

    // Инженерный сервис: −20% к вероятности и ущербу
    const hasEngineeringService = bonuses.breakdownReduction > 0;
    const breakdownProbMult = hasEngineeringService ? 0.8 : 1.0;
    const damageMult = hasEngineeringService ? 0.8 : 1.0;

    // Страховое бюро: +20% покрытия (до 90%)
    const hasInsuranceBureau = bonuses.insuranceCoverage > 0;
    const insuranceCoverage = hasInsuranceBureau ? 0.90 : 0.70;

    const updatedEnterprises = state.enterprises.map((ent) => {
      if (ent.status !== 'active') return ent;

      const def = PRODUCTIONS_BY_ID[ent.defId] || OFFICE_COMPANIES_BY_ID[ent.defId];
      if (!def) return ent;

      const updated = { ...ent };

      // 1. Износ растёт (2–5%/мес)
      const wearRate = WEAR_RATES[ent.defId] || 0.03;
      updated.wear = Math.min(100, (updated.wear || 0) + wearRate * 100);

      // 2. Страхование: списываем 0.4%/мес от стоимости оборудования
      if (updated.insured) {
        const insuranceCost = Math.round(def.equipmentCost * 0.004);
        if (Number(updated.cashBalance) >= insuranceCost) {
          updated.cashBalance = String(Number(updated.cashBalance) - insuranceCost);
          journal.push({
            id: `insurance-${ent.id}-${month}`,
            monthIndex: month,
            entityId: ent.id,
            type: 'expense',
            category: 'insurance',
            amount: insuranceCost,
            description: `Страхование ${def.name}`,
          });
        } else {
          // Не хватает денег — страхование отключается
          updated.insured = false;
          journal.push({
            id: `insurance-disabled-${ent.id}-${month}`,
            monthIndex: month,
            entityId: ent.id,
            type: 'info',
            category: 'insurance',
            amount: 0,
            description: `Страхование ${def.name} отключено (недостаточно средств)`,
          });
        }
      }

      // 3. Поломка (риск 4–8%/мес при износе >70%)
      if (updated.wear > 70 && month - (updated.lastBreakdownMonth || -6) >= 6) {
        const breakdownProb = BASE_BREAKDOWN_PROBABILITY * breakdownProbMult;
        if (Math.random() < breakdownProb) {
          const damagePct = BREAKDOWN_DAMAGE_MIN + Math.random() * (BREAKDOWN_DAMAGE_MAX - BREAKDOWN_DAMAGE_MIN);
          const damage = Math.round(def.equipmentCost * damagePct * damageMult);
          updated.lastBreakdownMonth = month;

          if (updated.insured) {
            // Страхование покрывает damage * coverage
            const covered = Math.round(damage * insuranceCoverage);
            const outOfPocket = damage - covered;

            if (Number(updated.cashBalance) >= outOfPocket) {
              updated.cashBalance = String(Number(updated.cashBalance) - outOfPocket);
              journal.push({
                id: `breakdown-insured-${ent.id}-${month}`,
                monthIndex: month,
                entityId: ent.id,
                type: 'expense',
                category: 'repair',
                amount: outOfPocket,
                description: `Поломка ${def.name} (страховка покрыла ${covered} ₽)`,
              });
            } else {
              // Не хватает на ремонт — простой
              updated.status = 'stopped';
              journal.push({
                id: `breakdown-stopped-${ent.id}-${month}`,
                monthIndex: month,
                entityId: ent.id,
                type: 'warning',
                category: 'repair',
                amount: outOfPocket,
                description: `Поломка ${def.name} — предприятие остановлено (недостаточно средств на ремонт)`,
              });
            }
          } else {
            // Без страхования — полный ущерб
            if (Number(updated.cashBalance) >= damage) {
              updated.cashBalance = String(Number(updated.cashBalance) - damage);
              journal.push({
                id: `breakdown-uninsured-${ent.id}-${month}`,
                monthIndex: month,
                entityId: ent.id,
                type: 'expense',
                category: 'repair',
                amount: damage,
                description: `Поломка ${def.name} (ремонт)`,
              });
            } else {
              // Не хватает на ремонт — простой
              updated.status = 'stopped';
              journal.push({
                id: `breakdown-stopped-uninsured-${ent.id}-${month}`,
                monthIndex: month,
                entityId: ent.id,
                type: 'warning',
                category: 'repair',
                amount: damage,
                description: `Поломка ${def.name} — предприятие остановлено (недостаточно средств на ремонт)`,
              });
            }
          }

          // Ремонт снижает износ на 30%
          updated.wear = Math.max(0, updated.wear - 30);
        }
      }

      return updated;
    });

    return {
      ...state,
      enterprises: updatedEnterprises,
      journal,
    };
  },
};