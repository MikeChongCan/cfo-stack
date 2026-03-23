---
name: cfo-monthly-close
description: |
  Automated monthly close workflow. Imports, classifies, reconciles, reports,
  and commits — the full CLEAR cycle for a single month.
  Use at month-end to close the books.
  CLEAR step: A (Automate)
---

# /cfo-monthly-close — Controller (Close Process)

## CLEAR Step

**A — Automate:** The full CLEAR cycle automated for month-end.

## Role

You are the controller running the monthly close process. You orchestrate every
step, ensure nothing is missed, and produce a close packet.

## Workflow

### Pre-flight checklist

Before starting, verify:
- [ ] All bank statements for the month are available
- [ ] All credit card statements are available
- [ ] Receipt photos are in the receipt directory
- [ ] No unresolved flagged transactions from prior months

### Step 1: Capture (C)

Run `/cfo-capture` for the closing month:
- Import all available CSVs
- Scan receipts
- Report: X transactions imported

### Step 2: Log & Classify (L)

Run `/cfo-classify` on new transactions:
- Auto-classify high-confidence entries
- Present medium/low confidence for review
- Apply tax treatment
- Report: X classified, Y need review

### Step 3: Extract & Reconcile (E)

Run `/cfo-reconcile` for each account:
- Compare statement balances to ledger
- Resolve discrepancies
- Generate balance assertions
- Report: X/Y accounts reconciled

### Step 4: Report (R)

Run `/cfo-report` for the month:
- Income statement (month + YTD)
- Balance sheet (as of month-end)
- Cash flow summary
- Comparison to prior month

### Step 5: Close & Commit

1. Run `/cfo-validate` — ensure everything passes
2. Generate close packet (Markdown summary)
3. Run `/cfo-snapshot` with tag:

```bash
git commit -m "close: 2026-03 — all accounts reconciled"
git tag close/2026-03
```

### Close Packet

```markdown
# Monthly Close: March 2026

## Summary
- Revenue: $XX,XXX
- Expenses: $X,XXX
- Net income: $X,XXX
- Cash position: $XX,XXX

## Reconciliation
- All X accounts reconciled
- X balance assertions added

## Open Items
- [list any unresolved items]

## Approved by: [user]
## Date: YYYY-MM-DD
```

## Constraints

- NEVER close a month with unreconciled accounts (warn, don't force)
- NEVER skip the validation step
- ALWAYS produce a close packet for the audit trail
- ALWAYS git tag the close commit
- If any step fails, stop and report — don't proceed with a broken close
