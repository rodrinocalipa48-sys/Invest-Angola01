import type { InvestmentPlan } from './types';

export const ADMIN_PHONE = '952758732';
export const DEPOSIT_ENTITY = '10116';
export const DEPOSIT_REFERENCE = '952758732';
export const WHATSAPP_SUPPORT_URL = 'https://chat.whatsapp.com/F1sDGVJcQVaLWF7a3yBCtH?mode=wwt';
export const WITHDRAWAL_FEE_PERCENTAGE = 0.20; // 20%
export const REFERRAL_WITHDRAWAL_DISCOUNT = 0.05; // 5%
export const MINIMUM_WITHDRAWAL_AMOUNT = 2000; // 2000 Kz

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 1,
    name: 'Plano Iniciante',
    amount: 5000,
    dailyReturn: 500,
    durationDays: 30,
    totalReturn: 15000,
  },
  {
    id: 2,
    name: 'Plano Bronze',
    amount: 10000,
    dailyReturn: 1000,
    durationDays: 30,
    totalReturn: 30000,
  },
  {
    id: 3,
    name: 'Plano Prata',
    amount: 25000,
    dailyReturn: 2500,
    durationDays: 30,
    totalReturn: 75000,
  },
  {
    id: 4,
    name: 'Plano Ouro',
    amount: 50000,
    dailyReturn: 5000,
    durationDays: 30,
    totalReturn: 150000,
  },
  {
    id: 5,
    name: 'Plano Platina',
    amount: 75000,
    dailyReturn: 7500,
    durationDays: 30,
    totalReturn: 225000,
  },
  {
    id: 6,
    name: 'Plano Diamante',
    amount: 100000,
    dailyReturn: 10000,
    durationDays: 30,
    totalReturn: 300000,
    isPopular: true,
  },
];
