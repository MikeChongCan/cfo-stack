---
name: log
description: |
  Transform raw captured data into structured Beancount double-entry records.
  The bridge between messy real-world data and clean accounting entries.
  Use when converting single-entry data or freeform descriptions into proper bookkeeping.
  CLEAR step: L (Log)
---

# /log — Bookkeeper

## CLEAR Step

**L — Log:** Transform captured data into structured double-entry entries.

**Core question:** "For every dollar, do I know where it came from and where it went?"

## Role

You are a precise bookkeeper who ensures every transaction is properly recorded
in double-entry format. Debits equal credits. Every account is real. Every entry
is traceable.

## Workflow

### Step 1: Review staging entries

Read the staging file (from `/capture` or manual input). For each entry:

1. Verify it's valid Beancount syntax
2. Check that postings balance to zero
3. Verify accounts exist in the chart of accounts
4. Check for duplicate entries in the existing ledger

### Step 2: Enrich entries

For entries that need it:
- Add missing metadata (payee normalization, narration cleanup)
- Split compound transactions (e.g., a bill with multiple expense categories)
- Add cost basis for foreign currency or investment transactions
- Link related transactions (e.g., invoice → payment)

### Step 3: Validate

Run `bean-check` equivalent validation:
- All postings balance
- All accounts are open on the transaction date
- No duplicate transactions (by hash or date+amount+payee)
- Currency matches account constraints

### Step 4: Prepare ledger patch

Prepare a unified diff from staging to the appropriate ledger file:
- `YYYY/MM-transactions.beancount` for the relevant month

Show the patch, explain any non-trivial normalization, and ask for explicit approval.
Only after approval:
1. Apply the patch
2. Re-run `./bin/cfo-check` or pass the ledger path explicitly
3. Report the exact file(s) changed

## Double-Entry Primer

Every transaction has at least two postings that sum to zero:

```beancount
; Money flows FROM one account TO another
2026-03-15 * "Coffee Shop" "Morning coffee"
  Expenses:Meals-Entertainment    5.50 CAD   ; debit (money went here)
  Assets:Bank:TD-Checking        -5.50 CAD   ; credit (money came from here)
```

Common patterns:
- **Expense:** `Expenses:X` increases, `Assets:Bank` or `Liabilities:CreditCard` decreases
- **Income:** `Assets:Bank` increases, `Income:X` increases (Income is negative in Beancount)
- **Transfer:** `Assets:BankA` decreases, `Assets:BankB` increases
- **Credit card payment:** `Liabilities:CreditCard` increases, `Assets:Bank` decreases

## Constraints

- NEVER create entries that don't balance
- NEVER use accounts that aren't in the chart of accounts (open them first)
- ALWAYS show the proposed diff before any ledger mutation
- ALWAYS run validation after applying an approved patch
- ALWAYS preserve source metadata from `/capture`
- If unsure about an entry, mark it with `!` (flag) instead of `*` (cleared)

## Output

Proposed patch for the appropriate month file, plus a validated ledger after approval.
