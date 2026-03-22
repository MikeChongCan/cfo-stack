import path from 'node:path';
import os from 'node:os';
import {parse as parseCsv} from 'csv-parse/sync';
import {parse as parseYaml} from 'yaml';
import type {
  BreakdownBlock,
  DashboardData,
  DashboardProfile,
  FlowCategory,
  FlowTotals,
  MetricCard,
  MonthlyPoint,
  StatementRow,
  StatementSection,
  StatementSummary,
  TransactionSummary,
} from './types';

interface ExtractOptions {
  ledgerPath?: string;
  cwd: string;
  forcedProfile?: DashboardProfile;
}

interface CsvRecord {
  [key: string]: string;
}

interface BalanceRow {
  account: string;
  amount: number;
  currency: string;
}

interface MonthlyRow extends BalanceRow {
  year: number;
  month: number;
}

interface PostingRow {
  date: string;
  filename: string;
  lineno: number;
  payee: string;
  narration: string;
  account: string;
  amount: number;
  currency: string;
}

interface GroupedTransaction {
  id: string;
  date: string;
  filename: string;
  lineno: number;
  payee: string;
  narration: string;
  postings: PostingRow[];
}

interface AmountParts {
  amount: number;
  currency: string;
}

interface ReviewThreshold {
  enabled: boolean;
  amount: number;
  currency: string;
  comparable: boolean;
  source: 'ledger-local' | 'global' | 'default';
}

interface PolicyConfig {
  review_policy?: {
    large_transaction_human_confirmation?: {
      enabled?: boolean;
      amount?: number;
      currency_mode?: 'ledger_operating_currency' | 'explicit';
      currency?: string;
    };
  };
}

const EPSILON = 0.005;
const REPO_MARKERS = ['.git', 'AGENTS.md'];
const CASH_ACCOUNT_PREFIXES = ['Assets:Bank', 'Assets:Cash', 'Assets:Wallet'];
const BUSINESS_SIGNALS = [
  'Assets:Receivable',
  'Liabilities:GST',
  'Equity:Retained-Earnings',
  'Income:Consulting',
  'Income:SaaS',
  'Expenses:Professional',
  'Expenses:Marketing',
];
const HOUSEHOLD_SIGNALS = [
  'Income:Salary',
  'Assets:Retirement',
  'Assets:Education',
  'Assets:Property:Home',
  'Liabilities:Mortgage',
  'Expenses:Childcare',
];

export async function extractDashboardData(options: ExtractOptions): Promise<DashboardData> {
  const ledgerPath = await resolveLedgerPath(options);
  const [{title, currency}, balanceRows, monthlyRows, postingRows] = await Promise.all([
    readLedgerOptions(ledgerPath),
    loadBalanceRows(ledgerPath),
    loadMonthlyRows(ledgerPath),
    loadPostingRows(ledgerPath),
  ]);
  const reviewThreshold = await readReviewThreshold(ledgerPath, currency);

  const profile = options.forcedProfile ?? inferProfile(balanceRows.map((row) => row.account));
  const groupedTransactions = groupTransactions(postingRows);
  const activityMonths = buildActivityMonths(groupedTransactions);
  const latestDate = postingRows.at(-1)?.date ?? new Date().toISOString().slice(0, 10);
  const latestYear = Number(latestDate.slice(0, 4));
  const latestMonthKey = latestDate.slice(0, 7);
  const currentYearRows = monthlyRows.filter((row) => row.year === latestYear);
  const finalBalances = new Map(balanceRows.map((row) => [row.account, row.amount]));
  const visibleMonthKeys = selectVisibleMonths(activityMonths, latestMonthKey);
  const flowMap = buildFlowMap(groupedTransactions, profile);
  const monthlySeries = buildMonthlySeries({
    monthlyRows,
    visibleMonthKeys,
    flowMap,
    profile,
  });

  const incomeStatement = buildIncomeStatement(currentYearRows, profile);
  const balanceSheet = buildBalanceSheet(finalBalances, incomeStatement.total, profile);
  const cashFlow = buildCashFlowStatement(flowMap, latestYear, latestMonthKey);
  const mixes = buildMixes({finalBalances, currentYearRows, profile});
  const metrics = buildMetrics({
    balanceSheet,
    cashFlow,
    incomeStatement,
    monthlySeries,
    profile,
  });
  const transactionSummaries = buildTransactionSummaries(groupedTransactions, profile, reviewThreshold);
  const recentTransactions = transactionSummaries.slice(0, 8);
  const flaggedTransactions = transactionSummaries.filter((transaction) => transaction.flagged).slice(0, 8);

  return {
    meta: {
      title,
      currency,
      ledgerPath,
      profile,
      latestDate,
      generatedAt: new Date().toISOString(),
      periodLabel: `YTD ${latestYear} through ${latestDate}`,
      latestMonthLabel: monthLabel(latestMonthKey),
      reviewThreshold,
    },
    metrics,
    highlights: buildHighlights({
      balanceSheet,
      cashFlow,
      currency,
      incomeStatement,
      mixes,
      monthlySeries,
      profile,
    }),
    monthly: monthlySeries,
    incomeStatement,
    balanceSheet,
    cashFlow,
    mixes,
    recentTransactions,
    flaggedTransactions,
  };
}

export async function discoverSampleLedgers(repoRoot: string): Promise<string[]> {
  const glob = new Bun.Glob('examples/*/main.beancount');
  const ledgers: string[] = [];
  for await (const match of glob.scan({cwd: repoRoot, absolute: true, onlyFiles: true})) {
    ledgers.push(path.resolve(match));
  }
  return ledgers.sort();
}

function buildMetrics({
  balanceSheet,
  cashFlow,
  incomeStatement,
  monthlySeries,
  profile,
}: {
  balanceSheet: StatementSummary;
  cashFlow: StatementSummary;
  incomeStatement: StatementSummary;
  monthlySeries: MonthlyPoint[];
  profile: DashboardProfile;
}): MetricCard[] {
  const latest = monthlySeries.at(-1);
  if (!latest) {
    return [];
  }

  if (profile === 'business') {
    const receivables = sumSection(balanceSheet.sections.find((section) => section.title === 'Assets')?.rows ?? [], 'Receivable');
    const liabilities = balanceSheet.sections.find((section) => section.title === 'Liabilities')?.total ?? 0;
    return [
      {
        label: 'Ending cash',
        value: latest.cashBalance,
        note: `As of ${latest.label}`,
        tone: latest.cashBalance >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'Latest month net income',
        value: latest.netIncome,
        note: `${latest.label}`,
        tone: latest.netIncome >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'YTD net income',
        value: incomeStatement.total,
        note: incomeStatement.title,
        tone: incomeStatement.total >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'Working capital load',
        value: receivables + liabilities,
        note: 'Receivables plus liabilities requiring follow-through',
        tone: 'neutral',
      },
    ];
  }

  const liquidAssets = sumSection(balanceSheet.sections.find((section) => section.title === 'Assets')?.rows ?? [], 'Bank');
  return [
    {
      label: 'Net worth',
      value: balanceSheet.total,
      note: `As of ${latest.label}`,
      tone: balanceSheet.total >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Liquid cash',
      value: liquidAssets,
      note: 'Cash and bank balances',
      tone: liquidAssets >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Latest month surplus',
      value: latest.netIncome,
      note: `${latest.label}`,
      tone: latest.netIncome >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Savings rate',
      value: latest.savingsRate,
      note: `${latest.label}`,
      tone:
        latest.savingsRate === null
          ? 'neutral'
          : latest.savingsRate >= 0
            ? 'positive'
            : 'negative',
    },
  ];
}

function buildHighlights({
  balanceSheet,
  cashFlow,
  currency,
  incomeStatement,
  mixes,
  monthlySeries,
  profile,
}: {
  balanceSheet: StatementSummary;
  cashFlow: StatementSummary;
  currency: string;
  incomeStatement: StatementSummary;
  mixes: DashboardData['mixes'];
  monthlySeries: MonthlyPoint[];
  profile: DashboardProfile;
}): string[] {
  const latest = monthlySeries.at(-1);
  const primary = mixes.primary.rows[0];
  const secondary = mixes.secondary.rows[0];
  if (!latest) {
    return [];
  }

  if (profile === 'business') {
    return [
      `${primary?.label ?? 'Top line'} drives ${formatPercent(primary?.share ?? 0)} of YTD revenue, keeping concentration visible.`,
      `Latest month operating cash flow is ${formatSigned(latest.operating, currency)} and ending cash stands at ${formatSigned(latest.cashBalance, currency)}.`,
      `${secondary?.label ?? 'Largest expense bucket'} is the heaviest cost center so far, while YTD net income is ${formatSigned(incomeStatement.total, currency)}.`,
    ];
  }

  return [
    `Net worth currently sits at ${formatSigned(balanceSheet.total, currency)} with liquid cash of ${formatSigned(sumSection(mixes.assets.rows, 'Bank'), currency)}.`,
    `${secondary?.label ?? 'Largest spending bucket'} is the biggest household outflow, while the latest monthly surplus is ${formatSigned(latest.netIncome, currency)}.`,
    `Direct cash flow for ${latest.label} was ${formatSigned(cashFlow.sections[0]?.total ?? latest.net, currency)} after operating, investing, and financing moves.`,
  ];
}

function buildIncomeStatement(monthlyRows: MonthlyRow[], profile: DashboardProfile): StatementSummary {
  const incomeRows = toStatementRows(filterRowsByPrefix(monthlyRows, 'Income'), -1);
  const expenseRows = toStatementRows(filterRowsByPrefix(monthlyRows, 'Expenses'), 1);
  const revenueTotal = totalRows(incomeRows);
  const expenseTotal = totalRows(expenseRows);
  const net = revenueTotal - expenseTotal;
  const title = profile === 'business' ? 'Income Statement' : 'Household Cash Margin';

  return {
    title,
    sections: [
      {
        title: profile === 'business' ? 'Revenue' : 'Income',
        rows: withShares(sortRowsDesc(incomeRows), revenueTotal),
        total: revenueTotal,
      },
      {
        title: profile === 'business' ? 'Operating expenses' : 'Spending',
        rows: withShares(sortRowsDesc(expenseRows), expenseTotal),
        total: expenseTotal,
      },
    ],
    totalLabel: profile === 'business' ? 'Net income' : 'Surplus after spending',
    total: net,
    comparisonLabel: 'Latest month',
    comparisonValue: 0,
  };
}

function buildBalanceSheet(
  finalBalances: Map<string, number>,
  currentEarnings: number,
  profile: DashboardProfile,
): StatementSummary {
  const assetRows = mapBalancesToRows(finalBalances, 'Assets', 1);
  const liabilityRows = mapBalancesToRows(finalBalances, 'Liabilities', -1);

  const allTimeRevenue = sumMapByPrefix(finalBalances, 'Income') * -1;
  const allTimeExpenses = sumMapByPrefix(finalBalances, 'Expenses');
  const allTimeNetIncome = allTimeRevenue - allTimeExpenses;
  const priorEarnings = allTimeNetIncome - currentEarnings;

  const dynamicEquity = [];
  if (Math.abs(priorEarnings) > EPSILON) {
    dynamicEquity.push({label: 'Prior year earnings', amount: priorEarnings, account: 'Equity:Retained-Earnings-Unclosed'});
  }
  if (Math.abs(currentEarnings) > EPSILON) {
    dynamicEquity.push({label: 'Current year earnings', amount: currentEarnings, account: 'Equity:Current-Year-Earnings'});
  }

  const equityRows =
    profile === 'business'
      ? mapBalancesToRows(finalBalances, 'Equity', -1).concat(dynamicEquity)
      : [];

  const assetsTotal = totalRows(assetRows);
  const liabilitiesTotal = totalRows(liabilityRows);
  const equityTotal = totalRows(equityRows);
  const netWorth = assetsTotal - liabilitiesTotal;

  return {
    title: profile === 'business' ? 'Balance Sheet' : 'Net Worth Statement',
    sections: profile === 'business'
      ? [
          {title: 'Assets', rows: withShares(sortRowsDesc(assetRows), assetsTotal), total: assetsTotal},
          {title: 'Liabilities', rows: withShares(sortRowsDesc(liabilityRows), liabilitiesTotal), total: liabilitiesTotal},
          {title: 'Equity', rows: withShares(sortRowsDesc(equityRows), equityTotal), total: equityTotal},
        ]
      : [
          {title: 'Assets', rows: withShares(sortRowsDesc(assetRows), assetsTotal), total: assetsTotal},
          {title: 'Liabilities', rows: withShares(sortRowsDesc(liabilityRows), liabilitiesTotal), total: liabilitiesTotal},
        ],
    totalLabel: profile === 'business' ? 'Liabilities + equity' : 'Net worth',
    total: profile === 'business' ? liabilitiesTotal + equityTotal : netWorth,
    comparisonLabel: profile === 'business' ? 'Assets' : 'Assets',
    comparisonValue: assetsTotal,
  };
}

function buildCashFlowStatement(flowMap: Map<string, FlowTotals>, latestYear: number, latestMonthKey: string): StatementSummary {
  let operating = 0;
  let investing = 0;
  let financing = 0;
  let net = 0;

  for (const [monthKey, flow] of flowMap.entries()) {
    if (monthKey.startsWith(`${latestYear}-`)) {
      operating += flow.operating;
      investing += flow.investing;
      financing += flow.financing;
      net += flow.net;
    }
  }

  return {
    title: 'Direct Cash Flow',
    sections: [
      {
        title: 'YTD Movement',
        rows: [
          {label: 'Operating', amount: operating},
          {label: 'Investing', amount: investing},
          {label: 'Financing', amount: financing},
        ],
        total: net,
      },
    ],
    totalLabel: 'YTD net cash change',
    total: net,
    comparisonLabel: 'Latest month',
    comparisonValue: flowMap.get(latestMonthKey)?.net ?? 0,
  };
}

function buildMixes({
  finalBalances,
  currentYearRows,
  profile,
}: {
  finalBalances: Map<string, number>;
  currentYearRows: MonthlyRow[];
  profile: DashboardProfile;
}): DashboardData['mixes'] {
  const primaryRows = withShares(
    sortRowsDesc(
      toStatementRows(filterRowsByPrefix(currentYearRows, 'Income'), -1),
    ),
    Math.abs(
      totalRows(
        toStatementRows(filterRowsByPrefix(currentYearRows, 'Income'), -1),
      ),
    ),
  );
  const secondaryRows = withShares(
    sortRowsDesc(
      toStatementRows(filterRowsByPrefix(currentYearRows, 'Expenses'), 1),
    ),
    totalRows(
      toStatementRows(filterRowsByPrefix(currentYearRows, 'Expenses'), 1),
    ),
  );

  const assetsRows = withShares(sortRowsDesc(mapBalancesToRows(finalBalances, 'Assets', 1)), sumRows(mapBalancesToRows(finalBalances, 'Assets', 1)));
  const liabilitiesRows = withShares(sortRowsDesc(mapBalancesToRows(finalBalances, 'Liabilities', -1)), sumRows(mapBalancesToRows(finalBalances, 'Liabilities', -1)));

  return {
    primary: {
      title: profile === 'business' ? 'Revenue mix' : 'Income mix',
      subtitle: profile === 'business' ? 'YTD concentration by income source' : 'YTD household income sources',
      rows: primaryRows.slice(0, 6),
    },
    secondary: {
      title: profile === 'business' ? 'Expense mix' : 'Spending mix',
      subtitle: profile === 'business' ? 'YTD operating cost structure' : 'YTD household spending categories',
      rows: secondaryRows.slice(0, 8),
    },
    assets: {
      title: profile === 'business' ? 'Asset base' : 'Asset composition',
      subtitle: profile === 'business' ? 'Ending balance sheet assets' : 'Ending household assets',
      rows: assetsRows.slice(0, 8),
    },
    liabilities: {
      title: profile === 'business' ? 'Liability load' : 'Liability composition',
      subtitle: profile === 'business' ? 'Balances requiring follow-through' : 'Ending household liabilities',
      rows: liabilitiesRows.slice(0, 8),
    },
  };
}

function buildMonthlySeries({
  monthlyRows,
  visibleMonthKeys,
  flowMap,
  profile,
}: {
  monthlyRows: MonthlyRow[];
  visibleMonthKeys: string[];
  flowMap: Map<string, FlowTotals>;
  profile: DashboardProfile;
}): MonthlyPoint[] {
  const monthMap = new Map<string, Map<string, number>>();
  for (const row of monthlyRows) {
    const monthKey = toMonthKey(row.year, row.month);
    const accountMap = monthMap.get(monthKey) ?? new Map<string, number>();
    accountMap.set(row.account, (accountMap.get(row.account) ?? 0) + row.amount);
    monthMap.set(monthKey, accountMap);
  }

  const orderedKeys = Array.from(monthMap.keys()).sort();
  const runningBalances = new Map<string, number>();
  const snapshots = new Map<string, MonthlyPoint>();

  for (const monthKey of orderedKeys) {
    const accountMap = monthMap.get(monthKey);
    if (!accountMap) {
      continue;
    }
    for (const [account, amount] of accountMap) {
      runningBalances.set(account, (runningBalances.get(account) ?? 0) + amount);
    }

    const revenue = sumByPrefix(accountMap, 'Income', -1);
    const expenses = sumByPrefix(accountMap, 'Expenses', 1);
    const netIncome = revenue - expenses;
    const cashBalance = sumMapByPredicate(runningBalances, isCashAccount);
    const assetsTotal = sumMapByPrefix(runningBalances, 'Assets');
    const liabilitiesSigned = sumMapByPrefix(runningBalances, 'Liabilities');
    const netWorth = assetsTotal + liabilitiesSigned;
    const savingsRate = revenue > EPSILON ? netIncome / revenue : null;
    const flow = flowMap.get(monthKey) ?? {operating: 0, investing: 0, financing: 0, net: 0};

    snapshots.set(monthKey, {
      key: monthKey,
      label: monthLabel(monthKey),
      revenue,
      expenses,
      netIncome,
      cashBalance,
      netWorth,
      savingsRate: profile === 'household' ? savingsRate : null,
      ...flow,
    });
  }

  return visibleMonthKeys
    .map((key) => snapshots.get(key))
    .filter((point): point is MonthlyPoint => Boolean(point));
}

function buildFlowMap(
  transactions: GroupedTransaction[],
  profile: DashboardProfile,
): Map<string, FlowTotals> {
  const map = new Map<string, FlowTotals>();
  const clearingBuckets = new Map<string, Map<FlowCategory, number>>();
  for (const transaction of transactions) {
    const cashPostings = transaction.postings.filter((posting) => isCashAccount(posting.account));
    const nonCashPostings = transaction.postings.filter((posting) => !isCashAccount(posting.account));

    for (const posting of nonCashPostings) {
      if (!isTrackedClearingAccount(posting.account) || !isExposureIncrease(posting)) {
        continue;
      }
      const categories = categorizePostings(
        nonCashPostings.filter((candidate) => candidate.account !== posting.account),
        profile,
      );
      if (categories.size === 0) {
        continue;
      }
      addToBuckets(clearingBuckets, posting.account, categories, Math.abs(posting.amount));
    }

    if (cashPostings.length === 0) {
      continue;
    }
    if (nonCashPostings.length === 0) {
      continue;
    }

    const weightedCategories = new Map<FlowCategory, number>();
    for (const posting of nonCashPostings) {
      if (isTrackedClearingAccount(posting.account) && isExposureReduction(posting)) {
        const bucket = clearingBuckets.get(posting.account);
        if (bucket) {
          const allocation = consumeFromBuckets(bucket, Math.abs(posting.amount));
          for (const [category, amount] of allocation) {
            weightedCategories.set(category, (weightedCategories.get(category) ?? 0) + amount);
          }
        }
        continue;
      }
      const category = classifyAccount(posting.account, profile);
      if (category === 'internal') {
        continue;
      }
      weightedCategories.set(category, (weightedCategories.get(category) ?? 0) + Math.abs(posting.amount));
    }

    const totalWeight = Array.from(weightedCategories.values()).reduce((total, value) => total + value, 0);
    if (totalWeight <= EPSILON) {
      continue;
    }

    const monthKey = transaction.date.slice(0, 7);
    const totals = map.get(monthKey) ?? {operating: 0, investing: 0, financing: 0, net: 0};
    const cashNet = cashPostings.reduce((sum, posting) => sum + posting.amount, 0);
    for (const [category, weight] of weightedCategories) {
      if (category !== 'internal') {
        totals[category] += cashNet * (weight / totalWeight);
      }
    }
    totals.net += cashNet;
    map.set(monthKey, totals);
  }
  return map;
}

function buildTransactionSummaries(
  transactions: GroupedTransaction[],
  profile: DashboardProfile,
  reviewThreshold: ReviewThreshold,
): TransactionSummary[] {
  return transactions
    .map((transaction) => {
      const category = dominantFlowCategory(
        transaction.postings
          .filter((posting) => !isCashAccount(posting.account))
          .map((posting) => ({account: posting.account, amount: posting.amount})),
        profile,
      );
      const primaryAmount = transaction.postings.reduce((max, posting) => {
        const absolute = Math.abs(posting.amount);
        return absolute > Math.abs(max) ? posting.amount : max;
      }, 0);
      const accounts = transaction.postings.map((posting) => posting.account);
      return {
        id: transaction.id,
        date: transaction.date,
        payee: transaction.payee || 'Unspecified',
        narration: transaction.narration,
        amount: primaryAmount,
        category,
        note: buildTransactionNote(accounts, category),
        accounts,
        flagged:
          reviewThreshold.enabled &&
          reviewThreshold.comparable &&
          Math.abs(primaryAmount) >= reviewThreshold.amount,
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
}

function buildTransactionNote(accounts: string[], category: FlowCategory): string {
  const external = accounts.filter((account) => !account.startsWith('Equity:'));
  const sample = external
    .slice(0, 3)
    .map(shortLabel)
    .join(' · ');
  const prefix = category === 'internal' ? 'Internal movement' : `${capitalize(category)} flow`;
  return sample ? `${prefix}: ${sample}` : prefix;
}

function groupTransactions(postings: PostingRow[]): GroupedTransaction[] {
  const map = new Map<string, GroupedTransaction>();
  for (const posting of postings) {
    const id = `${posting.date}:${posting.filename}:${posting.lineno}`;
    const existing = map.get(id) ?? {
      id,
      date: posting.date,
      filename: posting.filename,
      lineno: posting.lineno,
      payee: posting.payee,
      narration: posting.narration,
      postings: [],
    };
    existing.postings.push(posting);
    map.set(id, existing);
  }
  return Array.from(map.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function buildActivityMonths(transactions: GroupedTransaction[]): string[] {
  const keys = new Set<string>();
  for (const transaction of transactions) {
    if (isOpeningTransaction(transaction)) {
      continue;
    }
    keys.add(transaction.date.slice(0, 7));
  }
  return Array.from(keys).sort();
}

function selectVisibleMonths(activityMonths: string[], fallbackMonth: string): string[] {
  if (activityMonths.length === 0) {
    return [fallbackMonth];
  }
  return activityMonths.slice(-6);
}

async function resolveLedgerPath(options: ExtractOptions): Promise<string> {
  if (options.ledgerPath) {
    return path.resolve(options.cwd, options.ledgerPath);
  }

  const start = path.resolve(options.cwd);
  const directCandidates = [path.join(start, 'main.beancount'), path.join(start, 'ledger', 'main.beancount')];
  for (const candidate of directCandidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  const glob = new Bun.Glob('**/main.beancount');
  for await (const match of glob.scan({cwd: start, absolute: true, onlyFiles: true})) {
    return path.resolve(match);
  }

  throw new Error('No main.beancount file found. Pass one explicitly with --ledger.');
}

async function readLedgerOptions(ledgerPath: string): Promise<{title: string; currency: string}> {
  const contents = await Bun.file(ledgerPath).text();
  const title = contents.match(/option\s+"title"\s+"([^"]+)"/)?.[1] ?? path.basename(path.dirname(ledgerPath));
  const currency = contents.match(/option\s+"operating_currency"\s+"([^"]+)"/)?.[1] ?? 'USD';
  return {title, currency};
}

async function readReviewThreshold(ledgerPath: string, ledgerCurrency: string): Promise<ReviewThreshold> {
  const ledgerConfigPath = path.join(path.dirname(ledgerPath), 'cfo-stack.yaml');
  const globalConfigPath = path.join(os.homedir(), '.cfo-stack', 'config.yaml');
  const configCandidates: Array<{path: string; source: ReviewThreshold['source']}> = [
    {path: ledgerConfigPath, source: 'ledger-local'},
    {path: globalConfigPath, source: 'global'},
  ];

  for (const candidate of configCandidates) {
    if (!(await fileExists(candidate.path))) {
      continue;
    }
    const threshold = await parseReviewThresholdConfig(candidate.path, ledgerCurrency, candidate.source);
    if (threshold) {
      return threshold;
    }
  }

  return {
    enabled: true,
    amount: 1000,
    currency: ledgerCurrency,
    comparable: true,
    source: 'default',
  };
}

async function parseReviewThresholdConfig(
  configPath: string,
  ledgerCurrency: string,
  source: ReviewThreshold['source'],
): Promise<ReviewThreshold | null> {
  const contents = await Bun.file(configPath).text();
  const parsed = parseYaml(contents) as PolicyConfig | null;
  const policy = parsed?.review_policy?.large_transaction_human_confirmation;
  if (!policy || typeof policy.amount !== 'number') {
    return null;
  }

  const currency =
    policy.currency_mode === 'explicit'
      ? policy.currency ?? ledgerCurrency
      : ledgerCurrency;

  return {
    enabled: policy.enabled !== false,
    amount: policy.amount,
    currency,
    comparable: currency === ledgerCurrency,
    source,
  };
}

async function loadBalanceRows(ledgerPath: string): Promise<BalanceRow[]> {
  const rows = await runBeanQuery(ledgerPath, 'SELECT account, sum(position) GROUP BY account ORDER BY account;');
  return rows.map((row) => {
    const parts = parseAmount(row.sum_position);
    return {
      account: row.account.trim(),
      amount: parts.amount,
      currency: parts.currency,
    };
  });
}

async function loadMonthlyRows(ledgerPath: string): Promise<MonthlyRow[]> {
  const rows = await runBeanQuery(
    ledgerPath,
    'SELECT year, month, account, sum(position) GROUP BY year, month, account ORDER BY year, month, account;',
  );
  return rows.map((row) => {
    const parts = parseAmount(row.sum_position);
    return {
      year: Number(row.year.trim()),
      month: Number(row.month.trim()),
      account: row.account.trim(),
      amount: parts.amount,
      currency: parts.currency,
    };
  });
}

async function loadPostingRows(ledgerPath: string): Promise<PostingRow[]> {
  const rows = await runBeanQuery(
    ledgerPath,
    'SELECT date, filename, lineno, payee, narration, account, position ORDER BY date, filename, lineno, account;',
  );
  return rows.map((row) => {
    const parts = parseAmount(row.position);
    return {
      date: row.date.trim(),
      filename: row.filename.trim(),
      lineno: Number(row.lineno.trim()),
      payee: row.payee.trim(),
      narration: row.narration.trim(),
      account: row.account.trim(),
      amount: parts.amount,
      currency: parts.currency,
    };
  });
}

async function runBeanQuery(ledgerPath: string, query: string): Promise<CsvRecord[]> {
  const proc = Bun.spawn({
    cmd: ['bean-query', '-f', 'csv', ledgerPath, query],
    cwd: path.dirname(ledgerPath),
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `bean-query failed with exit code ${exitCode}`);
  }

  const rows = parseCsv(stdout, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
    relax_column_count: true,
  }) as CsvRecord[];

  return rows.map((row) => normalizeCsvRecord(row));
}

function normalizeCsvRecord(row: CsvRecord): CsvRecord {
  const normalized: CsvRecord = {...row};
  for (const [key, value] of Object.entries(row)) {
    const compactKey = key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (compactKey && normalized[compactKey] === undefined) {
      normalized[compactKey] = value;
    }
  }
  return normalized;
}

function inferProfile(accounts: string[]): DashboardProfile {
  let businessScore = 0;
  let householdScore = 0;
  for (const account of accounts) {
    if (BUSINESS_SIGNALS.some((signal) => account.startsWith(signal))) {
      businessScore += 1;
    }
    if (HOUSEHOLD_SIGNALS.some((signal) => account.startsWith(signal))) {
      householdScore += 1;
    }
  }
  return businessScore >= householdScore ? 'business' : 'household';
}

function parseAmount(raw: string | undefined | null): AmountParts {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return {amount: 0, currency: 'USD'};
  }
  const normalized = trimmed.replaceAll('"', '');
  const match = normalized.match(/^(-?[\d,\s]+(?:\.\d+)?)\s+([A-Z][A-Z0-9]*)$/);
  if (!match) {
    throw new Error(`Could not parse amount: ${raw}`);
  }
  return {
    amount: Number(match[1].replace(/[,\s]/g, '')),
    currency: match[2],
  };
}

function isOpeningTransaction(transaction: GroupedTransaction): boolean {
  return transaction.filename.includes('opening-balances') || transaction.narration.toLowerCase().includes('opening balance');
}

function isCashAccount(account: string): boolean {
  return CASH_ACCOUNT_PREFIXES.some((prefix) => account.startsWith(prefix));
}

function classifyFlow(accounts: string[], profile: DashboardProfile): FlowCategory {
  if (accounts.length === 0) {
    return 'internal';
  }
  if (accounts.every((account) => isCashAccount(account))) {
    return 'internal';
  }
  if (accounts.some((account) => classifyAccount(account, profile) === 'operating')) {
    return 'operating';
  }
  if (accounts.some((account) => classifyAccount(account, profile) === 'investing')) {
    return 'investing';
  }
  if (accounts.some((account) => classifyAccount(account, profile) === 'financing')) {
    return 'financing';
  }
  return 'operating';
}

function dominantFlowCategory(
  postings: Array<{account: string; amount: number}>,
  profile: DashboardProfile,
): FlowCategory {
  const weights = new Map<FlowCategory, number>();
  for (const posting of postings) {
    const category = classifyAccount(posting.account, profile);
    if (category === 'internal') {
      continue;
    }
    weights.set(category, (weights.get(category) ?? 0) + Math.abs(posting.amount));
  }
  let selected: FlowCategory = 'operating';
  let maxWeight = -1;
  for (const [category, weight] of weights) {
    if (weight > maxWeight) {
      selected = category;
      maxWeight = weight;
    }
  }
  return selected;
}

function classifyAccount(account: string, profile: DashboardProfile): FlowCategory {
  if (isCashAccount(account)) {
    return 'internal';
  }
  if (account.startsWith('Income:') || account.startsWith('Expenses:')) {
    return 'operating';
  }
  if (
    account.startsWith('Assets:Equipment') ||
    account.startsWith('Assets:Property') ||
    account.startsWith('Assets:Investment') ||
    account.startsWith('Assets:Brokerage') ||
    account.startsWith('Assets:Retirement') ||
    account.startsWith('Assets:Education')
  ) {
    return 'investing';
  }
  if (
    account.startsWith('Equity:') ||
    account.startsWith('Liabilities:Mortgage') ||
    account.startsWith('Liabilities:Loan') ||
    account.startsWith('Liabilities:LOC') ||
    account.startsWith('Liabilities:Line-Of-Credit')
  ) {
    return 'financing';
  }
  if (
    account.startsWith('Assets:Receivable') ||
    account.startsWith('Assets:Prepaid') ||
    account.startsWith('Liabilities:CreditCard') ||
    account.startsWith('Liabilities:Payable') ||
    account.startsWith('Liabilities:GST') ||
    account.startsWith('Liabilities:Tax')
  ) {
    return 'operating';
  }
  if (profile === 'household' && account.startsWith('Assets:Property')) {
    return 'investing';
  }
  return 'operating';
}

function categorizePostings(postings: PostingRow[], profile: DashboardProfile): Map<FlowCategory, number> {
  const categories = new Map<FlowCategory, number>();
  for (const posting of postings) {
    const category = classifyAccount(posting.account, profile);
    if (category === 'internal') {
      continue;
    }
    categories.set(category, (categories.get(category) ?? 0) + Math.abs(posting.amount));
  }
  return categories;
}

function addToBuckets(
  clearingBuckets: Map<string, Map<FlowCategory, number>>,
  account: string,
  categories: Map<FlowCategory, number>,
  totalAmount: number,
) {
  const bucket = clearingBuckets.get(account) ?? new Map<FlowCategory, number>();
  const totalWeight = Array.from(categories.values()).reduce((sum, value) => sum + value, 0);
  if (totalWeight <= EPSILON) {
    return;
  }
  for (const [category, weight] of categories) {
    const allocated = totalAmount * (weight / totalWeight);
    bucket.set(category, (bucket.get(category) ?? 0) + allocated);
  }
  clearingBuckets.set(account, bucket);
}

function consumeFromBuckets(bucket: Map<FlowCategory, number>, requestedAmount: number): Map<FlowCategory, number> {
  const allocation = new Map<FlowCategory, number>();
  let remaining = requestedAmount;
  const totalAvailable = Array.from(bucket.values()).reduce((sum, value) => sum + value, 0);
  if (totalAvailable <= EPSILON) {
    return allocation;
  }
  const categories = Array.from(bucket.entries());
  for (let index = 0; index < categories.length; index += 1) {
    const [category, available] = categories[index];
    const proportional = index === categories.length - 1 ? remaining : requestedAmount * (available / totalAvailable);
    const consumed = Math.min(available, proportional);
    if (consumed > EPSILON) {
      allocation.set(category, (allocation.get(category) ?? 0) + consumed);
      bucket.set(category, available - consumed);
      remaining -= consumed;
    }
  }
  for (const [category, available] of bucket) {
    if (available <= EPSILON) {
      bucket.delete(category);
    }
  }
  return allocation;
}

function isTrackedClearingAccount(account: string): boolean {
  return (
    account.startsWith('Liabilities:CreditCard') ||
    account.startsWith('Liabilities:Payable') ||
    account.startsWith('Assets:Receivable')
  );
}

function isExposureIncrease(posting: PostingRow): boolean {
  if (posting.account.startsWith('Liabilities:')) {
    return posting.amount < -EPSILON;
  }
  return posting.amount > EPSILON;
}

function isExposureReduction(posting: PostingRow): boolean {
  if (posting.account.startsWith('Liabilities:')) {
    return posting.amount > EPSILON;
  }
  return posting.amount < -EPSILON;
}

function toStatementRows(rows: MonthlyRow[], sign: 1 | -1): StatementRow[] {
  const byAccount = new Map<string, number>();
  for (const row of rows) {
    byAccount.set(row.account, (byAccount.get(row.account) ?? 0) + row.amount * sign);
  }
  return Array.from(byAccount.entries())
    .map(([account, amount]) => ({
      label: shortLabel(account),
      amount,
      account,
    }))
    .filter((row) => Math.abs(row.amount) > EPSILON);
}

function mapBalancesToRows(finalBalances: Map<string, number>, prefix: string, sign: 1 | -1): StatementRow[] {
  return Array.from(finalBalances.entries())
    .filter(([account]) => account.startsWith(`${prefix}:`))
    .map(([account, amount]) => ({
      label: shortLabel(account),
      amount: amount * sign,
      account,
    }))
    .filter((row) => Math.abs(row.amount) > EPSILON);
}

function filterRowsByPrefix(rows: MonthlyRow[], prefix: string): MonthlyRow[] {
  return rows.filter((row) => row.account.startsWith(`${prefix}:`));
}

function withShares(rows: StatementRow[], total: number): StatementRow[] {
  if (Math.abs(total) <= EPSILON) {
    return rows;
  }
  return rows.map((row) => ({
    ...row,
    share: row.amount / total,
  }));
}

function sortRowsDesc(rows: StatementRow[]): StatementRow[] {
  return rows.sort((left, right) => right.amount - left.amount);
}

function totalRows(rows: StatementRow[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function sumRows(rows: StatementRow[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function sumSection(rows: StatementRow[], needle: string): number {
  return rows
    .filter((row) => row.account?.includes(needle))
    .reduce((total, row) => total + row.amount, 0);
}

function sumByPrefix(map: Map<string, number>, prefix: string, sign: 1 | -1): number {
  let total = 0;
  for (const [account, amount] of map) {
    if (account.startsWith(`${prefix}:`)) {
      total += amount * sign;
    }
  }
  return total;
}

function sumMapByPrefix(map: Map<string, number>, prefix: string): number {
  let total = 0;
  for (const [account, amount] of map) {
    if (account.startsWith(`${prefix}:`)) {
      total += amount;
    }
  }
  return total;
}

function sumMapByPredicate(map: Map<string, number>, predicate: (account: string) => boolean): number {
  let total = 0;
  for (const [account, amount] of map) {
    if (predicate(account)) {
      total += amount;
    }
  }
  return total;
}

function shortLabel(account: string): string {
  return account
    .split(':')
    .slice(1)
    .map((segment) => segment.replaceAll('-', ' '))
    .join(' / ');
}

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('en', {style: 'percent', maximumFractionDigits: 0}).format(value);
}

function formatSigned(value: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    signDisplay: 'always',
  }).format(value);
}

async function fileExists(candidate: string): Promise<boolean> {
  return await Bun.file(candidate).exists();
}

export async function findRepoRoot(fromDir: string): Promise<string> {
  let current = path.resolve(fromDir);
  while (true) {
    for (const marker of REPO_MARKERS) {
      if (await fileExists(path.join(current, marker))) {
        return current;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return fromDir;
    }
    current = parent;
  }
}
