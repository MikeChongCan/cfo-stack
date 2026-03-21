# CPA Stack

### Replace Your CPA with AI + Plain-Text Accounting

**Author:** Mike Chong ([realmikechong.com](https://realmikechong.com)) / RockieStar Inc.

---

CPA Stack is an open-source, AI-powered accounting system built on [Beancount](https://github.com/beancount/beancount) and operated through Claude Code / Codex slash commands. It follows the **C.L.E.A.R.** framework to give solo founders, freelancers, and small businesses a virtual accounting firm — Bookkeeper, Controller, Tax Strategist, Auditor, and CFO — all as Markdown skills, all free.

Inspired by [gstack](https://github.com/garrytan/gstack) (Garry Tan's "software factory" for Claude Code). Same philosophy, different domain: accounting instead of engineering.

---

## The C.L.E.A.R. System

```
┌─────────────────────────────────────────────────────────┐
│                    C.L.E.A.R. SYSTEM                    │
├────────┬────────────────────────────────────────────────┤
│   C    │  Capture     Grab all raw financial data       │
│   L    │  Log         Single/double-entry booking       │
│   E    │  Extract     AI analysis → insights            │
│   A    │  Automate    Scripts + pipeline                 │
│   R    │  Report      Statements + full picture          │
└────────┴────────────────────────────────────────────────┘
```

Each letter maps to a set of slash commands. Run them in order for your monthly close, or individually as needed.

---

## Quick Start

### 1. Install (30 seconds)

```bash
git clone https://github.com/realmikechong/cpa-stack.git ~/.claude/skills/cpa-stack
cd ~/.claude/skills/cpa-stack && ./setup
```

For Codex: `./setup --host codex` | Auto-detect: `./setup --host auto`

After setup, use the generated helpers for validation and Fava:

```bash
./bin/cpa-check main.beancount
./bin/cpa-fava main.beancount 5000
```

### 2. Set up your ledger

```
/setup
```

Describe your business. CPA Stack creates your chart of accounts, initial Beancount ledger, and git repo.

### 3. Import your data

Drop bank CSVs into `~/Downloads/`, then:

```
/capture
```

### 4. Classify transactions

```
/classify
```

AI categorizes each transaction. Correct the ones it gets wrong — it learns.

### 5. See your finances

```
/report
```

Income statement, balance sheet, cash flow — your complete financial picture.

---

## All 20 Skills

### C — Capture

| Skill | Role | What It Does |
|---|---|---|
| `/capture` | Data Clerk | Import from all sources: bank CSVs, receipts, invoices |
| `/bank-import` | Bank Specialist | Smart CSV import with format auto-detection |
| `/receipt-scan` | Receipt Clerk | OCR receipt photos, generate transactions |

### L — Log

| Skill | Role | What It Does |
|---|---|---|
| `/log` | Bookkeeper | Transform raw data into Beancount double-entry |
| `/classify` | Staff Accountant | AI categorization with learning + tax treatment |
| `/validate` | Quality Control | bean-check + custom validation rules |

### E — Extract

| Skill | Role | What It Does |
|---|---|---|
| `/extract` | Data Analyst | Spending patterns, anomalies, trends |
| `/reconcile` | Controller | Match bank statements to ledger balances |
| `/tax-plan` | Tax Strategist | Deductions, income splitting, quarterly estimates |

### A — Automate

| Skill | Role | What It Does |
|---|---|---|
| `/automate` | DevOps | Generate reusable scripts/pipelines |
| `/monthly-close` | Controller | Full month-end close workflow |
| `/quarterly-tax` | Tax Preparer | GST/HST, sales tax, estimated tax prep |

### R — Report

| Skill | Role | What It Does |
|---|---|---|
| `/report` | CFO | P&L, Balance Sheet, Cash Flow, comparisons |
| `/fava` | Dashboard | Launch Fava web UI for visual exploration |
| `/advisor` | Financial Advisor | Net worth, FIRE planning, scenario modeling |

### Meta

| Skill | Role | What It Does |
|---|---|---|
| `/setup` | Onboarding | Initialize new ledger from scratch |
| `/snapshot` | Archivist | Git commit with meaningful messages + tags |
| `/audit` | Internal Auditor | Comprehensive ledger validation |
| `/invoice` | Billing Clerk | Multi-region invoicing (CA, US, TW, CN, EU) |
| `/careful` | Safety Officer | Guardrails for financial data |

---

## Monthly Close in 5 Commands

```
/capture          # Import all bank CSVs + receipts
/classify         # AI categorizes, you review
/reconcile        # Match to bank statements
/report           # See your P&L and balance sheet
/snapshot         # Git commit: "close: March 2026"
```

**Target: 30 minutes per month.** That's what `/automate` is for.

---

## Why Beancount?

1. **Plain text = git-friendly.** Every transaction is a line in a text file. Full audit trail for free.
2. **Strict validation.** Beancount refuses to load if things don't balance. Your CPA can't say the same.
3. **Python API.** Write custom importers, plugins, and tax calculators. AI agents read and write it natively.
4. **Fava web UI.** Beautiful charts, reports, and queries in the browser.
5. **AI-ready.** LLMs understand Beancount syntax better than any proprietary format.
6. **20-year durability.** Text files don't go bankrupt. QuickBooks might.

---

## CPA Stack vs Traditional CPA

| | Traditional CPA | CPA Stack |
|---|---|---|
| **Cost** | $3,000-$10,000/year | Free (MIT) |
| **Speed** | Days to weeks | Seconds to minutes |
| **Auditability** | Trust the CPA | Git log — verify everything |
| **Availability** | Business hours | 24/7 |
| **Tax planning** | Reactive (year-end) | Proactive (continuous) |
| **Multi-region** | Extra fees per jurisdiction | Built-in (CA, US, TW, CN) |
| **Data ownership** | Locked in proprietary software | Plain text you own forever |
| **Learning** | Doesn't learn your patterns | Gets smarter with every correction |

**Important:** CPA Stack replaces the 90% of CPA work that is repetitive. For complex situations (audits, litigation, estate planning, reorganizations), you still want a licensed professional.

---

## Who This Is For

- Solo founders and freelancers who want to own their books
- Small businesses ($30K-$500K revenue) currently overpaying for basic CPA services
- Developers who do their own taxes and want git-controlled financial records
- FIRE enthusiasts who want deep visibility into their financial picture

---

## Prerequisites

- Python 3.10+
- Git
- Claude Code, Codex CLI, or compatible AI agent

---

## Contributing

Fork it, improve it, make it yours. Priority contributions:

- Bank importers (especially Canadian and US banks)
- Tax rule packs for additional jurisdictions
- Multi-region invoice templates
- Beancount plugins for common tax scenarios

---

## License

MIT. Free forever. Go do your own books.
