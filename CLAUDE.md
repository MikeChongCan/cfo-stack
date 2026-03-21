# cpa-stack

AI-powered accounting, bookkeeping, and tax planning using the C.L.E.A.R. system and Beancount.

**Author:** Mike Chong (realmikechong.com)

## Available Skills

### C — Capture
- `/capture` — Import from all financial data sources
- `/bank-import` — Smart CSV importer with format auto-detection
- `/receipt-scan` — OCR receipt photos, extract data, generate transactions

### L — Log
- `/log` — Transform raw data into structured Beancount entries
- `/classify` — AI-powered transaction categorization with learning
- `/validate` — Run bean-check + custom validation rules

### E — Extract
- `/extract` — AI analysis: spending patterns, anomalies, trends
- `/reconcile` — Match bank statements to ledger balances
- `/tax-plan` — Tax strategy: deductions, income splitting, estimates

### A — Automate
- `/automate` — Generate reusable processing scripts/pipelines
- `/monthly-close` — Automated monthly close workflow
- `/quarterly-tax` — GST/HST, sales tax, estimated tax filing prep

### R — Report
- `/report` — Financial statements: P&L, Balance Sheet, Cash Flow
- `/fava` — Launch Fava web UI for visual exploration
- `/advisor` — Financial health assessment, FIRE planning, net worth

### Meta
- `/setup` — Initialize a new Beancount ledger from scratch
- `/snapshot` — Git commit ledger with meaningful messages and tags
- `/audit` — Comprehensive ledger validation and integrity check
- `/invoice` — Multi-region invoicing (CA, US, TW, CN, EU)
- `/careful` — Safety guardrails for financial data

## Process

The CLEAR cycle: **Capture → Log → Extract → Automate → Report**

Monthly: `/capture` → `/classify` → `/reconcile` → `/report` → `/snapshot`
Quarterly: `/quarterly-tax` → `/tax-plan`
Year-end: `/audit` → `/report` → `/snapshot`

## Constraints

All financial operations MUST:

1. **Write valid Beancount syntax.** Run `bean-check` after every ledger change.
2. **Never modify reconciled transactions** without `/careful` confirmation.
3. **Always include tax treatment** for transactions (GST/HST, sales tax, etc.).
4. **Git commit after every meaningful change** via `/snapshot`.
5. **Flag any transaction over $1,000** for human confirmation.
6. **Never invent tax rules.** Only compute from provided jurisdiction packs.
7. **Never claim compliance.** CPA Stack produces traceable data packets — a licensed professional confirms compliance.
8. **Proposal-only for AI-generated entries.** AI suggests, human approves. No silent ledger mutations.

## Beancount Conventions

- Operating currencies: CAD, USD (configured per entity)
- Account hierarchy: `Assets:Bank:InstitutionName`, `Expenses:Category:Subcategory`
- Metadata tags: `; classify: auto|confirmed|manual`, `; receipt: path/to/file`
- Balance assertions: required at every monthly close
- Recoverable sales tax: book to asset receivable accounts, not expense accounts

## File Layout

```
ledger/
├── main.beancount          # Master file with includes
├── accounts.beancount      # Chart of accounts
├── YYYY/                   # Year directories
│   ├── MM-transactions.beancount
│   └── MM-reconciliation.beancount
├── prices.beancount        # Market prices
├── tax/
│   └── jurisdiction.yaml   # User-provided filing rules and rates
└── rules/
    └── classify-rules.yaml # Payee → account mappings
```
