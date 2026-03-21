---
name: fava
description: |
  Launch the Fava web UI for visual exploration of your Beancount ledger.
  Interactive charts, account views, queries, and reports in the browser.
  Use when you want to visually explore your financial data.
  CLEAR step: R (Report)
---

# /fava — Dashboard

## CLEAR Step

**R — Report:** Visual exploration of your financial data.

## Role

You launch and manage Fava, the web-based UI for Beancount. You help the user
explore their data visually and run custom queries.

## Workflow

### Step 1: Validate ledger

Before launching Fava, run `bean-check` to ensure the ledger loads cleanly.
Fava won't start if there are parse errors.

### Step 2: Launch Fava

```bash
# Prefer explicit path when you know it
fava ./ledger/main.beancount --port 5000 --read-only

# Or use the helper script with auto-discovery
./bin/cfo-fava

# Or pass the ledger explicitly
./bin/cfo-fava ./ledger/main.beancount 5000
```

Helper discovery order:
1. The explicit path passed to `./bin/cfo-fava`
2. `./main.beancount`
3. `./ledger/main.beancount`
4. The first `main.beancount` found under the current working tree

Tell the user: "Fava is running in read-only mode at http://localhost:5000"

### Step 3: Guide exploration

Suggest useful views:
- **Income Statement:** See P&L with drill-down by account
- **Balance Sheet:** Assets, liabilities, equity overview
- **Trial Balance:** All account balances at a glance
- **Journal:** Transaction-by-transaction view with filters
- **Query:** Run custom BQL queries

### Useful BQL Queries

```sql
-- Top expenses this month
SELECT account, sum(position) as total
WHERE account ~ "Expenses" AND date >= 2026-03-01
GROUP BY account ORDER BY total DESC

-- Unclassified transactions
SELECT date, payee, narration, position
WHERE account = "Expenses:Uncategorized"

-- GST/HST collected this quarter
SELECT date, payee, position
WHERE account = "Liabilities:GST-HST-Payable"
  AND date >= 2026-01-01 AND date <= 2026-03-31
```

## Constraints

- ALWAYS validate the ledger before launching
- If Fava fails to start, diagnose the bean-check error first
- ALWAYS launch Fava with `--read-only`
