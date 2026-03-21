# CFO Stack

### AI-Powered Finance Ops + Plain-Text Accounting

**Author:** Mike Chong ([realmikechong.com](https://realmikechong.com))

[繁體中文說明](README_ZH_HANT.md)

---

CFO Stack is an open-source, AI-powered accounting system built on [Beancount](https://github.com/beancount/beancount) and operated through Claude Code / Codex slash commands. It follows the **C.L.E.A.R.** framework to give solo founders, freelancers, and small businesses a virtual finance function — Bookkeeper, Controller, Tax Strategist, Auditor, and CFO — all as Markdown skills, all free.

> *"You have to know accounting. It's the language of practical business life. It was a very useful thing to deliver to civilization. I've heard it came to civilization through Venice which of course was once the great commercial power in the Mediterranean. However, double-entry bookkeeping was a hell of an invention."*
> — Charlie Munger

Inspired by [gstack](https://github.com/garrytan/gstack) (Garry Tan's "software factory" for Claude Code). Same philosophy, different domain: **accounting instead of engineering**.

---

## The C.L.E.A.R. System

Capture → Log → Extract → Automate → Report.

The detailed framework, skill map, and future tooling notes now live in the Docusaurus site under `./docs/`.

### Docs Site

```bash
cd docs
bun install
bun run start
```

---

## Quick Start

### 1. Install (30 seconds)

```bash
git clone https://github.com/MikeChongCan/cfo-stack.git ~/.claude/skills/cfo-stack
cd ~/.claude/skills/cfo-stack && ./setup
```

For Codex: `./setup --host codex` | For OpenClaw: `./setup --host openclaw` | For Antigravity: `./setup --host antigravity` | Auto-detect: `./setup --host auto`

Machine-level install remains the default. To keep setup scoped to one target project
instead of writing host registrations and default policy into your home directory, use:

```bash
./setup --scope project --project-dir /path/to/your/project --host codex
```

Project scope:

- keeps the Python environment and helper scripts in this CFO Stack repo
- registers Claude skills under the target project's `.claude/skills/`
- registers Codex, OpenClaw, and Antigravity skills under the target project's `.agents/skills/`
- skips creating `~/.cfo-stack/config.yaml`, so policy should live in the ledger-local `cfo-stack.yaml`

After setup, use the generated helpers for validation and Fava:

```bash
./bin/cfo-check
./bin/cfo-fava ./ledger/main.beancount 5000
./bin/cfo-dashboard ./ledger/main.beancount
```

Those helper paths are relative to the CFO Stack repo where you ran `./setup`.
If you installed in project scope for some other target project, run the helpers
from this repo's `bin/` with either an absolute ledger path or from inside the
target project so ledger auto-discovery still works.

OpenClaw setup uses its shared local skills directory, `~/.openclaw/skills`, so you
can clone this repo anywhere and still register the skills with `./setup --host openclaw`.

Antigravity setup uses its documented global skills directory, `~/.gemini/antigravity/skills`.
That keeps CFO Stack available across workspaces without requiring you to vendor the repo
into each project's `.agents/skills/`.

To unregister skills later:

```bash
./uninstall --host auto
```

Project-scoped uninstall uses the same target:

```bash
./uninstall --scope project --project-dir /path/to/your/project --host auto
```

Optional cleanup flags:

- `./uninstall --host auto --remove-local-tools`
- `./uninstall --host auto --remove-state`

### Included Samples

- `examples/canadian-company/` — incorporated Canadian service business
- `examples/usa-company/` — US solo consulting business
- `examples/canadian-individual/` — salaried Canadian individual ledger
- `examples/canadian-family/` — Canadian household ledger
- `examples/usa-individual/` — salaried US individual ledger
- `examples/usa-family/` — US household ledger

The two company examples also include `capture/statement-export.yaml` so you can see how
to declare institutions and ledger-account mappings for browser-assisted exports.

### Jurisdiction Pack Schema

`tax/jurisdiction.yaml` files are governed by:

`schemas/jurisdiction.schema.json`

Each template and example pack includes a YAML schema comment pointing at:

`https://raw.githubusercontent.com/MikeChongCan/cfo-stack/main/schemas/jurisdiction.schema.json`

That gives editor validation and a stable contract for LLM workflows.
Generated `tax/` review packets are intentionally tracked by default so the filing
workflow keeps an audit trail.

### Policy Config Schema

Large-transaction review thresholds live in:

- Ledger-local `cfo-stack.yaml`
- Global `~/.cfo-stack/config.yaml` seeded by `./setup`

Those files are governed by:

`schemas/policy.schema.json`

The default install-time threshold is `$1,000` in the ledger operating currency.
Override it per ledger when a client needs a different review bar.

### Statement Export Profile Schema

Optional human-in-the-loop export plans live in:

- Ledger-local `capture/statement-export.yaml`
- Shared starter template `templates/shared/statement-export.yaml`

Those files are governed by:

`schemas/statement-export.schema.json`

Each file should keep the YAML schema comment that points at:

`https://raw.githubusercontent.com/MikeChongCan/cfo-stack/main/schemas/statement-export.schema.json`

Use this config to declare institutions such as TD, BMO, Chase, Cheese, Wealthsimple,
IBKR, Wise, or other portals, then let `/statement-export` guide the human through login,
account/date confirmation, and CSV/PDF download.

The statement download pattern is intentionally LLM-driven and human-in-the-loop.
This repo does not depend on deterministic bank-site scripts. The repo-local skill
`./.agents/skills/cfo-playwright-download-statements/SKILL.md` is the preferred pattern
for Playwright-assisted navigation, official-domain web search, and download guidance.

### 2. Set up your ledger

```
/setup
```

Describe your business. CFO Stack creates your chart of accounts, initial Beancount ledger, and git repo.
It should also create a ledger-local `cfo-stack.yaml` so review thresholds and other
policy knobs are part of the ledger, not buried in agent prose.

### 3. Get your raw files onto disk

If you already exported files manually, drop bank CSVs into `~/Downloads/`, and put
receipt photos / invoice PDFs in your capture folders.

If you have declared accounts and want guided browser-based export instead of bank APIs,
use:

```text
/statement-export
```

That workflow is human-in-the-loop: Chrome-family browser, dedicated reusable profile,
manual login/MFA, agent-guided navigation, and raw CSV/PDF downloads preserved for archive.
When the correct login or export page is unclear, the agent should use web search against
official institution domains before navigating.

Then run:

```
/capture
```

`/capture` now routes receipt photos through document preprocessing first, fingerprints candidate sources before staging, prefers bounded-size WebP derivatives for image receipts, and only creates compressed PDF derivatives when that materially helps OCR or storage.

### 4. Classify transactions

```
/classify
```

AI proposes classifications and tax treatment diffs. You approve the patch, then it learns.

### 5. See your finances

```
/report
```

Income statement, balance sheet, cash flow — your complete financial picture.

For a shareable browser artifact instead of terminal-first reporting:

```bash
./bin/cfo-dashboard ./ledger/main.beancount
./bin/cfo-dashboard ./ledger/main.beancount --variant social --output reports/social-share
```

If your ledger lives in another project, invoke `cfo-dashboard` from the CFO Stack
repo's `bin/` with that ledger path explicitly.

This generates static HTML, CSS, and JSON in `reports/`, using `bean-query` only. Generated dashboards stay ignored by git.
The docs demo page also embeds the full sample set from `examples/`: US and Canadian company, individual, and family ledgers.
Use `--variant social` for a share-safe graph-first version that redacts values and omits the raw JSON export.

---

## All 24 Skills

### C — Capture

| Skill | Role | What It Does |
|---|---|---|
| `/capture` | Data Clerk | Inventory local files and route them into import/OCR flows |
| `/statement-export` | Export Clerk | Guided Chrome + Playwright export for bank, card, brokerage, and platform statements |
| `/capture-dedupe` | Import Provenance Clerk | Prevent duplicate imports across repeated capture runs |
| `/doc-preprocess` | Document Prep Clerk | Normalize receipt photos and oversized PDFs before OCR/archive |
| `/bank-import` | Bank Specialist | Smart CSV import with format auto-detection and PDF archive pairing |
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
| `/report-dashboard` | Design-forward CFO | Beautiful static HTML dashboards from deterministic Beancount extracts |
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

## Monthly Close with Optional Export

```
/statement-export  # Optional: guided export when files are not on disk yet
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

## CFO Stack vs Traditional CPA

| | Traditional CPA | CFO Stack |
|---|---|---|
| **Cost** | $3,000-$10,000/year | Free (MIT) |
| **Speed** | Days to weeks | Seconds to minutes |
| **Auditability** | Trust the CPA | Git log — verify everything |
| **Availability** | Business hours | 24/7 |
| **Tax planning** | Reactive (year-end) | Proactive (continuous) |
| **Multi-region** | Extra fees per jurisdiction | Built-in (CA, US, TW, CN) |
| **Data ownership** | Locked in proprietary software | Plain text you own forever |
| **Learning** | Doesn't learn your patterns | Gets smarter with every correction |

**Important:** CFO Stack replaces the repetitive operational accounting work that usually creates CPA overhead. For complex situations (audits, litigation, estate planning, reorganizations), you still want a licensed professional.

---

## Who This Is For

- Solo founders and freelancers who want to own their books
- Small businesses ($30K-$500K revenue) currently overpaying for basic CPA services
- Developers who do their own taxes and want git-controlled financial records
- FIRE enthusiasts who want deep visibility into their financial picture

---

## Prerequisites

- Python 3 + uv
- Current packaged dependencies install on Python 3.10+
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
