export type DashboardProfile = 'business' | 'household';

export type FlowCategory = 'operating' | 'investing' | 'financing' | 'internal';

export interface MetricCard {
  label: string;
  value: number | null;
  note: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface StatementRow {
  label: string;
  amount: number;
  account?: string;
  share?: number;
}

export interface StatementSection {
  title: string;
  rows: StatementRow[];
  total: number;
}

export interface StatementSummary {
  title: string;
  sections: StatementSection[];
  totalLabel: string;
  total: number;
  comparisonLabel?: string;
  comparisonValue?: number;
}

export interface FlowTotals {
  operating: number;
  investing: number;
  financing: number;
  net: number;
}

export interface MonthlyPoint extends FlowTotals {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  cashBalance: number;
  netWorth: number;
  savingsRate: number | null;
}

export interface BreakdownBlock {
  title: string;
  subtitle: string;
  rows: StatementRow[];
}

export interface TransactionSummary {
  id: string;
  date: string;
  payee: string;
  narration: string;
  amount: number;
  category: FlowCategory;
  note: string;
  accounts: string[];
  flagged: boolean;
}

export interface DashboardMeta {
  title: string;
  currency: string;
  ledgerPath: string;
  profile: DashboardProfile;
  latestDate: string;
  generatedAt: string;
  periodLabel: string;
  latestMonthLabel: string;
  reviewThreshold: {
    enabled: boolean;
    amount: number;
    currency: string;
    comparable: boolean;
    source: 'ledger-local' | 'global' | 'default';
  };
}

export interface DashboardData {
  meta: DashboardMeta;
  metrics: MetricCard[];
  highlights: string[];
  monthly: MonthlyPoint[];
  incomeStatement: StatementSummary;
  balanceSheet: StatementSummary;
  cashFlow: StatementSummary;
  mixes: {
    primary: BreakdownBlock;
    secondary: BreakdownBlock;
    assets: BreakdownBlock;
    liabilities: BreakdownBlock;
  };
  recentTransactions: TransactionSummary[];
  flaggedTransactions: TransactionSummary[];
}
