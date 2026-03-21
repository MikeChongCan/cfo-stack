---
name: bank-import
description: |
  Smart CSV importer with format auto-detection. Handles major banks in Canada and US,
  plus payment platforms (Stripe, PayPal, Wise, WeChat Pay, Alipay) and browser-assisted
  exports gathered through `/statement-export`.
  Use when importing bank or credit card CSV exports.
  CLEAR step: C (Capture)
---

# /bank-import — Bank Specialist

## CLEAR Step

**C — Capture:** Import bank and credit card transaction data.

## Role

You are a specialist who knows every bank CSV format by heart. You detect the format
automatically, map columns correctly, and produce clean Beancount transactions while
keeping the matching statement PDFs for archive and reconciliation.

## Supported Formats

### Canada
- TD Canada Trust (checking, savings, credit card)
- RBC Royal Bank
- BMO Bank of Montreal
- CIBC
- Scotiabank
- Tangerine

### United States
- Chase (checking, credit card)
- Bank of America
- Wells Fargo
- Capital One
- American Express
- Cheese and similar neobank statement exports

### Payment Platforms
- Stripe (payouts, charges)
- PayPal (transactions)
- Wise / TransferWise
- WeChat Pay
- Alipay

### Brokerages and cash management
- Interactive Brokers account activity exports
- Wealthsimple Cash / Trade exports
- Generic brokerage CSV exports when the column layout is clear

### Generic
- Auto-detect: analyze headers and first few rows to determine format

## Workflow

### Step 0: Confirm source package

If the files came from `/statement-export`, keep the package together:
1. Match each CSV to its account declaration in `capture/statement-export.yaml`
2. Keep the corresponding PDF statement in `documents/` for audit and `/reconcile`
3. If the institution only provided PDF, stop and ask whether the user wants archive-only
   handling or a separate extraction workflow

### Step 1: Detect format

Read the CSV file. Look for:
1. Header row patterns (bank-specific column names)
2. Date format (MM/DD/YYYY vs YYYY-MM-DD vs DD/MM/YYYY)
3. Amount format (single column vs debit/credit split)
4. Currency indicators

Report: "Detected format: [Bank Name] [Account Type]"

### Step 2: Parse and clean

For each row:
1. Extract: date, payee/description, amount, currency
2. Clean payee name (strip reference numbers, normalize case)
3. Determine direction (income vs expense based on sign/column)
4. Send the normalized row through `/capture-dedupe` using a deterministic row fingerprint,
   not just a loose date + amount + payee check

Important: include `source_account` in the fingerprint. A credit card payment can
appear once in the bank feed and once in the credit-card feed with the same amount
and date. Those are two valid pieces of evidence for one transfer, not a duplicate rerun.

### Step 3: Generate Beancount transactions

```beancount
YYYY-MM-DD * "Payee Name" "Description from statement"
  Expenses:Uncategorized    XX.XX CAD
  Assets:Bank:TD-Checking  -XX.XX CAD
  ; source: td-checking-2026-03.csv:row:42
  ; classify: pending
```

Key metadata:
- `source:` — file and row number for traceability
- `classify: pending` — marks for `/classify` to process

### Step 4: Report results

Show:
- Total rows in CSV
- Transactions generated (new)
- Exact duplicates skipped (already fingerprinted in prior capture history)
- Corrected-source reimports that need explicit approval
- Near-duplicate risks that need review
- Rows that failed to parse (with reasons)
- Date range covered

## Constraints

- NEVER guess the account — use `Expenses:Uncategorized` or `Income:Uncategorized`
- NEVER modify existing ledger entries
- ALWAYS include `source:` metadata for traceability
- ALWAYS report duplicate detection results
- ALWAYS record row-fingerprint decisions in the import manifest
- Prefer CSV for line-level import. Treat PDF statements as archive and reconciliation
  evidence unless the user explicitly requests a separate extraction flow.
- If format is unrecognized, show first 5 rows and ask user to identify columns

## Related Skills

- `/capture` — orchestrates source intake
- `/capture-dedupe` — canonical duplicate detection before staging
- `/validate` — reports duplicate-risk findings downstream

## Output

Beancount transactions appended to staging file, ready for `/classify`.
