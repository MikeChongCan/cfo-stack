# cfo-stack — Agent Instructions

> Note: `AGENTS.md` is the high-order instruction file for CFO Stack. `CLAUDE.md` is a symlink to this file, so update `AGENTS.md` when repo-level agent behavior changes materially. Keep it lean and move project-specific or domain-heavy guidance into `./.agents/skills/*` when needed. Keep onboarding/setup behavior aligned with [skills/setup/SKILL.md](skills/setup/SKILL.md).

AI-powered accounting, bookkeeping, and tax planning using the C.L.E.A.R. system and Beancount.

## Global Rules

1. Never invent tax rules or statutory rates. Only compute from provided jurisdiction packs.
2. Never claim compliance. Produce traceable data packets; a licensed professional confirms compliance.
3. Propose diffs only. AI suggests entries; a human approves before committing to the ledger.
4. Run `bean-check` after every ledger change and before every commit.
5. Show a diff for every ledger mutation. No silent changes.
6. Flag transactions at or above the configured large-transaction threshold for human confirmation.
7. Never modify reconciled transactions without explicit approval.
8. Always include tax treatment for transactions when applicable.
9. Commit every meaningful approved change via `/snapshot`.
10. During setup or onboarding, ask blocking intake questions when scope is unclear:
    personal vs business, country, entity type, province/state, and operating currency.
    Do not guess template-driving answers.
11. Do not require deterministic accounting classification, posting, or reporting as a product goal.
    CFO Stack may use non-deterministic, human-reviewed AI workflows for accounting decisions.

## Available Skills

### C — Capture
- `/capture` — Import from financial data sources
- `/statement-export` — Guided browser export for bank, card, brokerage, and platform statements
- `/capture-dedupe` — Fingerprint sources and suppress duplicate capture reruns
- `/doc-preprocess` — Normalize receipt photos and oversized PDFs before OCR/archive
- `/bank-import` — Smart CSV importer with format auto-detection
- `/receipt-scan` — OCR receipt photos, extract data, generate transactions

### L — Log
- `/log` — Transform raw data into structured Beancount entries
- `/classify` — AI-powered transaction categorization with learning
- `/validate` — Run `bean-check` plus custom validation rules

### E — Extract
- `/extract` — Analyze spending patterns, anomalies, and trends
- `/reconcile` — Match bank statements to ledger balances
- `/tax-plan` — Tax strategy, deductions, income splitting, and estimates

### A — Automate
- `/automate` — Generate reusable processing scripts and pipelines
- `/monthly-close` — Automated monthly close workflow
- `/quarterly-tax` — GST/HST, sales tax, and estimated tax filing prep

### R — Report
- `/report` — Financial statements: P&L, balance sheet, cash flow
- `/fava` — Launch Fava for visual ledger exploration
- `/advisor` — Financial health assessment, FIRE planning, net worth

### Meta
- `/setup` — Initialize a new Beancount ledger
- `/snapshot` — Commit ledger changes with meaningful messages and tags
- `/audit` — Comprehensive ledger validation and integrity check
- `/invoice` — Multi-region invoicing for CA, US, TW, CN, and EU
- `/careful` — Safety guardrails for financial data

## Process

The C.L.E.A.R. cycle: Capture → Log → Extract → Automate → Report

Monthly: `/capture` → `/classify` → `/reconcile` → `/report` → `/snapshot`
When files are not on disk yet: `/statement-export` → `/capture`
Quarterly: `/quarterly-tax` → `/tax-plan`
Year-end: `/audit` → `/report` → `/snapshot`

## Beancount Conventions

- Operating currencies: `CAD`, `USD` (configured per entity)
- Account hierarchy: `Assets:Bank:InstitutionName`, `Expenses:Category:Subcategory`
- Policy lookup: ledger-local `cfo-stack.yaml`, then global `~/.cfo-stack/config.yaml`
- Metadata tags: `classify: auto|confirmed|manual`, `receipt: path/to/file`, `receipt-ocr: path/to/processed/file`
- Balance assertions: required at every monthly close
- Recoverable sales tax: book to asset receivable accounts, not expense accounts

## File Layout

```text
ledger/
├── cfo-stack.yaml
├── capture/
│   └── statement-export.yaml
├── main.beancount
├── accounts.beancount
├── YYYY/
│   ├── MM-transactions.beancount
│   └── MM-reconciliation.beancount
├── prices.beancount
├── tax/
│   └── jurisdiction.yaml
└── rules/
    └── classify-rules.yaml
```
