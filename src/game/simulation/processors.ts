// src/game/simulation/processors.ts
// Единый список процессоров, которые выполняются при завершении игрового месяца.
// Порядок задаётся полем order. Каждый процессор — чистая функция
// (state, monthIndex) => state.
//
// Порядок:
//   5  legacy-income    — текущий доход бизнесов и города (временно, до Блока 4)
//   10 payroll          — зарплаты сотрудников (Блок 7)
//   20 businesses       — реальная экономика бизнесов (Блок 4)
//   30 credits          — платежи по кредитам и просрочки (Блок 12)
//   40 market           — дивиденды, купоны, события рынка (Блок 9)
//   50 events           — крупные события месяца (Блок 8)
//   90 capital-snapshot — снимок капитала для графика (Блок 3)
//
// Заглушки возвращают state без изменений. Они нужны, чтобы в следующих
// блоках можно было просто заменить тело, не меняя структуру.

import type { GameState } from '../store';
import { getOfficeBonuses } from '../selectors';
import type { MonthlyProcessor } from './monthlyKernel';
import { processCompletedMonths } from './monthlyKernel';
import { getCompanyLevel, getCityIncomePerSec } from '../selectors';
import { moneyAdd, moneyMul, moneyToNumber } from '../domain/money';
import { BUSINESSES } from '../../data/businesses';
import { PRODUCTIONS_BY_ID } from '../../data/productions';
import { OFFICE_COMPANIES_BY_ID } from '../../data/officeCompanies';
import type { EnterpriseRuntime } from '../domain/enterpriseTypes';
import { ZERO_MONEY } from '../domain/money';
import { REAL_ESTATE } from '../../data/realEstate';
import { getRemainingNpcDemand } from '../economy/npcDemand';
import {
  applySpeculativeMonthShock,
  calculateMonthlyDividendPerShare,
} from '../market/marketEngine';
import {
  findDefForRuntime,
  resourceRequirementsFromDef,
} from '../business/adapters';
import {
  settleLoanMonth,
  monthlyCreditScoreGrowth,
} from '../finance/creditEngine';
import { consumeMonthlyResources, withdrawFromWarehouse } from '../logistics/inventory';
import { settleBusinessMonth } from '../business/operations';
import { applyWalletTransaction } from '../economy/ledger';
import { rollMonthlyEvent, getSectorDemandMultiplier, getResourcePriceMultiplier } from '../events/eventEngine';
import { DOMAIN_EVENT_TEMPLATES } from '../events/adapters';
import { expireContracts } from '../contracts/contractEngine';
import { generateContracts } from '../contracts/adapters';
import type { BusinessRuntime, Warehouse, BondPosition, Money } from '../domain/types';
import type { WarehouseRuntime, WarehouseEvent } from '../domain/warehouseTypes';
import { RESOURCES_BY_ID } from '../../data/resources';
import {
  advanceEmployeesMonth,
  getMonthlyPayroll,
  getEmployeeEfficiency,
  getAutomationCapabilities,
} from '../staff/employeeEngine';
import type { EmployeeRuntime } from '../domain/types';
import { EMPLOYEE_ROLES_BY_ID } from '../../data/employees';
import {
  activateCompetitors,
  simulateCompetitorMonth,
  estimateDemandMultiplier,
  MAX_ACTIVE_COMPETITORS,
} from '../companies/competitorEngine';
import {
  accrueFundMonth,
  accrueBondMonth,
} from '../finance/investmentEngine';
import {
  FUND_DEFINITIONS_BY_ID,
  BOND_DEFINITIONS_BY_ID,
  tickMetalPrice,
} from '../finance/adapters';
import { getTransportReputation } from '../selectors';
// TODO(Блок 3): вынести эти селекторы в отдельный модуль или передавать
// через зависимость, чтобы processors.ts не зависел от selectors.

/**
 * Временный процессор дохода бизнесов и города — тот же расчёт, что был
 * в onCompletedMonths до рефакторинга. Будет удалён в Блоке 4, когда
 * настоящая экономика бизнесов (BusinessRuntime) заменит старый механизм.
 */

/**
 * TODO(Блок 7): зарплаты сотрудников (staff/employeeEngine.ts) — вычитать
 * из бизнес-счетов и останавливать бизнесы при нехватке.
 */
const payrollProcessor: MonthlyProcessor<GameState> = {
  id: 'payroll',
  order: 10,
  run: (state, month) => {
    if (!Array.isArray(state.employees) || state.employees.length === 0) {
      return state;
    }

    // 1. #10: Обновляем business.monthlyPayroll = фактические зарплаты за месяц.
    //    Деньги больше НЕ списываем здесь — это делает settleBusinessMonth
    //    (order 15), включая payroll в operatingCosts. Единственный
    //    источник списания зарплат — businessesProcessor.
    const journal = [...state.financeJournal];
    const updatedBusinesses = state.businesses.map((b) => {
      const payroll = getMonthlyPayroll(state.employees, b.id);
      if (payroll !== ZERO_MONEY) {
        journal.push({
          id: `ledger-salary-${b.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `business:${b.id}`,
          direction: 'expense',
          category: 'salary',
          amount: payroll,
          description: `${b.name}: зарплаты`,
          relatedEntityId: b.id,
        });
      }
      return { ...b, monthlyPayroll: payroll };
    });

    // 2. Продвигаем сотрудников (обновление стажа, уходы)
    const result = advanceEmployeesMonth(state.employees);

    // 3. Автозамена от HR
    const nextEmployees: EmployeeRuntime[] = [...result.employees];
    for (const resigned of result.resigned) {
      if (resigned.role === 'hr') continue; // HR сам себя не заменит
      const hasHr = nextEmployees.some(
        (e) => e.businessId === resigned.businessId && e.role === 'hr',
      );
      if (!hasHr) continue;

      // HR нанимает замену того же типа
      const def = EMPLOYEE_ROLES_BY_ID[resigned.role];
      if (!def) continue;
      const salary = Math.round(
        def.salaryMin + Math.random() * (def.salaryMax - def.salaryMin),
      );
      const months = Math.round(
        def.contractMinMonths +
          Math.random() * (def.contractMaxMonths - def.contractMinMonths),
      );
      nextEmployees.push({
        id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        businessId: resigned.businessId,
        role: resigned.role,
        name: def.name,
        qualification: 1 + Math.floor(Math.random() * 3),
        monthlySalary: String(salary),
        monthsEmployed: 0,
        monthsRemaining: months,
      });
      journal.push({
        id: `ledger-hire-${resigned.businessId}-${month}-${Date.now()}`,
        monthIndex: month,
        accountId: `business:${resigned.businessId}`,
        direction: 'expense',
        category: 'salary',
        amount: '0',
        description: `HR заменил: ${def.name}`,
        relatedEntityId: resigned.businessId,
      });
    }

    return {
      ...state,
      employees: nextEmployees,
      businesses: updatedBusinesses,
      financeJournal: journal,
    };
  },
};

/**
 * TODO(Блок 4): реальная экономика бизнесов. Заменит legacyIncomeProcessor.
 * Реализация будет использовать settleBusinessMonth() из
 * game/business/operations.ts и consumeMonthlyResources() из
 * game/logistics/inventory.ts.
 */
// ========== ПРОИЗВОДСТВА И ОФИСНЫЕ КОМПАНИИ ==========
// order 14 — ДО businesses (15), чтобы продукции было что потреблять.
const enterpriseProcessor: MonthlyProcessor<GameState> = {
  id: 'enterprises',
  order: 14,
  run: (state, month) => {
    if (!state.enterprises || state.enterprises.length === 0) return state;

    let balanceDecimal = state.balanceDecimal;
    const journal = [...state.financeJournal];
    const updatedEnterprises: EnterpriseRuntime[] = [];
        let monthlyNpcSold = { ...(state.monthlyNpcSold ?? {}) };

    // Копия складов
    const warehouses = (state.warehouses ?? []).map((w) => ({
      ...w,
      items: { ...w.items },
    }));

    for (const ent of state.enterprises) {
      if (ent.status === 'closed') {
        updatedEnterprises.push(ent);
        continue;
      }

      const isProduction = ent.type === 'production';
      const prodDef = isProduction ? PRODUCTIONS_BY_ID[ent.defId] : null;
      const offDef = !isProduction ? OFFICE_COMPANIES_BY_ID[ent.defId] : null;
      const def = prodDef ?? offDef;
      if (!def) {
        updatedEnterprises.push(ent);
        continue;
      }

      const updated: EnterpriseRuntime = {
        ...ent,
        inventory: { ...ent.inventory },
        // Defaults для старых сохранений
        accruedLiabilities: ent.accruedLiabilities ?? '0',
        monthsWithoutPayroll: ent.monthsWithoutPayroll ?? 0,
        monthsWithoutSupply: ent.monthsWithoutSupply ?? 0,
      };

      // ── 1. Зарплаты ────────────────────────────────────────────
      // Списание только из кассы предприятия. Нет денег — копится accruedLiabilities,
      // через 3 месяца неуплаты увольняются ВСЕ. Из кошелька игрока не списываем.
      const payroll = getMonthlyPayroll(state.employees, ent.id);
      updated.monthlyPayroll = payroll;

      const cash = Number(updated.cashBalance);
      const payrollNum = Number(payroll);
      if (payrollNum > 0) {
        if (cash >= payrollNum) {
          updated.cashBalance = String(cash - payrollNum);
          updated.monthsWithoutPayroll = 0;
          // Если были накопленные долги — уменьшаем их
          if (Number(updated.accruedLiabilities) > 0) {
            updated.accruedLiabilities = String(
              Math.max(0, Number(updated.accruedLiabilities) - payrollNum),
            );
          }
        } else {
          const shortfall = payrollNum - cash;
          updated.cashBalance = '0';
          updated.accruedLiabilities = String(
            Number(updated.accruedLiabilities) + payrollNum,
          );
          updated.monthsWithoutPayroll = (updated.monthsWithoutPayroll ?? 0) + 1;

          journal.push({
            id: `ledger-salary-unpaid-${ent.id}-${month}-${Date.now()}`,
            monthIndex: month,
            accountId: `enterprise:${ent.id}`,
            direction: 'expense',
            category: 'salary',
            amount: String(Math.round(payrollNum)),
            description: `${def.name}: зарплата не выплачена (долг ${Math.round(shortfall)} ₽, ${updated.monthsWithoutPayroll}/3 мес)`,
            relatedEntityId: ent.id,
          });

          if (updated.monthsWithoutPayroll >= 3) {
            updated.status = 'stopped';
            journal.push({
              id: `ledger-salary-fired-${ent.id}-${month}-${Date.now()}`,
              monthIndex: month,
              accountId: `enterprise:${ent.id}`,
              direction: 'expense',
              category: 'salary',
              amount: '0',
              description: `${def.name}: все сотрудники уволены (3 мес без зарплаты)`,
              relatedEntityId: ent.id,
            });
          }
        }
      }

      // ── 2. Производство ───────────────────────────
      if (isProduction && prodDef && updated.status === 'operating') {
        // 2a. Потребляем keyResources: инвентарь → привязанный склад (бесплатно) → NPC (за деньги).
        //     Если NPC не хватает — не покупаем, запоминаем дефицит. Из кошелька игрока не списываем.
        const whIdxForEnt = updated.linkedWarehouseId
          ? warehouses.findIndex((w) => w.id === updated.linkedWarehouseId)
          : -1;

        let totalShortageRatio = 1; // для частичного выпуска
        let anyShortage = false;

        for (const [resId, required] of Object.entries(prodDef.keyResources)) {
          const have = updated.inventory[resId]?.quantity ?? 0;
          let remaining = required;
          let obtained = 0;

          // Шаг 1: свой инвентарь — бесплатно
          const fromInventory = Math.min(have, remaining);
          if (fromInventory > 0) {
            const left = have - fromInventory;
            if (left <= 0) delete updated.inventory[resId];
            else updated.inventory[resId] = { ...updated.inventory[resId], quantity: left };
            remaining -= fromInventory;
            obtained += fromInventory;
          }

          // Шаг 2: склад игрока — бесплатно, товар перекладывается в инвентарь предприятия
          if (remaining > 0 && whIdxForEnt >= 0) {
            const wh = warehouses[whIdxForEnt];
            if (wh && !wh.activeEvent) {
              const draw = withdrawFromWarehouse(
                wh as unknown as Warehouse,
                resId,
                remaining,
              );
              if (draw.ok && draw.withdrawn > 0) {
                // Обновляем склад (withdrawFromWarehouse вернул новый объект)
                warehouses[whIdxForEnt] = {
                  ...wh,
                  items: draw.warehouse.items,
                };
                // Кладём в инвентарь предприятия с учётной стоимостью склада
                const existing = updated.inventory[resId];
                if (existing) {
                  const newQty = existing.quantity + draw.withdrawn;
                  const oldVal = Number(existing.averageUnitCost) * existing.quantity;
                  const addVal = draw.unitCost * draw.withdrawn;
                  updated.inventory[resId] = {
                    quantity: newQty,
                    averageUnitCost: String((oldVal + addVal) / newQty),
                  };
                } else {
                  updated.inventory[resId] = {
                    quantity: draw.withdrawn,
                    averageUnitCost: String(draw.unitCost),
                  };
                }
                // Сразу списываем из инвентаря (это расход месяца)
                const left = updated.inventory[resId].quantity - draw.withdrawn;
                if (left <= 0) delete updated.inventory[resId];
                else updated.inventory[resId] = { ...updated.inventory[resId], quantity: left };
                remaining -= draw.withdrawn;
                obtained += draw.withdrawn;

                journal.push({
                  id: `ledger-internal-transfer-${ent.id}-${resId}-${month}-${Date.now()}`,
                  monthIndex: month,
                  accountId: `enterprise:${ent.id}`,
                  direction: 'income',
                  category: 'internal_transfer',
                  amount: '0',
                  description: `${def.name}: со склада ${draw.withdrawn} × ${RESOURCES_BY_ID[resId]?.name ?? resId} (учёт ${Math.round(draw.totalCost)} ₽)`,
                  relatedEntityId: ent.id,
                });
              }
            }
          }

          // Шаг 3: NPC — за деньги со своей кассы
          if (remaining > 0) {
            const res = RESOURCES_BY_ID[resId];
            const priceMult = getResourcePriceMultiplier(state.activeEvents ?? [], resId, month);
            const unitPrice = Number(res?.basePrice ?? 0) * 0.7 * priceMult;
            const cost = unitPrice * remaining;
            const entCash = Number(updated.cashBalance);
            if (entCash >= cost) {
              updated.cashBalance = String(entCash - cost);
              // В инвентарь — и сразу списать (это расход месяца)
              const existing = updated.inventory[resId];
              if (existing) {
                const newQty = existing.quantity + remaining;
                const oldVal = Number(existing.averageUnitCost) * existing.quantity;
                const addVal = unitPrice * remaining;
                updated.inventory[resId] = {
                  quantity: newQty,
                  averageUnitCost: String((oldVal + addVal) / newQty),
                };
              } else {
                updated.inventory[resId] = {
                  quantity: remaining,
                  averageUnitCost: String(unitPrice),
                };
              }
              const left = updated.inventory[resId].quantity - remaining;
              if (left <= 0) delete updated.inventory[resId];
              else updated.inventory[resId] = { ...updated.inventory[resId], quantity: left };
              obtained += remaining;
              remaining = 0;

              journal.push({
                id: `ledger-npc-purchase-${ent.id}-${resId}-${month}-${Date.now()}`,
                monthIndex: month,
                accountId: `enterprise:${ent.id}`,
                direction: 'expense',
                category: 'enterprise_purchase',
                amount: String(Math.round(cost)),
                description: `${def.name}: закупка ${remaining + obtained} × ${res?.name ?? resId} у NPC`,
                relatedEntityId: ent.id,
              });
            } else {
              // Не хватает денег — не покупаем. Запоминаем дефицит.
              anyShortage = true;
              const gotRatio = obtained / required;
              if (gotRatio < totalShortageRatio) totalShortageRatio = gotRatio;
              journal.push({
                id: `ledger-shortage-${ent.id}-${resId}-${month}-${Date.now()}`,
                monthIndex: month,
                accountId: `enterprise:${ent.id}`,
                direction: 'expense',
                category: 'enterprise_purchase',
                amount: '0',
                description: `${def.name}: не хватает ${Math.round(cost)} ₽ на ${res?.name ?? resId} (нужно ${remaining})`,
                relatedEntityId: ent.id,
              });
            }
          }
        }

        updated.monthsWithoutSupply = anyShortage
          ? (updated.monthsWithoutSupply ?? 0) + 1
          : 0;

        // 2b. Производим продукцию в инвентарь
        if (updated.status === 'operating') {
          for (const [resId, qty] of Object.entries(prodDef.produces)) {
                        // Частичный выпуск: если был дефицит — производим пропорционально.
            const partialMult = anyShortage ? totalShortageRatio : 1;
            const produced = Math.floor(qty * updated.level * partialMult);
            const existing = updated.inventory[resId];
            if (existing) {
              updated.inventory[resId] = {
                ...existing,
                quantity: existing.quantity + produced,
              };
            } else {
              const res = RESOURCES_BY_ID[resId];
              updated.inventory[resId] = {
                quantity: produced,
                averageUnitCost: String(res?.basePrice ?? 0),
              };
            }
          }

          // 2c. Распределение
          const whIdx = updated.linkedWarehouseId
            ? warehouses.findIndex((w) => w.id === updated.linkedWarehouseId)
            : -1;

          for (const resId of Object.keys(prodDef.produces)) {
            const total = updated.inventory[resId]?.quantity ?? 0;
            if (total <= 0) continue;

            const res = RESOURCES_BY_ID[resId];
            const basePrice = Number(res?.basePrice ?? 0);
            const dist = updated.productionDistribution?.[resId];

            let toWh = 0;
            let toSell = 0;

            if (whIdx < 0) {
              // Нет склада → всё на продажу (×0.7)
              toSell = total;
            } else if (dist) {
              toWh = Math.min(dist.toWarehouse, total);
              toSell = Math.min(dist.toSell, total - toWh);
            } else {
              // Склад есть, но ползунки не настроены → всё на склад
              toWh = total;
            }

            const unsold = total - toWh - toSell;

            // Зачисляем на склад
            if (toWh > 0 && whIdx >= 0) {
              const wh = warehouses[whIdx];
              const existing = wh.items[resId];
              if (existing) {
                wh.items[resId] = { ...existing, quantity: existing.quantity + toWh };
              } else {
                wh.items[resId] = {
                  resourceId: resId,
                  quantity: toWh,
                  averageUnitCost: String(basePrice),
                };
              }
            }

            // ── Проверка лимита NPC ────────────────────────
            // Один покупатель: toSell (×0.7) и unsold (×0.4) делят один лимит.
            const remaining = getRemainingNpcDemand(monthlyNpcSold, resId);
            const actualToSell = Math.min(toSell, remaining);
            const remainingAfterSell = remaining - actualToSell;
            const actualUnsold = Math.min(unsold, remainingAfterSell);

            const wantedToSell = toSell + unsold;
            const actuallySold = actualToSell + actualUnsold;
            const leftInInventory = wantedToSell - actuallySold;

            if (actuallySold > 0) {
              const revenue =
                actualToSell * basePrice * 0.7 +
                actualUnsold * basePrice * 0.4;
              updated.cashBalance = String(Number(updated.cashBalance) + revenue);
              monthlyNpcSold[resId] = (monthlyNpcSold[resId] ?? 0) + actuallySold;
            }

            // Непроданное из-за лимита остаётся в инвентаре предприятия
            if (leftInInventory > 0) {
              updated.inventory[resId] = {
                quantity: leftInInventory,
                averageUnitCost: String(basePrice),
              };
            } else {
              delete updated.inventory[resId];
            }

            if (leftInInventory > 0) {
              journal.push({
                id: `ledger-npc-limit-${ent.id}-${resId}-${month}-${Date.now()}`,
                monthIndex: month,
                accountId: `enterprise:${ent.id}`,
                direction: 'expense',
                category: 'enterprise_purchase',
                amount: '0',
                description: `${def.name}: спрос NPC на «${res?.name ?? resId}» исчерпан, ${leftInInventory} осталось в инвентаре`,
                relatedEntityId: ent.id,
              });
            }
          }
        }
      }

      // ── 3. Выручка, расходы, налог ────────────────────────
      // Payroll уже списан в шаге 1 — здесь его НЕ вычитаем повторно.
      const grossRevenue = Number(def.baseRevenue) * updated.level * updated.demandMultiplier;
      const monthlyExpenses =
        Number(updated.monthlyRent) +
        Number(updated.monthlyUtilities) +
        Number(updated.monthlyMaintenance);
      const profitBeforeTax = Math.max(0, grossRevenue - monthlyExpenses);
      const tax = profitBeforeTax * updated.taxRate;
      const netFlow = grossRevenue - monthlyExpenses - tax;

      const newCash = Number(updated.cashBalance) + netFlow;
      updated.cashBalance = String(Math.max(0, newCash));
      if (newCash < 0 && updated.status === 'operating') {
        updated.status = 'stopped';
        journal.push({
          id: `ledger-ent-stop-${ent.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `enterprise:${ent.id}`,
          direction: 'expense',
          category: 'enterprise_cost',
          amount: '0',
          description: `${def.name}: остановлено (касса ушла в минус)`,
          relatedEntityId: ent.id,
        });
      }

      if (grossRevenue > 0) {
        journal.push({
          id: `ledger-ent-revenue-${ent.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `enterprise:${ent.id}`,
          direction: 'income',
          category: 'enterprise_income',
          amount: String(Math.round(grossRevenue)),
          description: `${def.name}: выручка`,
          relatedEntityId: ent.id,
        });
      }

      updatedEnterprises.push(updated);
    }
    // Удаляем сотрудников предприятий, у которых 3+ месяца нет зарплаты
    const firedEnterpriseIds = new Set(
      updatedEnterprises
        .filter((e) => e.status === 'stopped' && (e.monthsWithoutPayroll ?? 0) >= 3)
        .map((e) => e.id),
    );
    const nextEmployees =
      firedEnterpriseIds.size > 0
        ? (state.employees ?? []).filter((e) => !firedEnterpriseIds.has(e.businessId))
        : state.employees;

    return {
      ...state,
      enterprises: updatedEnterprises,
      employees: nextEmployees,
      warehouses,
      monthlyNpcSold,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};
const competitorProcessor: MonthlyProcessor<GameState> = {
  id: 'competitors',
  order: 12,
  run: (state, month) => {
    const existing = state.competitors ?? [];

    // 1. Активные конкуренты меняют цены/репутацию/долю
    let updated = existing.map((c) => simulateCompetitorMonth(c));

    // 2. Активация новых (если есть место и уровень позволяет)
    const playerSectors = [
      ...new Set(
        (state.businesses ?? [])
          .map((b) => b.sectorId)
          .filter(Boolean),
      ),
    ];

    // #19: единый источник правды — getCompanyLevel (как в UI и рейтинге).
    // Раньше здесь была вторая формула Math.floor(newLevels/5)+1, которая
    // расходилась с UI на 1-2 уровня при 5+ бизнесах.
    const effectiveLevel = getCompanyLevel(state);
    if (updated.length < MAX_ACTIVE_COMPETITORS) {
      const fresh = activateCompetitors(
        state.marketCompanies ?? [],
        updated,
        playerSectors,
        effectiveLevel,
        month,
      );

      if (fresh.length > 0) {
        updated = [...updated, ...fresh];

        // Отметить в marketCompanies флаг isActiveCompetitor
        const freshIds = new Set(fresh.map((c) => c.companyId));
        const nextCompanies = (state.marketCompanies ?? []).map((c) =>
          freshIds.has(c.id) ? { ...c, isActiveCompetitor: true } : c,
        );

        return { ...state, competitors: updated, marketCompanies: nextCompanies };
      }
    }

    return { ...state, competitors: updated };
  },
};
// ========== C: СОБЫТИЯ СКЛАДОВ ==========
// Раз в 6 месяцев, 60% шанс. Управляющий решает сам (событие отменяется).
// Без управляющего — склад блокируется, игрок платит за устранение.
const warehouseProcessor: MonthlyProcessor<GameState> = {
  id: 'warehouse-events',
  order: 16,
  run: (state, month) => {
    if (!state.warehouses || state.warehouses.length === 0) return state;

    let news = state.news ?? [];

    const updatedWarehouses = state.warehouses.map((wh) => {
      // Уже есть активное событие → ждём игрока
      if (wh.activeEvent && !wh.activeEvent.resolved) return wh;

      // Раз в 6 месяцев (месяц 0, 6, 12, ...)
      if (month === 0 || month % 6 !== 0) return wh;

      // 60% шанс
      if (Math.random() > 0.6) return wh;

      // Управляющий решает сам
      const hasManager = wh.employees.some((e) => e.role === 'manager');
      if (hasManager) return wh;

      const hasStorekeeper = wh.employees.some((e) => e.role === 'storekeeper');
      const hasLoader = wh.employees.some((e) => e.role === 'loader');

      // Поломка возможна только если склад старше 6 месяцев
      const isOldEnough =
        wh.createdAtMonth === undefined || month - wh.createdAtMonth >= 6;

      const kinds: Array<'theft' | 'fire' | 'pipe_burst' | 'equipment_break'> = [
        'theft', 'fire', 'pipe_burst',
      ];
      if (isOldEnough) kinds.push('equipment_break');

      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const size = wh.size;

      // ── Применяем ущерб ──────────────────
      const newItems = { ...wh.items };
      let cost = 0;

      if (kind === 'theft') {
        const percentMin = hasStorekeeper ? 0.03 : 0.05;
        const percentMax = hasStorekeeper ? 0.10 : 0.15;
        const percent = percentMin + Math.random() * (percentMax - percentMin);
        const resIds = Object.keys(newItems).filter((id) => newItems[id].quantity > 0);
        if (resIds.length > 0) {
          const resId = resIds[Math.floor(Math.random() * resIds.length)];
          const lost = Math.ceil(newItems[resId].quantity * percent);
          newItems[resId] = {
            ...newItems[resId],
            quantity: Math.max(0, newItems[resId].quantity - lost),
          };
          if (newItems[resId].quantity === 0) delete newItems[resId];
        }
        const repairCosts = { small: 20_000, medium: 30_000, large: 50_000, huge: 80_000 };
        cost = repairCosts[size];
      } else if (kind === 'pipe_burst') {
        const percentMin = hasStorekeeper ? 0.01 : 0.05;
        const percentMax = hasStorekeeper ? 0.10 : 0.15;
        const percent = percentMin + Math.random() * (percentMax - percentMin);
        for (const resId of Object.keys(newItems)) {
          const lost = Math.ceil(newItems[resId].quantity * percent);
          newItems[resId] = {
            ...newItems[resId],
            quantity: Math.max(0, newItems[resId].quantity - lost),
          };
          if (newItems[resId].quantity === 0) delete newItems[resId];
        }
        const repairCosts = { small: 30_000, medium: 50_000, large: 70_000, huge: 100_000 };
        cost = repairCosts[size];
      } else if (kind === 'fire') {
        const percentMin = hasStorekeeper ? 0.05 : 0.10;
        const percentMax = hasStorekeeper ? 0.15 : 0.30;
        const percent = percentMin + Math.random() * (percentMax - percentMin);
        for (const resId of Object.keys(newItems)) {
          const lost = Math.ceil(newItems[resId].quantity * percent);
          newItems[resId] = {
            ...newItems[resId],
            quantity: Math.max(0, newItems[resId].quantity - lost),
          };
          if (newItems[resId].quantity === 0) delete newItems[resId];
        }
        const repairCosts = { small: 50_000, medium: 80_000, large: 120_000, huge: 200_000 };
        cost = repairCosts[size];
      } else if (kind === 'equipment_break') {
        let repairCost = 20_000 + Math.random() * 80_000;
        if (hasLoader) repairCost *= 0.9;
        if (hasStorekeeper) repairCost *= 0.9;
        cost = Math.round(repairCost);
      }

      const event: WarehouseEvent = {
        kind,
        month,
        cost: Math.round(cost),
        resolved: false,
      };

      const eventNames: Record<string, string> = {
        theft: 'Кража',
        fire: 'Пожар',
        pipe_burst: 'Прорыв трубы',
        equipment_break: 'Поломка оборудования',
      };

      news = [
        {
          id: `news_wh_event_${wh.id}_${month}_${Date.now()}`,
          monthIndex: month,
          title: `⚠️ ${eventNames[kind]} на складе «${wh.customName}»`,
          body: `Склад заблокирован. Требуется устранить за ${Math.round(cost).toLocaleString('ru-RU')} ₽.`,
          category: 'event',
        },
        ...news,
      ].slice(0, 200);

      return {
        ...wh,
        items: newItems,
        activeEvent: event,
        lastEventMonth: month,
      };
    });

    return {
      ...state,
      warehouses: updatedWarehouses,
      news,
    };
  },
};

const businessesProcessor: MonthlyProcessor<GameState> = {
  id: 'businesses',
  order: 15,
  run: (state, month) => {
    if (!Array.isArray(state.businesses) || state.businesses.length === 0) {
      return state;
    }

    let balanceDecimal = state.balanceDecimal;
    const journal = [...state.financeJournal];
    const updatedBusinesses: BusinessRuntime[] = [];
    const dismissBusinessIds = new Set<string>();

    // Бонусы от офисных компаний
    const officeBonuses = getOfficeBonuses(state);
    const taxMultiplier = 1 - officeBonuses.taxReduction;
    const globalDemandBonus = 1 + officeBonuses.demandBonus;

    let warehouses: WarehouseRuntime[] = (state.warehouses ?? []).map((w) => ({
      ...w,
      items: { ...w.items },
      reserved: { ...w.reserved },
    }));

    for (const business of state.businesses) {
      const def = findDefForRuntime(business, BUSINESSES);
      if (!def) {
        updatedBusinesses.push(business);
        continue;
      }

      const caps = getAutomationCapabilities(state.employees, business.id);
      const efficiency = getEmployeeEfficiency(state.employees, business.id);

      // ── A.4: штраф за нехватку рабочего персонала ──
      // Линейная зависимость: 0% штата → ×0 (нет выручки), 100% → ×1.
      const workerStaff = def.workerStaff ?? {};
      let totalRequired = 0;
      let totalHired = 0;
      for (const [roleId, required] of Object.entries(workerStaff)) {
        totalRequired += required;
        const hired = state.employees.filter(
          (e) => e.businessId === business.id && e.role === roleId,
        ).length;
        totalHired += Math.min(hired, required);
      }
      const staffingMultiplier =
        totalRequired > 0 ? totalHired / totalRequired : 1;

      const sectorDemand = getSectorDemandMultiplier(
        state.activeEvents ?? [],
        business.sectorId,
        month,
      );

      const playerReputation = getTransportReputation(state) || 50;
      const competitorDemand = estimateDemandMultiplier({
        playerPriceMultiplier: 1,
        playerReputation,
        competitors: state.competitors ?? [],
        sectorId: business.sectorId,
      });

      const requirements = resourceRequirementsFromDef(def);
      let supplied = false;
      let consumedResourceCost: Money = ZERO_MONEY;
      let whIdx = -1;

      // ── Стартовая поставка: первый месяц после открытия ──
      const isInitialMonth =
        business.initialSuppliedMonth !== undefined &&
        month === business.initialSuppliedMonth;

      if (isInitialMonth) {
        supplied = true;
        consumedResourceCost = ZERO_MONEY;
      } else {
        // ── Найти привязанный склад ─────────────────────
        whIdx = business.linkedWarehouseId
          ? warehouses.findIndex((w) => w.id === business.linkedWarehouseId)
          : -1;
        const wh = whIdx >= 0 ? warehouses[whIdx] : null;

        // C.2.3: если склад заблокирован событием — бизнес работает как «без склада»
        const isWarehouseBlocked =
          wh && wh.activeEvent && !wh.activeEvent.resolved;

        if (wh && !isWarehouseBlocked) {
          // Пересчёт резерва
          let reservedForBiz = 0;
          for (const req of requirements) {
            reservedForBiz += req.unitsPerLevel * business.level;
          }
          warehouses[whIdx].reserved = {
            ...warehouses[whIdx].reserved,
            [business.id]: reservedForBiz,
          };

          // ── Автозакупка, если есть manager ─────────────
          if (caps.autoManageOperations && business.status === 'operating') {
            const discount = wh.hasTrucks ? 0.5 : 0.7;

            for (const req of requirements) {
              const required = req.unitsPerLevel * business.level;
              const onWh = warehouses[whIdx].items[req.resourceId]?.quantity ?? 0;
              const need = Math.max(0, required - onWh);
              if (need <= 0) continue;

              const res = RESOURCES_BY_ID[req.resourceId];
              const priceMult = getResourcePriceMultiplier(state.activeEvents ?? [], req.resourceId, month);
              const unitPrice = Number(res?.basePrice ?? 0) * discount * priceMult;
              const cost = unitPrice * need;

              const cash = Number(business.cashBalance ?? 0);
              if (cash >= cost) {
                business.cashBalance = String(cash - cost);
              } else {
                // Не хватает на NPC — не покупаем, оставляем как дефицит.
                // Из кошелька игрока НЕ списываем.
                journal.push({
                  id: `ledger-biz-shortage-${business.id}-${req.resourceId}-${month}-${Date.now()}`,
                  monthIndex: month,
                  accountId: `business:${business.id}`,
                  direction: 'expense',
                  category: 'business_purchase',
                  amount: '0',
                  description: `${business.name}: не хватает ${Math.round(cost)} ₽ на ${res?.name ?? req.resourceId} (нужно ${need})`,
                  relatedEntityId: business.id,
                });
                continue; // не добавляем на склад, не списываем деньги
              }
              const existing = warehouses[whIdx].items[req.resourceId];
              if (existing) {
                const newQty = existing.quantity + need;
                const oldCost = Number(existing.averageUnitCost) * existing.quantity;
                const addCost = unitPrice * need;
                warehouses[whIdx].items[req.resourceId] = {
                  ...existing,
                  quantity: newQty,
                  averageUnitCost: String((oldCost + addCost) / newQty),
                };
              } else {
                warehouses[whIdx].items[req.resourceId] = {
                  resourceId: req.resourceId,
                  quantity: need,
                  averageUnitCost: String(unitPrice),
                };
              }
            }
          }

          // ── Потребление из склада ──────────────────────
          const consumption = consumeMonthlyResources(
            wh as unknown as Warehouse,
            requirements,
            business.level,
          );
          warehouses[whIdx].items = consumption.warehouse.items as any;
          supplied = consumption.supplied;
          consumedResourceCost = consumption.consumedValue;
        } else if (business.inventory && Object.keys(business.inventory).length > 0) {
          const pseudoWarehouse: Warehouse = {
            capacity: 1_000_000,
            items: business.inventory as any,
          };
          const consumption = consumeMonthlyResources(
            pseudoWarehouse,
            requirements,
            business.level,
          );
          business.inventory = consumption.warehouse.items as any;
          supplied = consumption.supplied;
          consumedResourceCost = consumption.consumedValue;
        }
      }

      // ── Расчёт месяца ──────────────────────────────
      // Бонусы: IT и развлекательные получают доп. выручку
      let sectorRevenueBonus = 1;
      if (business.sectorId === 'it') {
        sectorRevenueBonus *= 1 + officeBonuses.itRevenue;
      }
      if (business.id === 'cinema' || business.id === 'games') {
        sectorRevenueBonus *= 1 + officeBonuses.entertainmentRevenue;
      }

      const settlement = settleBusinessMonth(
        {
          ...business,
          demandMultiplier:
            business.demandMultiplier * sectorDemand * competitorDemand *
            globalDemandBonus * sectorRevenueBonus * staffingMultiplier,
          productivityMultiplier: efficiency,
          taxRate: business.taxRate * taxMultiplier,
        },
        {
          supplied,
          consumedResourceCost,
          eventMultiplier: 1,
        },
      );

      // ── B: бухгалтер — влияет на compliance (пока заглушка) ──
      // Бонус +5–30% к выручке убран (см. Фаза 6). В будущем:
      // - снижает риск штрафа при проверке
      // - обслуживает ограниченное число бизнесов
      const hasAccountant = state.employees.some(
        (e) => e.businessId === business.id && e.role === 'accountant',
      );
      settlement.business.compliance = hasAccountant ? 0.95 : 0.5;
      updatedBusinesses.push(settlement.business);

      // #17: 3 месяца простоя → сотрудники увольняются
      if (settlement.shouldDismissStaff && business.status !== 'closed') {
        dismissBusinessIds.add(business.id);
        journal.push({
          id: `ledger-dismiss-${business.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `business:${business.id}`,
          direction: 'expense',
          category: 'salary',
          amount: '0',
          description: `${business.name}: сотрудники уволены (3 мес простоя)`,
          relatedEntityId: business.id,
        });
      }

      // ── Производство (только если есть склад) ──────
      if (def.produces && settlement.business.status !== 'stopped' && whIdx >= 0) {
        const whForProd = warehouses[whIdx];
        for (const [outputId, outputPerLevel] of Object.entries(def.produces)) {
          const totalOutput = Math.floor(outputPerLevel * business.level);
          if (totalOutput <= 0) continue;

          const usedNow = Object.values(whForProd.items).reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const reservedTotal = Object.values(whForProd.reserved).reduce(
            (sum, v) => sum + v,
            0,
          );
          const effectiveCapacity = whForProd.capacity;
          const free = effectiveCapacity - usedNow - reservedTotal;
          if (totalOutput > free) continue;

          const res = RESOURCES_BY_ID[outputId]?.basePrice ?? 0;
          const existing = whForProd.items[outputId];
          if (existing) {
            const newQty = existing.quantity + totalOutput;
            const oldCost = Number(existing.averageUnitCost) * existing.quantity;
            const addCost = res * totalOutput;
            whForProd.items[outputId] = {
              ...existing,
              quantity: newQty,
              averageUnitCost: String((oldCost + addCost) / newQty),
            };
          } else {
            whForProd.items[outputId] = {
              resourceId: outputId,
              quantity: totalOutput,
              averageUnitCost: String(res),
            };
          }
        }
      }

      // ── Журнал ─────────────────────────────────────
      if (settlement.revenue !== '0' && settlement.revenue !== ZERO_MONEY) {
        journal.push({
          id: `ledger-revenue-${business.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `business:${business.id}`,
          direction: 'income',
          category: 'business_income',
          amount: settlement.revenue,
          description: `${business.name}: выручка`,
          relatedEntityId: business.id,
        });
      }

      const totalCost = moneyAdd(settlement.operatingCosts, settlement.tax);
      if (totalCost !== '0' && totalCost !== ZERO_MONEY) {
        journal.push({
          id: `ledger-cost-${business.id}-${month}-${Date.now()}`,
          monthIndex: month,
          accountId: `business:${business.id}`,
          direction: 'expense',
          category: 'business_cost',
          amount: totalCost,
          description: `${business.name}: расходы`,
          relatedEntityId: business.id,
        });
      }
    }

    const nextEmployees =
      dismissBusinessIds.size > 0
        ? state.employees.filter((e) => !dismissBusinessIds.has(e.businessId))
        : state.employees;

    return {
      ...state,
      businesses: updatedBusinesses,
      employees: nextEmployees,
      warehouses,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};
// ========== БЛОК 14: Налоговые поступления в казну города ==========
// 1 игровой месяц = 600 реальных секунд (GDD: 10 минут на x1).
// getCityIncomePerSec уже возвращает ₽/сек, поэтому умножаем на 600.
// Это та же формула, что видит игрок в UI — доход города не расходится с
// отображением.
const GAME_MONTH_SECONDS = 600;

const cityTreasuryProcessor: MonthlyProcessor<GameState> = {
  id: 'city-treasury',
  order: 25, // между businesses (15) и credits (30): доход собран → долги списаны
  run: (state, _month) => {
    const perSecond = getCityIncomePerSec(state);
    const monthly = Math.floor(perSecond * GAME_MONTH_SECONDS);
    if (monthly <= 0) return state;

    return {
      ...state,
      city: {
        ...state.city,
        treasury: state.city.treasury + monthly,
      },
    };
  },
};
// ========== АРЕНДА НЕДВИЖИМОСТИ И ЖКХ СКЛАДОВ ==========
const rentalProcessor: MonthlyProcessor<GameState> = {
  id: 'rental',
  order: 28, // После бизнесов (15), но до кредитов (30)
  run: (state, month) => {
    let balanceDecimal = state.balanceDecimal;
    const journal = [...state.financeJournal];
    const nextRented: Record<string, any> = {};

    // 1. Начисление арендной платы
    for (const [id, rental] of Object.entries(state.rentedProperties ?? {})) {
      const tx = applyWalletTransaction({
        balance: balanceDecimal,
        amount: String(rental.rentPrice),
        direction: 'income',
        monthIndex: month,
        accountId: 'player_main',
        category: 'rental_income',
        description: `Аренда: ${rental.tenantName} (${id})`,
        relatedEntityId: id,
      });
      if (tx.ok) {
        balanceDecimal = tx.balance;
        journal.push(tx.entry);
      }

      // Уменьшаем срок аренды
      const monthsLeft = rental.monthsLeft - 1;
      if (monthsLeft > 0) {
        nextRented[id] = { ...rental, monthsLeft };
      }
      // Если monthsLeft === 0 — арендатор съехал, в nextRented не добавляем.
      // Склад/квартира снова пустует, ЖКХ снова платит игрок.
    }

    // 2. Оплата ЖКХ (только для купленных складов в режиме "Личное пользование")
    const ownedWarehouses = (state.ownedProperty ?? []).filter((id) => {
      const def = REAL_ESTATE.find((r) => r.id === id);
      return def?.category === 'warehouse';
    });

    for (const whId of ownedWarehouses) {
      const mode = state.propertyMode[whId] ?? 'personal';
      if (mode === 'rent') continue; // Если сдан — ЖКХ не платим

      const def = REAL_ESTATE.find((r) => r.id === whId);
      if (!def) continue;

      // ЖКХ = 20% от базовой аренды склада (для баланса)
      const maintenance = Math.round(def.rentalIncome * 0.2);
      
      const tx = applyWalletTransaction({
        balance: balanceDecimal,
        amount: String(maintenance),
        direction: 'expense',
        monthIndex: month,
        accountId: 'player_main',
        category: 'warehouse_maintenance',
        description: `ЖКХ склада: ${def.name}`,
        relatedEntityId: whId,
      });
      if (tx.ok) {
        balanceDecimal = tx.balance;
        journal.push(tx.entry);
      }
    }

    return {
      ...state,
      rentedProperties: nextRented,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};

/**
 * TODO(Блок 12): месячный платёж по кредитам, просрочки и обновление
 * кредитного рейтинга (finance/creditEngine.ts).
 */
const creditsProcessor: MonthlyProcessor<GameState> = {
  id: 'credits',
  order: 30,
  run: (state, month) => {
    const activeLoan = (state.loans ?? []).find((l) => l.status === 'active');

    let balanceDecimal = state.balanceDecimal;
    let creditScore = state.creditScore ?? 100;
    let loans = state.loans ?? [];
    let businesses = state.businesses ?? [];
    let warehouses = state.warehouses ?? [];
    let fixedDeposits = state.fixedDeposits ?? [];
    let marketPositions = state.marketPositions ?? [];
    let gameOver = state.gameOver ?? false;
    const journal = [...state.financeJournal];

    // ── 1. Платёж по активному кредиту ────────────────────────────
    if (activeLoan) {
      // availableIncome = balanceDecimal (уже после начисления доходов)
      const available = balanceDecimal;

      const result = settleLoanMonth(activeLoan, available, creditScore);

      // Списать платёж (только если payment > 0)
      if (Number(result.payment) > 0) {
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: result.payment,
          direction: 'expense',
          monthIndex: month,
          accountId: 'player_main',
          category: 'loan_principal',
          description: `Платёж по кредиту`,
          relatedEntityId: activeLoan.id,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
      }

      // Штраф (если был)
      if (Number(result.penalty) > 0) {
        const penalty = result.penalty;
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: penalty,
          direction: 'expense',
          monthIndex: month,
          accountId: 'player_main',
          category: 'loan_interest',
          description: `Штраф за просрочку`,
          relatedEntityId: activeLoan.id,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
      }

      creditScore = result.creditScore;

      // ── Действия банка ─────────────────────────────────────────
      if (result.action === 'seize_business' && businesses.length > 0) {
        // Продать самый дешёвый бизнес за 50%
        const sold = [...businesses].sort((a, b) => {
          const aVal = Number(a.cashBalance ?? 0);
          const bVal = Number(b.cashBalance ?? 0);
          return aVal - bVal;
        })[0];

        if (sold) {
          const soldValue = Number(sold.cashBalance ?? 0) * 0.5;
          businesses = businesses.filter((b) => b.id !== sold.id);

          // Погасить часть долга
          const newLoanBalance = Math.max(
            0,
            Number(result.loan.balance) - soldValue,
          );
          result.loan = { ...result.loan, balance: String(newLoanBalance) };

          journal.push({
            id: `ledger-seize-${sold.id}-${month}`,
            monthIndex: month,
            accountId: `business:${sold.id}`,
            direction: 'expense',
            category: 'loan_interest',
            amount: String(soldValue),
            description: `Банк забрал: ${sold.name} (50% стоимости)`,
            relatedEntityId: sold.id,
          });
        }
      }

      if (result.action === 'bankruptcy' && !gameOver) {
        // ── Принудительная ликвидация активов ──────────────────
        // Сначала продаём всё, что можно, потом считаем, хватило ли на долг.
        let recovered = 0;

        // 1. Бизнесы: помещение (owned) + оборудование + касса
        for (const biz of businesses) {
          const bizDef = BUSINESSES.find((d) => d.id === biz.defId);
          if (!bizDef) continue;
          const premisesValue =
            (bizDef.premisesPrice ?? bizDef.fixedCosts * 24) * 0.5;
          const equipmentValue =
            (bizDef.startingEquipment ?? bizDef.fixedCosts * 2) * 0.3;
          const cash = Number(biz.cashBalance ?? 0);
          recovered += premisesValue + equipmentValue + cash;
        }
        businesses = [];

        // 2. Товары на складах — распродажа по ×0.4
        for (const wh of warehouses) {
          for (const item of Object.values(wh.items)) {
            const res = RESOURCES_BY_ID[item.resourceId];
            if (!res) continue;
            recovered += Number(res.basePrice) * 0.4 * item.quantity;
          }
        }
        warehouses = warehouses.map((w) => ({ ...w, items: {} }));

        // 3. Вклады — забираем тело (проценты не начисляем)
        for (const dep of fixedDeposits) {
          recovered += Number(dep.amount);
        }
        fixedDeposits = [];

        // 4. Акции — по текущей рыночной цене
        for (const pos of marketPositions) {
          const company = state.marketCompanies?.find((c) => c.id === pos.companyId);
          if (!company) continue;
          recovered += Number(company.price) * pos.shares;
        }
        marketPositions = [];

        // ── Погашение долга ────────────────────────────────
        balanceDecimal = String(Number(balanceDecimal) + recovered);
        const debtLeft = Number(result.loan.balance);
        const finalBalance = Number(balanceDecimal) - debtLeft;

        if (finalBalance >= 0) {
          // Долг покрыт — продолжаем без gameOver
          balanceDecimal = String(finalBalance);
          result.loan = { ...result.loan, balance: '0', status: 'paid' };
          journal.push({
            id: `ledger-liquidate-${month}`,
            monthIndex: month,
            accountId: 'player_main',
            direction: 'expense',
            category: 'loan_interest',
            amount: String(Math.round(debtLeft)),
            description: `Ликвидация активов: выручено ${Math.round(recovered)} ₽, долг ${Math.round(debtLeft)} ₽ покрыт`,
          });
        } else {
          // Долг не покрыт — gameOver
          balanceDecimal = '0';
          result.loan = { ...result.loan, status: 'defaulted' };
          gameOver = true;
          journal.push({
            id: `ledger-gameover-${month}`,
            monthIndex: month,
            accountId: 'player_main',
            direction: 'expense',
            category: 'loan_interest',
            amount: String(Math.round(debtLeft)),
            description: `Банкротство: ликвидация покрыла ${Math.round(recovered)} ₽ из ${Math.round(debtLeft)} ₽ долга. Игра окончена.`,
          });
        }
      }
      // Обновить кредит в массиве
      loans = loans.map((l) => (l.id === activeLoan.id ? result.loan : l));
    }

    // ── 2. Рост рейтинга за активы/уровень/возраст ───────────────
    const activeLoanAfter = loans.find((l) => l.status === 'active');
    const totalBusinessLevels = businesses.reduce(
      (sum, b) => sum + (b.level ?? 1),
      0,
    );
    const companyLevel = Math.max(1, Math.floor(totalBusinessLevels / 5) + 1);
    const companyAgeMonths = month;

    creditScore = monthlyCreditScoreGrowth({
      score: creditScore,
      companyLevel,
      companyAgeMonths,
      debtFree: !activeLoanAfter,
      positiveAssets: Number(balanceDecimal) > 0,
    });

    return {
      ...state,
      loans,
      businesses,
      warehouses,
      fixedDeposits,
      marketPositions,
      gameOver,
      creditScore,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};

/**
 * TODO(Блок 9): дивиденды по акциям, купоны по облигациям, доход по фондам
 * (finance/investmentEngine.ts, market/marketEngine.ts).
 */
const investmentProcessor: MonthlyProcessor<GameState> = {
  id: 'investment',
  order: 35,
  run: (state, month) => {
    let balanceDecimal = state.balanceDecimal;
    const journal = [...state.financeJournal];

    // ── Фонды: начисление дохода ────────────────────────────────
    let funds = state.funds ?? [];
    funds = funds.map((position) => {
      const def = FUND_DEFINITIONS_BY_ID[position.fundId];
      if (!def) return position;

      const result = accrueFundMonth(position, def);
      const income = result.income;
      if (Number(income) > 0) {
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: income,
          direction: 'income',
          monthIndex: month,
          accountId: 'player_main',
          category: 'fund_income',
          description: `Фонд: ${def.name}`,
          relatedEntityId: position.fundId,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
      }
      return result.position;
    });

    // ── Облигации: купоны + созревание ─────────────────────────
    let bonds = state.bonds ?? [];
    const maturedBonds: BondPosition[] = [];
    bonds = bonds.map((position) => {
      const def = BOND_DEFINITIONS_BY_ID[position.bondId];
      if (!def) return position;

      const result = accrueBondMonth(
        position,
        def.annualCouponRate,
        def.faceValue,
      );

      if (Number(result.coupon) > 0) {
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: result.coupon,
          direction: 'income',
          monthIndex: month,
          accountId: 'player_main',
          category: 'coupon',
          description: `Купон: ${def.name}`,
          relatedEntityId: position.bondId,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
      }

      if (result.matured) {
        const faceValue = String(Number(def.faceValue) * position.quantity);
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: faceValue,
          direction: 'income',
          monthIndex: month,
          accountId: 'player_main',
          category: 'bond_maturity',
          description: `Погашение: ${def.name}`,
          relatedEntityId: position.bondId,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
        maturedBonds.push(position);
        return result.position;
      }
      return result.position;
    });

    if (maturedBonds.length > 0) {
      bonds = bonds.filter(
        (b) => !maturedBonds.some((m) => m.bondId === b.bondId),
      );
    }

    // ── Металлы: изменение цены ────────────────────────────────
    const metals = (state.metals ?? []).map((m) => ({
      ...m,
      currentPrice: tickMetalPrice(m.metalId, m.currentPrice),
    }));

    // ── ВКЛАДЫ (order 35, внутри investmentProcessor) ──────────
    // 1. Накопительный счёт: +2% в месяц от остатка.
    let savingsBalance = state.savingsBalance ?? '0';
    if (Number(savingsBalance) > 0) {
      const interest = Number(savingsBalance) * 0.02;
      savingsBalance = String(Number(savingsBalance) + interest);
      journal.push({
        id: `ledger-savings-interest-${month}-${Date.now()}`,
        monthIndex: month,
        accountId: 'player_main',
        direction: 'income',
        category: 'savings_interest',
        amount: String(Math.round(interest)),
        description: 'Проценты по накопительному счёту',
      });
    }

    // 2. Срочные вклады: monthsLeft -= 1. На 0 — зачисляем тело + %.
    const remainingDeposits: typeof state.fixedDeposits = [];
    for (const dep of state.fixedDeposits ?? []) {
      const monthsLeft = dep.monthsLeft - 1;
      if (monthsLeft <= 0) {
        const payout = Number(dep.amount) * Math.pow(1 + dep.monthlyRate, dep.termMonths);
        const tx = applyWalletTransaction({
          balance: balanceDecimal,
          amount: String(Math.round(payout)),
          direction: 'income',
          monthIndex: month,
          accountId: 'player_main',
          category: 'deposit_maturity',
          description: 'Вклад закрыт (срок истёк)',
          relatedEntityId: dep.id,
        });
        if (tx.ok) {
          balanceDecimal = tx.balance;
          journal.push(tx.entry);
        }
      } else {
        remainingDeposits.push({ ...dep, monthsLeft });
      }
    }

    return {
      ...state,
      funds,
      bonds,
      metals,
      savingsBalance,
      fixedDeposits: remainingDeposits,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};

const marketProcessor: MonthlyProcessor<GameState> = {
  id: 'market',
  order: 40,
  run: (state, month) => {
    if (!Array.isArray(state.marketCompanies) || state.marketCompanies.length === 0) {
      return state;
    }

    // 1. Дивиденды
    let balanceDecimal = state.balanceDecimal;
    const journal = [...state.financeJournal];
    let totalDividends = '0';

    for (const pos of state.marketPositions ?? []) {
      const company = state.marketCompanies.find((c) => c.id === pos.companyId);
      if (!company) continue;
      if (company.annualDividendYield <= 0) continue;

      const perShare = calculateMonthlyDividendPerShare(company);
      const total = moneyMul(perShare, pos.shares);
      if (Number(total) <= 0) continue;

      const tx = applyWalletTransaction({
        balance: balanceDecimal,
        amount: total,
        direction: 'income',
        monthIndex: month,
        accountId: 'player_main',
        category: 'dividend',
        description: `Дивиденды: ${company.name} × ${pos.shares}`,
        relatedEntityId: company.id,
      });
      if (tx.ok) {
        balanceDecimal = tx.balance;
        journal.push(tx.entry);
        totalDividends = moneyAdd(totalDividends, total);
      }
    }

    // 2. Редкие шоки для спекулятивных компаний
    const shockedCompanies = state.marketCompanies.map((c) =>
      applySpeculativeMonthShock(c),
    );

    // Уведомление
    if (Number(totalDividends) > 0) {
      // Простое уведомление без toast — toast вызывается в store через onCompletedMonths.
      // Здесь только логируем в журнал.
    }

    return {
      ...state,
      marketCompanies: shockedCompanies,
      balanceDecimal,
      balance: moneyToNumber(balanceDecimal),
      financeJournal: journal,
    };
  },
};

/**
 * TODO(Блок 8): ролл крупных событий месяца и истечение активных событий
 * (events/eventEngine.ts).
 */
const eventsProcessor: MonthlyProcessor<GameState> = {
  id: 'events',
  order: 8, // до businessesProcessor (15), чтобы спрос успел примениться
  run: (state, month) => {
    const { activeEvents, createdEvent } = rollMonthlyEvent(
      DOMAIN_EVENT_TEMPLATES,
      state.activeEvents ?? [],
      month,
    );

    let news = state.news ?? [];

    if (createdEvent) {
      news = [
        {
          id: `news_event_${createdEvent.id}`,
          monthIndex: month,
          title: `📢 ${createdEvent.title}`,
          body: createdEvent.description,
          eventId: createdEvent.id,
          category: 'event',
        },
        ...news,
      ];
    }

    // Очистить новости старше 12 месяцев
    const minMonth = month - 12;
    news = news.filter((n) => n.monthIndex >= minMonth).slice(0, 200);

    return {
      ...state,
      activeEvents,
      news,
    };
  },
};

/**
 * TODO(Блок 3): снимок чистого капитала для графика. Пока график
 * собирается через старую capitalHistory в store — не трогаем.
 */
const contractsProcessor: MonthlyProcessor<GameState> = {
  id: 'contracts',
  order: 45,
  run: (state, month) => {
    let contracts = expireContracts(state.contracts ?? [], month);
    let news = state.news ?? [];

    // Генерировать новые, если доступных меньше 3
    const availableCount = contracts.filter((c) => c.status === 'available').length;
    if (availableCount < 3) {
      const fresh = generateContracts(month, 2);
      contracts = [...fresh, ...contracts].slice(0, 30);

      for (const nc of fresh) {
        news = [
          {
            id: `news_contract_new_${nc.id}`,
            monthIndex: month,
            title: `📋 Новый контракт: ${nc.title}`,
            body: nc.description,
            companyId: nc.clientCompanyId,
            category: 'contract',
          },
          ...news,
        ];
      }
    }

    return {
      ...state,
      contracts,
      news: news.slice(0, 200),
    };
  },
};
const capitalSnapshotProcessor: MonthlyProcessor<GameState> = {
  id: 'capital-snapshot',
  order: 90,
  run: (state) => {
    // Снимок делаем через store — он умеет вычислять капитал.
    // Здесь не вызываем captureCapitalSnapshot напрямую, потому что
    // processor работает с чистым state. Вместо этого возвращаем state
    // с флагом — но проще вызвать store после processCompletedMonths.
    // Поэтому снимок делает onCompletedMonths ПОСЛЕ runMonthlyProcessors.
    return state;
  },
};
/**
 * Сбрасывает счётчик продаж NPC в начале каждого игрового месяца.
 * order: 1 — раньше всех остальных процессоров.
 */
const npcDemandResetProcessor: MonthlyProcessor<GameState> = {
  id: 'npc-demand-reset',
  order: 1,
  run: (state) => ({ ...state, monthlyNpcSold: {} }),
};
/**
 * Единый список процессоров. При добавлении нового — просто дописываем
 * в массив с подходящим order. Порядок выполнения не зависит от порядка
 * в массиве: processCompletedMonths сортирует по order.
 */
export const MONTHLY_PROCESSORS: MonthlyProcessor<GameState>[] = [
  npcDemandResetProcessor,
  eventsProcessor,
  payrollProcessor,
  competitorProcessor,
  enterpriseProcessor,
  businessesProcessor,
  warehouseProcessor,
  cityTreasuryProcessor,
  rentalProcessor,
  creditsProcessor,
  investmentProcessor,
  marketProcessor,
  contractsProcessor,
  capitalSnapshotProcessor,
];

/**
 * Прогнать состояние игры через процессоры для всех завершённых месяцев.
 * Возвращает новый state (не мутирует исходный).
 */
export function runMonthlyProcessors(
  state: GameState,
  completedMonths: number[],
): GameState {
  return processCompletedMonths(state, completedMonths, MONTHLY_PROCESSORS);
}