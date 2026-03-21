# CFO Stack — Master Plan

**Author:** Mike Chong (realmikechong.com)
**Date:** March 2026
**License:** MIT

---

## Vision

CFO Stack is an open-source, AI-powered accounting system that replaces most of the repetitive accounting operations small businesses overpay for. It is built on Beancount (plain-text double-entry accounting) and operated through Claude Code / Codex slash commands.

**Inspired by [gstack](https://github.com/garrytan/gstack)** — Garry Tan's "software factory" that turns Claude Code into a virtual engineering team. CFO Stack applies the same philosophy to accounting and finance operations: instead of a virtual eng team, you get a **virtual finance function**.

---

## The C.L.E.A.R. System

This is the skeleton of the entire system. Each skill group completes one step of CLEAR.

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

### Core Questions

| Step | Question |
|------|----------|
| **C** | Where is every piece of evidence of my money right now? |
| **L** | For every dollar, do I know where it came from and where it went? |
| **E** | What are these numbers telling me? What should I do? |
| **A** | Have I done this more than 3 times? Can a machine do it instead? |
| **R** | Can I describe my current financial health in one paragraph? |

---

## Skills Architecture

### CLEAR → Skills Mapping

```
C — Capture
├── /capture        Master orchestrator: import from all sources
├── /doc-preprocess Normalize receipt photos and oversized PDFs before OCR
├── /bank-import    CSV import with format auto-detection (TD, RBC, BMO, Chase, BoA...)
└── /receipt-scan   OCR receipt photos, generate Beancount transactions

L — Log
├── /log            Transform raw data into Beancount entries
├── /classify       AI-powered categorization with learning
└── /validate       Run bean-check + custom validation rules

E — Extract
├── /extract        AI analysis: spending patterns, anomalies, trends
├── /reconcile      Match bank statements to ledger balances
└── /tax-plan       Tax strategy: deductions, income splitting, quarterly estimates

A — Automate
├── /automate       Generate reusable processing scripts/pipelines
├── /monthly-close  Automated monthly close workflow
└── /quarterly-tax  GST/HST, sales tax, estimated tax filing prep

R — Report
├── /report         Financial statements: P&L, Balance Sheet, Cash Flow
├── /fava           Launch Fava web UI for visual exploration
└── /advisor        Financial health, FIRE planning, net worth tracking

Meta
├── /setup          Initialize new ledger: chart of accounts, Beancount config
├── /snapshot       Git commit ledger with meaningful messages & tags
├── /audit          Comprehensive ledger validation & integrity check
├── /invoice        Multi-region invoicing (CA, US, TW, CN, EU)
└── /careful        Safety guardrails for financial data (inherited from gstack)
```

### Specialist Roles

Each skill embodies a specialist — the same pattern as gstack's "roles, not prompts."

| Skill | Specialist | CLEAR Step |
|---|---|---|
| `/capture` | **Data Clerk** — imports everything | C |
| `/doc-preprocess` | **Document Prep Clerk** — normalize source documents | C |
| `/bank-import` | **Bank Specialist** — knows CSV formats | C |
| `/receipt-scan` | **Receipt Clerk** — OCR + data extraction | C |
| `/log` | **Bookkeeper** — structured double-entry | L |
| `/classify` | **Staff Accountant** — categorization + tax treatment | L |
| `/validate` | **Quality Control** — ledger integrity | L |
| `/extract` | **Data Analyst** — patterns and anomalies | E |
| `/reconcile` | **Controller** — match reality to records | E |
| `/tax-plan` | **Tax Strategist** — proactive planning | E |
| `/automate` | **DevOps** — scripts and pipelines | A |
| `/monthly-close` | **Controller** — period close process | A |
| `/quarterly-tax` | **Tax Preparer** — filing prep | A |
| `/report` | **CFO** — financial statements | R |
| `/fava` | **Dashboard** — visual exploration | R |
| `/advisor` | **Financial Advisor** — health + planning | R |
| `/setup` | **Onboarding** — new entity setup | Meta |
| `/snapshot` | **Archivist** — git versioning | Meta |
| `/audit` | **Internal Auditor** — comprehensive check | Meta |
| `/invoice` | **Billing Clerk** — multi-region invoices | Meta |
| `/careful` | **Safety Officer** — guardrails | Meta |

---

## Technical Architecture

### Stack

```
┌─────────────────────────────────────────────────┐
│            Claude Code / Codex / Gemini          │
│         (AI agent executing skills)              │
├─────────────────────────────────────────────────┤
│          CFO Stack Skills (Markdown)             │
│  /capture /log /extract /automate /report ...    │
├─────────────────────────────────────────────────┤
│            Beancount v3 (Core Engine)            │
│  Plain-text double-entry · Python API · BQL      │
├──────────────┬──────────────────────────────────┤
│   Fava (UI)  │       Python Scripts              │
│  Web reports │  Importers · Classifiers · Tax    │
├──────────────┴──────────────────────────────────┤
│               Git (Version Control)              │
│  Every change tracked · Full audit trail         │
├─────────────────────────────────────────────────┤
│             File System (Data Layer)             │
│  *.beancount  *.csv  *.pdf  receipts/            │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions (borrowed from gstack)

| gstack Pattern | CFO Stack Equivalent |
|---|---|
| Skills live in `~/.claude/skills/` or `.claude/skills/` | Same |
| Each skill = folder with `SKILL.md` | Same |
| Unified `AGENTS.md` registers skills | Same |
| `setup` script handles install | Same — plus pip deps for Beancount |
| Supports Claude Code + Codex + auto | Same |
| `VERSION` file for upgrade tracking | Same |
| Preamble block for session management | Same |
| Safety skills (/careful, /freeze) | `/careful` adapted for financial data |

### What's Different from gstack

| Aspect | gstack | CFO Stack |
|---|---|---|
| Core executable | Compiled browse CLI (Bun + Playwright) | None — Python scripts only |
| Build step | `bun build --compile` | `uv venv` + `uv pip install` |
| Domain | Software engineering | Accounting / tax / finance |
| Risk level | Code bugs | Financial errors, tax liability |
| Primary language | TypeScript | Markdown + Python |
| Data sensitivity | Code (moderate) | Financial records (high) |
| Language | English | English |

---

## Directory Structure

```
cfo-stack/
├── AGENTS.md                      # Canonical agent instructions
├── CLAUDE.md                      # Symlink to AGENTS.md
├── GEMINI.md                      # Symlink to AGENTS.md
├── README.md                      # Project overview + quick start
├── PLAN.md                        # This file — master plan
├── ARCHITECTURE.md                # Technical decisions (future)
├── VERSION                        # Version tracking
├── LICENSE                        # MIT
├── setup                          # One-command install
│
├── skills/                        # Slash-command skills (the core)
│   ├── capture/SKILL.md           # C — /capture
│   ├── doc-preprocess/SKILL.md    # C — /doc-preprocess
│   ├── bank-import/SKILL.md       # C — /bank-import
│   ├── receipt-scan/SKILL.md      # C — /receipt-scan
│   ├── log/SKILL.md               # L — /log
│   ├── classify/SKILL.md          # L — /classify
│   ├── validate/SKILL.md          # L — /validate
│   ├── extract/SKILL.md           # E — /extract
│   ├── reconcile/SKILL.md         # E — /reconcile
│   ├── tax-plan/SKILL.md          # E — /tax-plan
│   ├── automate/SKILL.md          # A — /automate
│   ├── monthly-close/SKILL.md     # A — /monthly-close
│   ├── quarterly-tax/SKILL.md     # A — /quarterly-tax
│   ├── report/SKILL.md            # R — /report
│   ├── fava/SKILL.md              # R — /fava
│   ├── advisor/SKILL.md           # R — /advisor
│   ├── setup/SKILL.md             # Meta — /setup
│   ├── snapshot/SKILL.md          # Meta — /snapshot
│   ├── audit/SKILL.md             # Meta — /audit
│   ├── invoice/SKILL.md           # Meta — /invoice
│   └── careful/SKILL.md           # Meta — /careful
│
├── importers/                     # Beancount CSV importers (Python)
│   ├── __init__.py
│   ├── td_bank.py                 # TD Canada Trust
│   ├── rbc.py                     # Royal Bank of Canada
│   ├── chase.py                   # JPMorgan Chase
│   ├── wise.py                    # Wise (TransferWise)
│   ├── stripe.py                  # Stripe payouts
│   ├── wechat_pay.py              # WeChat Pay
│   ├── alipay.py                  # Alipay
│   └── generic_csv.py             # Auto-detect format
│
├── plugins/                       # Beancount plugins
│   ├── gst_hst.py                 # Auto-calculate GST/HST
│   ├── sales_tax.py               # US state sales tax
│   ├── smart_classify.py          # AI-powered classification
│   └── tax_lots.py                # Capital gains (ACB for CA / FIFO for US)
│
├── templates/                     # Starting ledger templates
│   ├── canada-corp/               # Canadian corporation
│   ├── canada-sole-prop/          # Canadian sole proprietorship
│   ├── us-llc/                    # US LLC
│   └── us-freelancer/             # US freelancer (Schedule C)
│
├── sops/                          # Standard Operating Procedures
│   ├── monthly-close.md
│   ├── quarterly-gst.md
│   ├── year-end-close.md
│   └── receipt-management.md
│
├── docs/                          # Docusaurus documentation site
│   ├── content/                   # MDX docs content
│   │   ├── intro.mdx
│   │   ├── framework/
│   │   ├── reference/
│   │   └── roadmap/
│   ├── src/                       # TS/TSX components and theme code
│   ├── static/
│   ├── docusaurus.config.ts
│   └── sidebars.ts
│
├── bin/                           # Helper scripts
│   ├── cfo-check                  # Wrapper: bean-check + custom rules
│   └── cfo-fava                   # Wrapper: launch Fava
│
└── tests/                         # Test suite
    ├── fixtures/                  # Sample CSVs, receipts, ledgers
    └── test_importers/
```

---

## The Accounting Cycle (Process)

Just like gstack's sprint (Think → Plan → Build → Review → Test → Ship), CFO Stack follows the CLEAR cycle:

### Monthly Close

```
You:    /capture
        → imports all bank/credit card CSVs from ~/Downloads
        → OCRs receipt photos from ~/receipts/2026-03/
        → auto-generates 147 Beancount transactions

You:    /classify
        → AI categorizes each transaction
        → flags 12 transactions needing human review
        → you approve/correct — AI learns from corrections

You:    /reconcile
        → matches bank statements to ledger
        → all accounts balanced
        → generates balance assertions for March 2026

You:    /report
        → income statement: revenue $X, expenses $Y, net $Z
        → balance sheet: assets, liabilities, equity
        → comparison to prior month + YTD

You:    /snapshot
        → git commit: "2026-03 monthly close — all accounts reconciled"
```

### Quarterly Tax

```
You:    /quarterly-tax
        → GST collected: $X on $Y revenue
        → ITCs claimed: $Z on $W expenses
        → Net remittance: $N — due April 30
        → generates filing-ready data

You:    /tax-plan
        → YTD corporate income: $X
        → projected annual tax: $Y
        → RECOMMENDATIONS:
        →   1. Prepay $Z to reduce Q2 taxable income
        →   2. RRSP room: contribute $W before deadline
        →   3. Consider salary vs dividend split
```

---

## Installation

### Prerequisites

- Python 3 + uv
- Git
- Claude Code or Codex CLI

### Quick Start

```bash
# Clone into Claude Code skills directory
git clone https://github.com/MikeChongCan/cfo-stack.git ~/.claude/skills/cfo-stack
cd ~/.claude/skills/cfo-stack && ./setup

# Or for Codex
./setup --host codex

# Or auto-detect
./setup --host auto
```

The setup script:
1. Installs Python dependencies (beancount, fava, beangulp, beanquery)
2. Creates `~/.cfo-stack/` state directory
3. Symlinks skill subdirectories for Claude Code / Codex
4. Validates Beancount installation
5. Prints quick-start guide

---

## Phased Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Working Beancount ledger with basic import and classification.

- [x] Project scaffolding (directory structure, CLAUDE.md, setup script)
- [x] PLAN.md with CLEAR framework and skill architecture
- [x] Core skill SKILL.md files for all 20 skills
- [ ] `/setup` skill — initialize ledger with chart of accounts
- [ ] `/bank-import` skill — TD Bank and generic CSV importers
- [ ] `/classify` skill — AI-powered transaction categorization
- [ ] `/validate` skill — bean-check wrapper
- [ ] `/snapshot` skill — git commit workflow
- [ ] `/fava` skill — launch Fava
- [ ] Basic test fixtures

### Phase 2: Monthly Close (Weeks 3-4)

**Goal:** Complete monthly close workflow.

- [ ] `/capture` — orchestrates bank-import + receipt-scan
- [ ] `/receipt-scan` — OCR from receipt photos
- [ ] `/reconcile` — bank reconciliation with auto-matching
- [ ] `/report` — income statement, balance sheet, cash flow
- [ ] `/monthly-close` — full close automation
- [ ] Monthly close SOP
- [ ] More importers: RBC, BMO, Chase, Stripe, PayPal

### Phase 3: Tax Compliance (Weeks 5-8)

- [ ] GST/HST plugin + `/quarterly-tax` for Canada
- [ ] US estimated tax support
- [ ] `/tax-plan` — tax strategy with scenario modeling
- [ ] `/invoice` — multi-region invoicing
- [ ] Verified Canadian filing-code mappings
- [ ] Schedule C support for US freelancers

### Phase 4: Intelligence & Advisory (Weeks 9-12)

- [ ] `/extract` — spending pattern analysis, anomaly detection
- [ ] `/advisor` — FIRE planning, net worth tracking
- [ ] `/audit` — comprehensive ledger validation
- [ ] `/automate` — generate reusable scripts
- [ ] Year-end close SOP
- [ ] WeChat Pay / Alipay importers

### Phase 5: Community & Course (Ongoing)

- [ ] Course integration: each CLEAR step = a chapter
- [ ] More bank importers (community contributions)
- [ ] Multi-region invoice templates
- [ ] Expanded multilingual documentation
- [ ] Fava dashboard extensions

---

## Comparison: CFO Stack vs Traditional CPA

| | Traditional CPA | CFO Stack |
|---|---|---|
| **Cost** | $3,000-$10,000/year | Free (MIT) |
| **Turnaround** | Days to weeks | Seconds to minutes |
| **Auditability** | Trust the CPA | Git log — verify everything |
| **Availability** | Business hours | 24/7, instant |
| **Tax planning** | Reactive (year-end) | Proactive (continuous) |
| **Multi-region** | Extra fees per jurisdiction | Built-in (CA, US, TW, CN) |
| **Data ownership** | Locked in QuickBooks/Xero | Plain text files you own forever |
| **Learning** | They don't learn your patterns | Learns from every correction |

**Important:** CFO Stack does NOT replace a CPA for complex situations (litigation, CRA/IRS audits, reorganizations, estate planning). It replaces repetitive bookkeeping, standard compliance preparation, and routine finance operations.

---

## Licensing

CFO Stack itself: **MIT** — free forever.

Dependencies keep their own licenses. CFO Stack repository content is MIT-licensed.
