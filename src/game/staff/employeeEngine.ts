import type {
  EmployeeRole,
  EmployeeRuntime,
  Money,
} from '../domain/types';
import {
  moneyAdd,
  moneyCmp,
  ZERO_MONEY,
} from '../domain/money';

export interface AutomationCapabilities {
  autoManageOperations: boolean;
  autoHire: boolean;
  autoLogistics: boolean;
  autoMarketing: boolean;
}

import { isManagementRole } from '../../data/employees';

/**
 * Может ли бизнес нанять сотрудника этой роли?
 * Управляющие роли — не более 1 на бизнес.
 * Рабочие роли — без ограничения (ограничение задаётся в workerStaff бизнеса).
 */
export function canHireRole(
  employees: EmployeeRuntime[],
  businessId: string,
  role: EmployeeRole,
): boolean {
  if (isManagementRole(role)) {
    return !employees.some(
      (employee) => employee.businessId === businessId && employee.role === role,
    );
  }
  return true;
}

export function hireEmployee(
  employees: EmployeeRuntime[],
  employee: EmployeeRuntime,
): {
  ok: boolean;
  employees: EmployeeRuntime[];
  reason?: string;
} {
  if (!canHireRole(employees, employee.businessId, employee.role)) {
    return {
      ok: false,
      employees,
      reason: 'Сотрудник этой должности уже нанят.',
    };
  }

  return {
    ok: true,
    employees: [...employees, employee],
  };
}

export function dismissEmployee(
  employees: EmployeeRuntime[],
  employeeId: string,
): EmployeeRuntime[] {
  return employees.filter(
    (employee) => employee.id !== employeeId,
  );
}

export function getAutomationCapabilities(
  employees: EmployeeRuntime[],
  businessId: string,
): AutomationCapabilities {
  const roles = new Set(
    employees
      .filter((employee) => employee.businessId === businessId)
      .map((employee) => employee.role),
  );

  return {
    autoManageOperations: roles.has('manager'),
    autoHire: roles.has('hr'),
    autoLogistics: roles.has('logist'),
    autoMarketing: roles.has('marketer'),
  };
}

export function getMonthlyPayroll(
  employees: EmployeeRuntime[],
  businessId?: string,
): Money {
  return employees
    .filter(
      (employee) =>
        businessId === undefined ||
        employee.businessId === businessId,
    )
    .reduce(
      (total, employee) =>
        moneyAdd(total, employee.monthlySalary),
      ZERO_MONEY,
    );
}

export interface EmployeeMonthResult {
  employees: EmployeeRuntime[];
  resigned: EmployeeRuntime[];
  payroll: Money;
}

/**
 * Выполняется раз в игровой месяц.
 * Сотрудник может уйти по завершении срока или случайно.
 */
export function advanceEmployeesMonth(
  employees: EmployeeRuntime[],
  random: () => number = Math.random,
  monthlyResignationChance = 0.005,
): EmployeeMonthResult {
  const nextEmployees: EmployeeRuntime[] = [];
  const resigned: EmployeeRuntime[] = [];
  let payroll: Money = ZERO_MONEY;

  for (const employee of employees) {
    const nextMonthsRemaining = employee.monthsRemaining - 1;
    const randomResignation =
      random() < monthlyResignationChance;

    if (nextMonthsRemaining <= 0 || randomResignation) {
      resigned.push(employee);
      continue;
    }

    const nextEmployee: EmployeeRuntime = {
      ...employee,
      monthsEmployed: employee.monthsEmployed + 1,
      monthsRemaining: nextMonthsRemaining,
    };

    nextEmployees.push(nextEmployee);
    payroll = moneyAdd(payroll, employee.monthlySalary);
  }

  return {
    employees: nextEmployees,
    resigned,
    payroll,
  };
}

export function getEmployeeEfficiency(
  employees: EmployeeRuntime[],
  businessId: string,
): number {
  const businessEmployees = employees.filter(
    (employee) => employee.businessId === businessId,
  );

  const manager = businessEmployees.find(
    (employee) => employee.role === 'manager',
  );

  if (!manager) {
    return 1;
  }

  const normalizedQualification = Math.max(
    0,
    Math.min(100, manager.qualification),
  );

  return 1 + (normalizedQualification / 100) * 0.2;
}

export function canAffordMonthlyPayroll(
  businessCash: Money,
  monthlyPayroll: Money,
): boolean {
  return moneyCmp(businessCash, monthlyPayroll) >= 0;
}