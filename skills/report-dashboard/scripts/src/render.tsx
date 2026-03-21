import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {
  BreakdownBlock,
  DashboardData,
  MetricCard,
  MonthlyPoint,
  DashboardVariant,
  StatementRow,
  StatementSection,
  StatementSummary,
  TransactionSummary,
} from './types';

const pageShell = 'mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6';
const panel =
  'rounded-[24px] border border-white/70 bg-white/84 shadow-[0_12px_40px_rgba(11,29,26,0.1)] backdrop-blur';

export function renderDashboardHtml(
  data: DashboardData,
  options: {
    variant?: DashboardVariant;
  } = {},
): string {
  const variant = options.variant ?? 'full';
  const titleLabel = variant === 'social' ? ' Social Dashboard' : ' Dashboard';
  const markup = renderToStaticMarkup(
    variant === 'social' ? <SocialDashboardPage data={data} /> : <DashboardPage data={data} />,
  );
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.meta.title)}${titleLabel}</title>
    <meta name="description" content="${variant === 'social' ? 'Share-safe CFO Stack dashboard with redacted values.' : 'Deterministic CFO Stack dashboard generated from Beancount data.'}" />
    <link rel="stylesheet" href="./dashboard.css" />
  </head>
  <body class="min-h-screen bg-[#f7f7f2] text-[#10211d]">
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
          button.classList.toggle('bg-transparent', !active);
          button.classList.toggle('text-[#50615b]', !active);
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
        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.45fr_0.55fr] lg:px-7 lg:py-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              <span>{isBusiness ? 'Finance operating system' : 'Household operating system'}</span>
              <span className="rounded-full bg-[#10211d] px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white">
                {data.meta.profile}
              </span>
            </div>
            <div className="space-y-2">
              <h1
                className="max-w-4xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#10211d] sm:text-4xl lg:text-[3.25rem]"
                style={{fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'}}
              >
                {data.meta.title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[#42504b] sm:text-[0.98rem]">
                Deterministic dashboard generated from <code className="rounded bg-[#10211d]/6 px-1.5 py-0.5 text-[0.92em]">{data.meta.ledgerPath}</code>.
                The renderer stays static, but the data comes directly from <code className="rounded bg-[#10211d]/6 px-1.5 py-0.5 text-[0.92em]">bean-query</code>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border border-[#10211d]/8 bg-[#fbf8f1] px-4 py-3">
              <MetaPill label="Report window" value={data.meta.periodLabel} />
              <MetaPill label="Latest month" value={data.meta.latestMonthLabel} />
              <MetaPill label="Review threshold" value={reviewThresholdLabel(data)} />
              <MetaPill label="Generated" value={timestampLabel(data.meta.generatedAt)} />
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-4 rounded-[20px] bg-[#10211d] p-5 text-white shadow-[0_12px_35px_rgba(16,33,29,0.22)]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#92d7cc]">What stands out</div>
                <div className="flex flex-wrap gap-2">
                  <ArtifactLink href="./dashboard-data.json" label="JSON" />
                  <ArtifactLink href="./index.html" label="HTML" />
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-white/80">
                {data.highlights.map((highlight) => (
                  <li key={highlight} className="border-l-2 border-[#92d7cc]/60 pl-3">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-white/8 bg-white/6 px-3 py-3 text-center">
              <MiniStat label="Months" value={String(data.monthly.length)} />
              <MiniStat label="Alerts" value={String(data.flaggedTransactions.length)} />
              <MiniStat label="Currency" value={data.meta.currency} />
            </div>
          </aside>
        </div>
      </header>

      <main className="mt-4 space-y-4">
        <section className="grid gap-3 lg:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricTile key={metric.label} currency={data.meta.currency} metric={metric} />
          ))}
        </section>

        <section>
          <div role="tablist" aria-label="Dashboard sections" className="flex flex-wrap gap-2 border-b border-[#10211d]/10 pb-2">
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

function SocialDashboardPage({data}: {data: DashboardData}) {
  const isBusiness = data.meta.profile === 'business';
  return (
    <div className={pageShell} style={{fontFamily: '"Avenir Next", "IBM Plex Sans", "Segoe UI", sans-serif'}}>
      <header className={`${panel} overflow-hidden`}>
        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-7 lg:py-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
              <span>{isBusiness ? 'Finance operating system' : 'Household operating system'}</span>
              <span className="rounded-full bg-[#10211d] px-3 py-1 text-[0.68rem] tracking-[0.22em] text-white">
                {data.meta.profile}
              </span>
              <span className="rounded-full border border-[#10211d]/10 bg-white/70 px-3 py-1 text-[0.68rem] tracking-[0.18em] text-[#10211d]">
                Share-safe view
              </span>
            </div>
            <div className="space-y-2">
              <h1
                className="max-w-4xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#10211d] sm:text-4xl lg:text-[3.15rem]"
                style={{fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'}}
              >
                {data.meta.title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[#42504b] sm:text-[0.98rem]">
                Relative shapes and category mix stay visible. Exact amounts, statement totals, and transaction figures are redacted for social sharing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border border-[#10211d]/8 bg-[#fbf8f1] px-4 py-3">
              <MetaPill label="Window" value="Recent periods" />
              <MetaPill label="Visibility" value="Amounts redacted" />
              <MetaPill label="Focus" value="Trend, cash movement, mix" />
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-4 rounded-[20px] bg-[#10211d] p-5 text-white shadow-[0_12px_35px_rgba(16,33,29,0.22)]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#92d7cc]">Designed for sharing</div>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-white/80">
                <li className="border-l-2 border-[#92d7cc]/60 pl-3">Visual trends stay intact without exposing exact money figures.</li>
                <li className="border-l-2 border-[#92d7cc]/60 pl-3">Category mix and directionality remain readable in screenshots and embeds.</li>
                <li className="border-l-2 border-[#92d7cc]/60 pl-3">Statement tables and activity rows are intentionally removed from this share-safe view.</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-white/8 bg-white/6 px-3 py-3 text-center">
              <MiniStat label="Trends" value="Live" />
              <MiniStat label="Values" value="Hidden" />
              <MiniStat label="Currency" value={data.meta.currency} />
            </div>
          </aside>
        </div>
      </header>

      <main className="mt-4 space-y-4">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <TrendPanel currency={data.meta.currency} monthly={data.monthly} profile={data.meta.profile} redactedValues />
          <FlowPanel currency={data.meta.currency} monthly={data.monthly} redactedValues />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <BreakdownCard currency={data.meta.currency} block={data.mixes.primary} tone="emerald" redactedValues />
          <BreakdownCard currency={data.meta.currency} block={data.mixes.secondary} tone="amber" redactedValues />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <BreakdownCard currency={data.meta.currency} block={data.mixes.assets} tone="ink" redactedValues />
          <BreakdownCard currency={data.meta.currency} block={data.mixes.liabilities} tone="slate" redactedValues />
        </div>
      </main>
    </div>
  );
}

function MetaPill({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-center gap-2 text-xs leading-5">
      <div className="font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{label}</div>
      <div className="font-medium text-[#122722]">{value}</div>
    </div>
  );
}

function ArtifactLink({href, label}: {href: string; label: string}) {
  return (
    <a
      href={href}
      className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/14"
    >
      {label}
    </a>
  );
}

function MiniStat({label, value}: {label: string; value: string}) {
  return (
    <div>
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/55">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
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
    <article className={`${panel} px-4 py-4`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#6a756f]">{metric.label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${toneClasses}`}>
        {metric.value === null
          ? 'N/A'
          : metric.label === 'Savings rate'
            ? percent(metric.value)
            : money(metric.value, currency)}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#50615b]">{metric.note}</p>
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
      className="rounded-full bg-transparent px-4 py-2 text-sm font-semibold tracking-[-0.02em] text-[#50615b] transition"
    >
      {label}
    </button>
  );
}

function TrendPanel({
  currency,
  monthly,
  profile,
  redactedValues = false,
}: {
  currency: string;
  monthly: MonthlyPoint[];
  profile: DashboardData['meta']['profile'];
  redactedValues?: boolean;
}) {
  const max = Math.max(
    1,
    ...monthly.flatMap((point) => [point.revenue, point.expenses, Math.abs(point.netIncome)]),
  );
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#10211d]/7 px-5 py-4">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Trendline</div>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">
            {profile === 'business' ? 'Revenue, cost, and margin' : 'Income, spending, and surplus'}
          </h2>
        </div>
        <div className="rounded-full bg-[#10211d]/5 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#50615b]">
          {redactedValues ? 'Recent periods' : monthWindowLabel(monthly.length)}
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/90 to-transparent sm:hidden" />
        <div className="overflow-x-auto px-5 py-4">
          <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6a756f] sm:hidden">
            Swipe for month detail
          </div>
          <div className="grid gap-3" style={monthGridStyle(monthly.length, 220)}>
            {monthly.map((point) => (
              <div key={point.key} className="rounded-[18px] bg-[#fbf8f1] p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a756f]">{displayPeriodLabel(point.label, point.key, monthly, redactedValues)}</div>
                <div className="mt-3 flex h-36 items-end gap-1.5">
                  <TrendBar color="bg-[#0f766e]" height={Math.max(12, (point.revenue / max) * 120)} value={point.revenue} currency={currency} label="Revenue" redactedValues={redactedValues} />
                  <TrendBar color="bg-[#d97706]" height={Math.max(12, (point.expenses / max) * 120)} value={point.expenses} currency={currency} label="Expenses" redactedValues={redactedValues} />
                  <TrendBar color={point.netIncome >= 0 ? 'bg-[#10211d]' : 'bg-[#9a3412]'} height={Math.max(12, (Math.abs(point.netIncome) / max) * 120)} value={point.netIncome} currency={currency} label="Net" redactedValues={redactedValues} />
                </div>
                <div className="mt-3 space-y-1.5 text-[0.7rem] text-[#50615b]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Ending cash</span>
                    <span className="text-right font-semibold text-[#10211d]">{displayMoney(point.cashBalance, currency, redactedValues)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Net worth</span>
                    <span className="text-right font-semibold text-[#10211d]">{displayMoney(point.netWorth, currency, redactedValues)}</span>
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
  redactedValues = false,
}: {
  color: string;
  height: number;
  value: number;
  currency: string;
  label: string;
  redactedValues?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-1.5">
      <div className="text-[0.62rem] font-semibold text-[#6a756f]">{label}</div>
      <div
        title={redactedValues ? `${label}: redacted` : `${label}: ${money(value, currency)}`}
        className={`w-full rounded-t-[14px] ${color} shadow-[0_8px_22px_rgba(16,33,29,0.12)]`}
        style={{height}}
      />
      <div className="text-[0.66rem] font-medium text-[#10211d]">{redactedValues ? redactedValueLabel() : compactMoney(value, currency)}</div>
    </div>
  );
}

function FlowPanel({
  currency,
  monthly,
  redactedValues = false,
}: {
  currency: string;
  monthly: MonthlyPoint[];
  redactedValues?: boolean;
}) {
  return (
    <section className={`${panel} px-5 py-4`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Cash movement</div>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">Operating, investing, and financing</h2>
      <div className="mt-4 space-y-3">
        {[
          {key: 'operating', label: 'Operating', tone: 'bg-[#0f766e]'},
          {key: 'investing', label: 'Investing', tone: 'bg-[#d97706]'},
          {key: 'financing', label: 'Financing', tone: 'bg-[#10211d]'},
        ].map((flow) => {
          const values = monthly.map((point) => point[flow.key as keyof MonthlyPoint] as number);
          const peak = Math.max(1, ...values.map((value) => Math.abs(value)));
          return (
            <div key={flow.key} className="rounded-[18px] bg-[#fbf8f1] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#10211d]">{flow.label}</div>
                <div className="text-sm font-semibold text-[#10211d]">
                  {displayMoney(values.reduce((total, value) => total + value, 0), currency, redactedValues)}
                </div>
              </div>
              <div className="mt-3 grid gap-2" style={monthGridStyle(monthly.length, 92)}>
                {monthly.map((point) => {
                  const value = point[flow.key as keyof MonthlyPoint] as number;
                  const width = `${Math.max(8, (Math.abs(value) / peak) * 100)}%`;
                  const barTone = value < 0 ? 'bg-[#b45309]' : flow.tone;
                  return (
                    <div key={`${flow.key}:${point.key}`} className="space-y-1.5">
                      <div className="text-[0.62rem] uppercase tracking-[0.16em] text-[#6a756f]">{displayPeriodLabel(point.label, point.key, monthly, redactedValues)}</div>
                      <div className="h-2 rounded-full bg-[#10211d]/8">
                        <div
                          title={redactedValues ? `${flow.label}: redacted` : `${flow.label}: ${money(value, currency)}`}
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
  redactedValues = false,
}: {
  block: BreakdownBlock;
  currency: string;
  tone: 'emerald' | 'amber' | 'ink' | 'slate';
  redactedValues?: boolean;
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
    <section className={`${panel} px-5 py-4`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Composition</div>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{block.title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#50615b]">{block.subtitle}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl ${toneClass}`} />
      </div>
      <div className="mt-4 space-y-2.5">
        {block.rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[0.92rem] font-medium text-[#10211d]">{row.label}</div>
              <div className="text-[0.92rem] font-semibold text-[#10211d]">{displayMoney(row.amount, currency, redactedValues)}</div>
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
      <div className="border-b border-[#10211d]/7 px-5 py-4">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Statement</div>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{summary.title}</h2>
      </div>
      <div className="space-y-4 px-5 py-4">
        {summary.sections.map((section) => (
          <StatementSectionView key={section.title} currency={currency} section={section} />
        ))}
        <div className="rounded-[18px] bg-[#10211d] px-4 py-3 text-white">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/60">{summary.totalLabel}</div>
          <div className={`mt-1 text-2xl font-semibold tracking-[-0.04em] ${accentClass} text-white`}>
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
    <div className="rounded-[18px] bg-[#fbf8f1] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{section.title}</div>
        <div className="text-sm font-semibold text-[#10211d]">{money(section.total, currency)}</div>
      </div>
      <div className="mt-3 space-y-2">
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
      <div className="border-b border-[#10211d]/7 px-5 py-4">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Activity</div>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-[#50615b]">{subtitle}</p>
      </div>
      <div className="px-5 py-3">
        {rows.length === 0 ? (
          <div className="rounded-[18px] bg-[#fbf8f1] px-4 py-4 text-sm text-[#50615b]">{emptyLabel}</div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="border-b border-[#10211d]/7 py-3 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#6a756f]">{row.date}</div>
                    <div className="text-base font-semibold tracking-[-0.02em] text-[#10211d]">{row.payee}</div>
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#6a756f]">{row.category}</div>
                  </div>
                  <div className="mt-1 text-sm text-[#42504b]">{row.narration}</div>
                  <div className="mt-1 text-xs leading-5 text-[#66726d]">{row.note}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-base font-semibold tracking-[-0.02em] ${row.flagged ? 'text-[#b45309]' : 'text-[#10211d]'}`}>
                    {money(row.amount, currency)}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ActivityGrid({currency, monthly}: {currency: string; monthly: MonthlyPoint[]}) {
  return (
    <section className={`${panel} px-5 py-4`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Monthly pulse</div>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">Month-by-month summary</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {monthly.map((point) => (
          <article key={point.key} className="rounded-[18px] bg-[#fbf8f1] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6a756f]">{point.label}</div>
              <div className="rounded-full bg-[#10211d] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
                {point.netIncome >= 0 ? 'positive' : 'negative'}
              </div>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
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

function displayMoney(value: number, currency: string, redactedValues: boolean): string {
  return redactedValues ? redactedValueLabel() : money(value, currency);
}

function redactedValueLabel(): string {
  return '••••';
}

function displayPeriodLabel(
  label: string,
  key: string,
  monthly: MonthlyPoint[],
  redactedValues: boolean,
): string {
  if (!redactedValues) {
    return label;
  }
  if (monthly.length <= 1) {
    return 'Current';
  }
  const index = monthly.findIndex((point) => point.key === key);
  const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.max(index, 0)] ?? 'Z';
  return `Period ${letter}`;
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

function monthWindowLabel(monthCount: number): string {
  return monthCount === 1 ? 'Last month' : `Last ${monthCount} months`;
}

function monthGridStyle(monthCount: number, minColumnWidth: number) {
  return {
    gridTemplateColumns: `repeat(${Math.max(monthCount, 1)}, minmax(${minColumnWidth}px, 1fr))`,
  };
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
