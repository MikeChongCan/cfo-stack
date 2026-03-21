---
name: report-dashboard
description: |
  Generate beautiful HTML dashboards from a Beancount ledger without using an LLM.
  Uses Bun + TypeScript + React + Tailwind to render business or household dashboards
  from `bean-query` data, including balance sheet, cash flow, net worth, and recent activity.
  Use when you want a shareable dashboard artifact instead of Markdown-only statements.
  CLEAR step: R (Report)
---

# /report-dashboard — Deterministic HTML Dashboards

## When to use

- You want a polished dashboard artifact that can be opened in a browser or shared with an advisor.
- You need a non-LLM reporting path from a valid `main.beancount` file.
- You want a business dashboard for statements and working-capital context.
- You want a household dashboard for net worth, spending, and cash flow context.

## Core workflow

1. Resolve the ledger path.
   Priority: explicit argument, `./main.beancount`, `./ledger/main.beancount`, then the first `main.beancount` found recursively.
2. Run `bean-query` to extract structured balances, monthly account movements, and posting activity.
3. Infer `business` or `household` profile unless the user forces it.
4. Render a static HTML dashboard with Bun + TypeScript + React + Tailwind v4.
5. Save the artifact to an output directory and keep the raw JSON export beside it for auditability.

## Commands

From the repo root, after `./setup`:

```bash
./bin/cfo-dashboard examples/canadian-company/main.beancount
./bin/cfo-dashboard examples/canadian-family/main.beancount --profile household
./bin/cfo-dashboard examples/usa-company/main.beancount --variant social --output reports/social-share/usa-company
./bin/cfo-dashboard --sample-set all
```

Direct Bun usage:

```bash
cd skills/report-dashboard/scripts
bun install
bun run generate -- --ledger ../../../examples/usa-company/main.beancount
```

## Outputs

- `index.html` — standalone dashboard shell
- `dashboard.css` — compiled Tailwind stylesheet
- `dashboard-data.json` — extracted structured data for traceability
- Social variant: `--variant social` emits a share-safe HTML view and intentionally omits raw JSON output.

## Constraints

- Never invent numbers. Every figure must come from `bean-query` output.
- Treat cash flow as a deterministic direct-method summary based on cash-account transactions and transparent account heuristics.
- Keep generated artifacts out of git. Use ignored output paths such as `reports/` or `dashboard-output/`.
- Run `bean-check` before relying on the dashboard.

## Implementation notes

- Tooling lives in `scripts/`.
- Use `bun run check` for type safety.
- If the UI needs polishing, prefer reviewing `scripts/src/render.tsx` and `scripts/src/styles.css`.
