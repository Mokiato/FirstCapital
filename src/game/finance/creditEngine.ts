import type { LoanRuntime, Money } from '../domain/types';
import { moneyAdd, moneyCmp, moneyMax, moneyMin, moneyMul, moneySub, ZERO_MONEY } from '../domain/money';

export function monthlyRateForCreditScore(creditScore: number): number {
  if (creditScore < 300) return 0.03;
  if (creditScore <= 700) return 0.02;
  return 0.01;
}

export function estimateMonthlyPayment(principal: Money, monthlyRate: number, termMonths: number): Money {
  if (termMonths <= 0) return ZERO_MONEY;
  if (monthlyRate <= 0) return moneyMul(principal, 1 / termMonths);
  const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);
  if (denominator <= 0) return ZERO_MONEY;
  return moneyMul(principal, monthlyRate / denominator);
}

export function calculateCreditLimit(cleanMonthlyProfit: Money, ratingCoefficient: number): Money {
  return moneyMax(ZERO_MONEY, moneyMul(cleanMonthlyProfit, ratingCoefficient));
}

export interface CreateLoanInput {
  amount: Money;
  monthlyProfit: Money;
  creditScore: number;
  ratingCoefficient: number;
  termMonths: number;
  currentMonth: number;
  existingLoan?: LoanRuntime | null;
}

export function createLoan(input: CreateLoanInput): { ok: true; loan: LoanRuntime } | { ok: false; reason: string } {
  if (input.existingLoan?.status === 'active') return { ok: false, reason: 'Нельзя иметь несколько активных кредитов.' };
  if (![3, 6, 12].includes(input.termMonths)) return { ok: false, reason: 'Доступны сроки 3, 6 или 12 месяцев.' };
  const limit = calculateCreditLimit(input.monthlyProfit, input.ratingCoefficient);
  if (moneyCmp(input.amount, ZERO_MONEY) <= 0) return { ok: false, reason: 'Сумма кредита должна быть больше нуля.' };
  if (moneyCmp(input.amount, limit) > 0) return { ok: false, reason: 'Запрошенная сумма выше кредитного лимита.' };
  const monthlyRate = monthlyRateForCreditScore(input.creditScore);
  return { ok: true, loan: {
    id: `loan-${input.currentMonth}-${Date.now()}`,
    originalPrincipal: input.amount, balance: input.amount, arrears: ZERO_MONEY,
    monthlyRate, monthlyPayment: estimateMonthlyPayment(input.amount, monthlyRate, input.termMonths),
    termMonths: input.termMonths, monthsRemaining: input.termMonths,
    overdueMonths: 0, issuedAtMonth: input.currentMonth, status: 'active',
  }};
}

export type LoanBankAction = 'none' | 'block_new_loans' | 'seize_business' | 'bankruptcy' | 'loan_paid';

export interface LoanMonthResult {
  loan: LoanRuntime; availableIncomeAfterPayment: Money;
  payment: Money; interest: Money; penalty: Money;
  creditScore: number; action: LoanBankAction;
}

function clampCreditScore(score: number): number { return Math.max(0, Math.min(1000, Math.round(score))); }

export function settleLoanMonth(loan: LoanRuntime, availableIncome: Money, creditScore: number): LoanMonthResult {
  if (loan.status !== 'active') return { loan, availableIncomeAfterPayment: availableIncome, payment: ZERO_MONEY, interest: ZERO_MONEY, penalty: ZERO_MONEY, creditScore, action: 'none' };
  const interest = moneyMul(loan.balance, loan.monthlyRate);
  const balanceWithInterest = moneyAdd(loan.balance, interest);
  const available = moneyMax(availableIncome, ZERO_MONEY);
  const payment = moneyMin(available, loan.monthlyPayment);
  const unpaid = moneySub(loan.monthlyPayment, payment);
  let nextBalance = moneyMax(ZERO_MONEY, moneySub(balanceWithInterest, payment));
  let nextArrears = loan.arrears; let nextOverdueMonths = loan.overdueMonths;
  let nextScore = creditScore; let penalty: Money = ZERO_MONEY; let action: LoanBankAction = 'none';
  if (moneyCmp(unpaid, ZERO_MONEY) > 0) {
    nextOverdueMonths += 1; nextArrears = moneyAdd(nextArrears, unpaid);
    if (nextOverdueMonths === 1) { penalty = moneyMul(nextBalance, 0.1); nextBalance = moneyAdd(nextBalance, penalty); nextScore -= 150; action = 'block_new_loans'; }
    else if (nextOverdueMonths === 2) { action = 'seize_business'; }
    else if (nextOverdueMonths >= 3) { action = 'bankruptcy'; }
  } else { nextOverdueMonths = 0; nextArrears = ZERO_MONEY; nextScore += 50; }
  const isPaid = moneyCmp(nextBalance, ZERO_MONEY) <= 0;
  let nextLoan: LoanRuntime = { ...loan, balance: nextBalance, arrears: nextArrears, overdueMonths: nextOverdueMonths, monthsRemaining: Math.max(0, loan.monthsRemaining - 1), status: isPaid ? 'paid' : 'active' };
  if (isPaid) { nextScore += 100; action = 'loan_paid'; }
  if (action === 'bankruptcy') { nextLoan = { ...nextLoan, status: 'defaulted' }; nextScore = 0; }
  return { loan: nextLoan, availableIncomeAfterPayment: moneySub(available, payment), payment, interest, penalty, creditScore: clampCreditScore(nextScore), action };
}

export function repayLoanEarly(loan: LoanRuntime, cash: Money, creditScore: number): { loan: LoanRuntime; cash: Money; creditScore: number; paid: Money; completed: boolean } {
  if (loan.status !== 'active') return { loan, cash, creditScore, paid: ZERO_MONEY, completed: false };
  const totalDebt = moneyAdd(loan.balance, loan.arrears);
  const paid = moneyMin(cash, totalDebt);
  const completed = moneyCmp(moneySub(totalDebt, paid), ZERO_MONEY) <= 0;
  return {
    loan: { ...loan, balance: completed ? ZERO_MONEY : moneySub(totalDebt, paid), arrears: ZERO_MONEY, status: completed ? 'paid' : 'active', overdueMonths: completed ? 0 : loan.overdueMonths },
    cash: moneySub(cash, paid), creditScore: clampCreditScore(creditScore + 75 + (completed ? 100 : 0)), paid, completed,
  };
}

export function monthlyCreditScoreGrowth(input: { score: number; companyLevel: number; companyAgeMonths: number; debtFree: boolean; positiveAssets: boolean }): number {
  let increase = 0;
  if (input.debtFree && input.positiveAssets) increase += 50;
  if (input.companyLevel >= 61) increase += 100; else if (input.companyLevel >= 31) increase += 60; else if (input.companyLevel >= 11) increase += 30; else if (input.companyLevel >= 1) increase += 10;
  if (input.companyAgeMonths > 0 && input.companyAgeMonths % 12 === 0) increase += 20;
  return clampCreditScore(input.score + increase);
}

export function addMoneyToBalance(balance: Money, amount: Money): Money { return moneyAdd(balance, amount); }
