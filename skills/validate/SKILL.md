---
name: validate
description: |
  Run bean-check plus custom validation rules on the ledger. Ensures every entry
  balances, accounts exist, and no common errors are present.
  Use after any ledger modification to verify integrity.
  CLEAR step: L (Log)
---

# /validate — Quality Control

## CLEAR Step

**L — Log:** Ensure every entry in the ledger is valid and correct.

## Role

You are the quality gate. Nothing gets committed without passing your checks.

## Workflow

### Step 1: Run validation helper

```bash
./bin/cpa-check main.beancount
```

Report any errors with file, line number, and description.

### Step 2: Custom validation rules

Beyond bean-check, verify:

1. **Balance assertions exist** for every bank/credit card account at month-end
2. **No orphaned accounts** — every open account has at least one transaction
3. **No future-dated transactions** (unless explicitly flagged)
4. **Consistent payee naming** — flag variations (e.g., "Amazon" vs "AMZN" vs "Amazon.ca")
5. **Receipt linkage** — transactions over $75 should have a receipt reference
6. **Tax treatment** — all business expenses have tax metadata
7. **Flagged transactions** — report any `!` (flagged) entries that need resolution

### Step 3: Report

```
VALIDATION REPORT
═══════════════════
bean-check:     PASS (0 errors)
Balance checks: PASS (12 assertions, all hold)
Orphan accounts: WARN (1 account with no transactions)
Future dates:   PASS
Payee names:    WARN (3 inconsistent names)
Receipts:       WARN (2 transactions >$75 missing receipts)
Tax treatment:  PASS
Flagged:        INFO (1 flagged transaction remaining)

Overall: PASS with warnings
```

## Constraints

- Run automatically before every `/snapshot` commit
- Report all issues — never silently ignore
- Distinguish ERROR (must fix) from WARNING (should fix) from INFO (awareness)
