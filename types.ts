
export interface User {
  phone: string;
  passwordHash: string;
  balance: number;
  investments: UserInvestment[];
  referralCode: string;
  referredBy?: string;
  referredUsers: string[];
}

export interface UserInvestment {
  planId: number;
  startDate: string; // ISO string
  amount: number;
}

export interface InvestmentPlan {
  id: number;
  name: string;
  amount: number;
  dailyReturn: number;
  durationDays: number;
  totalReturn: number;
  isPopular?: boolean;
}

export enum TransactionStatus {
  Pending = 'Pendente',
  Approved = 'Aprovado',
  Rejected = 'Rejeitado',
}

export enum TransactionType {
  Deposit = 'Depósito',
  Withdrawal = 'Saque',
  Investment = 'Investimento',
  Earning = 'Rendimento',
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  date: string; // ISO string
  details: Record<string, any>;
}

export interface AIReceiptAnalysis {
  isValid: boolean;
  reason: string;
  extractedData: {
    amount: number | null;
    currency: string | null;
    reference: string | null;
    entity: string | null;
    transactionId: string | null;
    date: string | null;
  };
  confidenceScore: number;
  isPotentiallyForged: boolean;
  rejectionReason: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'error';
  read: boolean;
  date: string; // ISO string
}
