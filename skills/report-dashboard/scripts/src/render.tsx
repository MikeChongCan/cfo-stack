import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {
  BreakdownBlock,
  DashboardData,
  MetricCard,
  MonthlyPoint,
  StatementRow,
  StatementSection,
  StatementSummary,
  TransactionSummary,
} from './types';

const pageShell = 'mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-10';
const panel =
  'rounded-[30px] border border-white/60 bg-white/80 shadow-[0_18px_70px_rgba(11,29,26,0.14)] backdrop-blur';

export function renderDashboardHtml(data: DashboardData): string {
  const markup = renderToStaticMarkup(<DashboardPage data={data} />);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.meta.title)} Dashboard</title>
    <meta name="description" content="Deterministic CFO Stack dashboard generated from Beancount data." />
    <link rel="stylesheet" href="./dashboard.css" />
  </head>
  <body class="min-h-screen text-[#10211d]">
    ${markup}
    <script>
      const buttons = Array.from(document.querySelectorAll('[data-tab-button]'));
      const panels = Array.from(document.querySelectorAll('[data-tab-panel]'));
      function setTab(tab) {
        buttons.forEach((button) => {
          const active = button.getAttribute('data-tab-button') === tab;
          button.setAttribute('aria-selected', active ? 'true' : 'false');
          button.classList.toggle('bg-[#10211d]', active);
          button.classList.toggle('text-white', active);
          button.classList.toggle('shadow-[0_10px_35px_rgba(16,33,29,0.22)]', active);
          button.classList.toggle('bg-white/70', !active);
          button.classList.toggle('text-[#10211d]', !active);
        });
        panels.forEach((panel) => {
          panel.toggleAttribute('hidden', panel.getAttribute('data-tab-panel') !== tab);
        });
      }
      buttons.forEach((button) => button.addEventListener('click', () => setTab(button.getAttribute('data-tab-button'))));
      if (buttons.length > 0) setTab(buttons[0].getAttribute('data-tab-button'));
    </script>
  </body>
</html>`;
}

function DashboardPage({data}: {data: DashboardData}) {
  const isBusiness = data.meta.profile === 'business';
  return (
    <div className={pageShell} style={{fontFamily: '"Avenir Next", "IBM Plex Sans", "Segoe UI", sans-serif'}}>
      <header className={`${panel} overflow-hidden`}>
        <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-10">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              <span>{isBusiness ? 'Finance operating system' : 'Household operating system'}</span>
              <span className="rounded-full bg-[#10211d] px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white">
                {data.meta.profile}
              </span>
            </div>
            <div className="space-y-3">
              <h1
                className="max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#10211d] sm:text-5xl lg:text-[4.15rem]"
                style={{fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'}}
              >
                {data.meta.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[#42504b] sm:text-lg">
                Deterministic dashboard generated from <code className="rounded bg-[#10211d]/6 px-1.5 py-0.5 text-[0.92em]">{data.meta.ledgerPath}</code>.
                The renderer stays static, but the data comes directly from <code className="rounded bg-[#10211d]/6 px-1.5 py-0.5 text-[0.92em]">bean-query</code>.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetaPill label="Report window" value={data.meta.periodLabel} />
              <MetaPill label="Latest month" value={data.meta.latestMonthLabel} />
              <MetaPill label="Review threshold" value={reviewThresholdLabel(data)} />
              <MetaPill label="Generated" value={timestampLabel(data.meta.generatedAt)} />
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-6 rounded-[26px] bg-[#10211d] p-6 text-white shadow-[0_16px_45px_rgba(16,33,29,0.28)]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#92d7cc]">What stands out</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                {data.highlights.map((highlight) => (
                  <li key={highlight} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/6 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#92d7cc]">Artifacts</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ArtifactLink href="./dashboard-data.json" label="Raw JSON" />
                <ArtifactLink href="./index.html" label="Standalone HTML" />
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main className="mt-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricTile key={metric.label} currency={data.meta.currency} metric={metric} />
          ))}
        </section>

        <section className={`${panel} p-3`}>
          <div role="tablist" aria-label="Dashboard sections" className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" />
            <TabButton id="statements" label="Statements" />
            <TabButton id="activity" label="Activity" />
          </div>
        </section>

        <section
          id="overview-panel"
          role="tabpanel"
          aria-labelledby="overview-tab"
          data-tab-panel="overview"
          className="space-y-6"
        >
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <TrendPanel currency={data.meta.currency} monthly={data.monthly} profile={data.meta.profile} />
            <FlowPanel currency={data.meta.currency} monthly={data.monthly} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownCard currency={data.meta.currency} block={data.mixes.primary} tone="emerald" />
            <BreakdownCard currency={data.meta.currency} block={data.mixes.secondary} tone="amber" />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownCard currency={data.meta.currency} block={data.mixes.assets} tone="ink" />
            <BreakdownCard currency={data.meta.currency} block={data.mixes.liabilities} tone="slate" />
          </div>
        </section>

        <section
          id="statements-panel"
          role="tabpanel"
          aria-labelledby="statements-tab"
          data-tab-panel="statements"
          hidden
          className="space-y-6"
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <StatementCard currency={data.meta.currency} summary={data.incomeStatement} accent="emerald" />
            <StatementCard currency={data.meta.currency} summary={data.cashFlow} accent="amber" />
          </div>
          <StatementCard currency={data.meta.currency} summary={data.balanceSheet} accent="ink" />
        </section>

        <section
          id="activity-panel"
          role="tabpanel"
          aria-labelledby="activity-tab"
          data-tab-panel="activity"
          hidden
          className="space-y-6"
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <TransactionCard currency={data.meta.currency} rows={data.recentTransactions} title="Recent activity" subtitle="Most recent grouped transactions from the ledger." />
            <TransactionCard
              currency={data.meta.currency}
              rows={data.flaggedTransactions}
              title="Needs review"
              subtitle={flaggedSubtitle(data)}
              emptyLabel={flaggedEmptyLabel(data)}
            />
          </div>
          <ActivityGrid currency={data.meta.currency} monthly={data.monthly} />
        </section>
      </main>
    </div>
  );
}

function MetaPill({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[22px] border border-[#10211d]/8 bg-[#fbf8f1] px-4 py-4">
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#6a756f]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[#122722]">{value}</div>
    </div>
  );
}

function ArtifactLink({href, label}: {href: string; label: string}) {
  return (
    <a
      href={href}
      className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/14"
    >
      {label}
    </a>
  );
}

function MetricTile({metric, currency}: {metric: MetricCard; currency: string}) {
  const toneClasses =
    metric.tone === 'positive'
      ? 'text-[#0f766e]'
      : metric.tone === 'negative'
        ? 'text-[#b45309]'
        : 'text-[#10211d]';

  return (
    <article className={`${panel} px-5 py-5`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#6a756f]">{metric.label}</div>
      <div className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${toneClasses}`}>
        {metric.value === null
          ? 'N/A'
          : metric.label === 'Savings rate'
            ? percent(metric.value)
            : money(metric.value, currency)}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#50615b]">{metric.note}</p>
    </article>
  );
}

function TabButton({id, label}: {id: string; label: string}) {
  return (
    <button
      id={`${id}-tab`}
      role="tab"
      aria-controls={`${id}-panel`}
      type="button"
      data-tab-button={id}
      aria-selected="false"
      className="rounded-full bg-white/70 px-5 py-3 text-sm font-semibold tracking-[-0.02em] text-[#10211d] transition"
    >
      {label}
    </button>
  );
}

function TrendPanel({
  currency,
  monthly,
  profile,
}: {
  currency: string;
  monthly: MonthlyPoint[];
  profile: DashboardData['meta']['profile'];
}) {
  const max = Math.max(
    1,
    ...monthly.flatMap((point) => [point.revenue, point.expenses, Math.abs(point.netIncome)]),
  );
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#10211d]/7 px-6 py-5">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Trendline</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">
            {profile === 'business' ? 'Revenue, cost, and margin' : 'Income, spending, and surplus'}
          </h2>
        </div>
        <div className="rounded-full bg-[#10211d]/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#50615b]">
          Last {monthly.length} months
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f7f4ec] to-transparent sm:hidden" />
        <div className="overflow-x-auto px-6 py-6">
          <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6a756f] sm:hidden">
            Swipe for month detail
          </div>
        <div className="grid min-w-[720px] grid-cols-6 gap-4">
          {monthly.map((point) => (
            <div key={point.key} className="rounded-[24px] bg-[#fbf8f1] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a756f]">{point.label}</div>
              <div className="mt-4 flex h-52 items-end gap-3">
                <TrendBar color="bg-[#0f766e]" height={Math.max(14, (point.revenue / max) * 180)} value={point.revenue} currency={currency} label="Revenue" />
                <TrendBar color="bg-[#d97706]" height={Math.max(14, (point.expenses / max) * 180)} value={point.expenses} currency={currency} label="Expenses" />
                <TrendBar color={point.netIncome >= 0 ? 'bg-[#10211d]' : 'bg-[#9a3412]'} height={Math.max(14, (Math.abs(point.netIncome) / max) * 180)} value={point.netIncome} currency={currency} label="Net" />
              </div>
              <div className="mt-4 space-y-2 text-xs text-[#50615b]">
                <div className="flex items-center justify-between">
                  <span>Ending cash</span>
                  <span className="font-semibold text-[#10211d]">{money(point.cashBalance, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Net worth</span>
                  <span className="font-semibold text-[#10211d]">{money(point.netWorth, currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function TrendBar({
  color,
  height,
  value,
  currency,
  label,
}: {
  color: string;
  height: number;
  value: number;
  currency: string;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-2">
      <div className="text-[0.68rem] font-semibold text-[#6a756f]">{label}</div>
      <div
        title={`${label}: ${money(value, currency)}`}
        className={`w-full rounded-t-[20px] ${color} shadow-[0_10px_30px_rgba(16,33,29,0.15)]`}
        style={{height}}
      />
      <div className="text-[0.7rem] font-medium text-[#10211d]">{compactMoney(value, currency)}</div>
    </div>
  );
}

function FlowPanel({currency, monthly}: {currency: string; monthly: MonthlyPoint[]}) {
  return (
    <section className={`${panel} px-6 py-6`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Cash movement</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">Operating, investing, and financing</h2>
      <div className="mt-6 space-y-4">
        {[
          {key: 'operating', label: 'Operating', tone: 'bg-[#0f766e]'},
          {key: 'investing', label: 'Investing', tone: 'bg-[#d97706]'},
          {key: 'financing', label: 'Financing', tone: 'bg-[#10211d]'},
        ].map((flow) => {
          const values = monthly.map((point) => point[flow.key as keyof MonthlyPoint] as number);
          const peak = Math.max(1, ...values.map((value) => Math.abs(value)));
          return (
            <div key={flow.key} className="rounded-[22px] bg-[#fbf8f1] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#10211d]">{flow.label}</div>
                <div className="text-sm font-semibold text-[#10211d]">
                  {money(values.reduce((total, value) => total + value, 0), currency)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {monthly.map((point) => {
                  const value = point[flow.key as keyof MonthlyPoint] as number;
                  const width = `${Math.max(8, (Math.abs(value) / peak) * 100)}%`;
                  const barTone = value < 0 ? 'bg-[#b45309]' : flow.tone;
                  return (
                    <div key={`${flow.key}:${point.key}`} className="space-y-2">
                      <div className="text-[0.68rem] uppercase tracking-[0.18em] text-[#6a756f]">{point.label}</div>
                      <div className="h-2 rounded-full bg-[#10211d]/8">
                        <div
                          title={`${flow.label}: ${money(value, currency)}`}
                          className={`h-2 rounded-full ${barTone}`}
                          style={{width}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BreakdownCard({
  block,
  currency,
  tone,
}: {
  block: BreakdownBlock;
  currency: string;
  tone: 'emerald' | 'amber' | 'ink' | 'slate';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-[#0f766e]'
      : tone === 'amber'
        ? 'bg-[#d97706]'
        : tone === 'ink'
          ? 'bg-[#10211d]'
          : 'bg-[#475569]';
  return (
    <section className={`${panel} px-6 py-6`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Composition</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">{block.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#50615b]">{block.subtitle}</p>
        </div>
        <div className={`h-12 w-12 rounded-2xl ${toneClass}`} />
      </div>
      <div className="mt-6 space-y-4">
        {block.rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-[#10211d]">{row.label}</div>
              <div className="text-sm font-semibold text-[#10211d]">{money(row.amount, currency)}</div>
            </div>
            <div className="h-2 rounded-full bg-[#10211d]/8">
              <div className={`h-2 rounded-full ${toneClass}`} style={{width: `${Math.max(8, (row.share ?? 0) * 100)}%`}} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatementCard({
  currency,
  summary,
  accent,
}: {
  currency: string;
  summary: StatementSummary;
  accent: 'emerald' | 'amber' | 'ink';
}) {
  const accentClass = accent === 'emerald' ? 'text-[#0f766e]' : accent === 'amber' ? 'text-[#b45309]' : 'text-[#10211d]';
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="border-b border-[#10211d]/7 px-6 py-5">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Statement</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">{summary.title}</h2>
      </div>
      <div className="space-y-6 px-6 py-6">
        {summary.sections.map((section) => (
          <StatementSectionView key={section.title} currency={currency} section={section} />
        ))}
        <div className="rounded-[24px] bg-[#10211d] px-5 py-4 text-white">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/60">{summary.totalLabel}</div>
          <div className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${accentClass} text-white`}>
            {money(summary.total, currency)}
          </div>
          {summary.comparisonLabel && summary.comparisonValue !== undefined ? (
            <div className="mt-2 text-sm text-white/70">
              {summary.comparisonLabel}: {money(summary.comparisonValue, currency)}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatementSectionView({currency, section}: {currency: string; section: StatementSection}) {
  return (
    <div className="rounded-[24px] bg-[#fbf8f1] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{section.title}</div>
        <div className="text-sm font-semibold text-[#10211d]">{money(section.total, currency)}</div>
      </div>
      <div className="mt-4 space-y-3">
        {section.rows.map((row) => (
          <StatementRowView key={row.label} currency={currency} row={row} />
        ))}
      </div>
    </div>
  );
}

function StatementRowView({currency, row}: {currency: string; row: StatementRow}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="text-[#10211d]">{row.label}</div>
      <div className="flex items-center gap-3">
        {row.share !== undefined ? <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a756f]">{percent(row.share)}</span> : null}
        <span className="font-semibold text-[#10211d]">{money(row.amount, currency)}</span>
      </div>
    </div>
  );
}

function TransactionCard({
  currency,
  rows,
  title,
  subtitle,
  emptyLabel = 'No transactions to show.',
}: {
  currency: string;
  rows: TransactionSummary[];
  title: string;
  subtitle: string;
  emptyLabel?: string;
}) {
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="border-b border-[#10211d]/7 px-6 py-5">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Activity</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#50615b]">{subtitle}</p>
      </div>
      <div className="space-y-3 px-6 py-6">
        {rows.length === 0 ? (
          <div className="rounded-[24px] bg-[#fbf8f1] px-5 py-5 text-sm text-[#50615b]">{emptyLabel}</div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="rounded-[24px] bg-[#fbf8f1] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{row.date}</div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{row.payee}</div>
                  <div className="mt-1 text-sm leading-6 text-[#50615b]">{row.narration}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold tracking-[-0.03em] ${row.flagged ? 'text-[#b45309]' : 'text-[#10211d]'}`}>
                    {money(row.amount, currency)}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{row.category}</div>
                </div>
              </div>
              <div className="mt-4 text-sm leading-6 text-[#42504b]">{row.note}</div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ActivityGrid({currency, monthly}: {currency: string; monthly: MonthlyPoint[]}) {
  return (
    <section className={`${panel} px-6 py-6`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Monthly pulse</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">Month-by-month summary</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {monthly.map((point) => (
          <article key={point.key} className="rounded-[24px] bg-[#fbf8f1] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{point.label}</div>
              <div className="rounded-full bg-[#10211d] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
                {point.netIncome >= 0 ? 'positive' : 'negative'}
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <MetricRow currency={currency} label="Revenue / income" value={point.revenue} />
              <MetricRow currency={currency} label="Expenses / spending" value={point.expenses} />
              <MetricRow currency={currency} label="Net result" value={point.netIncome} />
              <MetricRow currency={currency} label="Net cash flow" value={point.net} />
              <MetricRow currency={currency} label="Ending cash" value={point.cashBalance} />
              <MetricRow currency={currency} label="Net worth" value={point.netWorth} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricRow({currency, label, value}: {currency: string; label: string; value: number}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#50615b]">{label}</dt>
      <dd className="font-semibold text-[#10211d]">{money(value, currency)}</dd>
    </div>
  );
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function compactMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);
}

function percent(value: number): string {
  return new Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function timestampLabel(timestamp: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function reviewThresholdLabel(data: DashboardData): string {
  const threshold = data.meta.reviewThreshold;
  if (!threshold.enabled) {
    return 'Disabled';
  }
  if (!threshold.comparable) {
    return `Policy uses ${threshold.currency}`;
  }
  return `${money(threshold.amount, threshold.currency)}+`;
}

function flaggedSubtitle(data: DashboardData): string {
  const threshold = data.meta.reviewThreshold;
  if (!threshold.enabled) {
    return 'Large-transaction review is disabled by policy.';
  }
  if (!threshold.comparable) {
    return `Review policy is configured in ${threshold.currency}, which does not match this ledger's operating currency.`;
  }
  return `Transactions at or above ${money(threshold.amount, threshold.currency)} from the ${threshold.source} review policy.`;
}

function flaggedEmptyLabel(data: DashboardData): string {
  const threshold = data.meta.reviewThreshold;
  if (!threshold.enabled) {
    return 'Policy disables large-transaction review for this ledger.';
  }
  if (!threshold.comparable) {
    return `No comparable review queue because the configured threshold currency is ${threshold.currency}.`;
  }
  return `No transactions at or above ${money(threshold.amount, threshold.currency)} in the extracted window.`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
