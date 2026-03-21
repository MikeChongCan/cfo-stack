# SOP: Monthly Close

## Purpose

Close the month with reconciled balances, categorized transactions, archived
statements, and a signed close packet.

## Inputs

- [ ] Bank statements (PDF/CSV) for all accounts
- [ ] Credit card statements for all cards
- [ ] Receipt photos for the month
- [ ] Any manual entries or adjustments

## Procedure

### 1. Capture (C)

```
/capture
```

- Import all bank/credit card CSVs
- Scan receipt photos
- Verify: X transactions imported from Y files

### 2. Classify (L)

```
/classify
```

- Review AI classifications
- Correct any errors (AI learns)
- Verify: 0 uncategorized transactions remaining

### 3. Reconcile (E)

```
/reconcile
```

- Match each account to statement balance
- Resolve any discrepancies
- Verify: all accounts show delta = $0.00

### 4. Validate

```
/validate
```

- bean-check passes
- All balance assertions hold
- No flagged transactions

### 5. Report (R)

```
/report
```

- Review income statement
- Review balance sheet
- Note any concerns

### 6. Close

```
/snapshot
```

- Git commit: `close: YYYY-MM — all accounts reconciled`
- Git tag: `close/YYYY-MM`

## Outputs

- [ ] All accounts reconciled with balance assertions
- [ ] All transactions categorized with tax treatment
- [ ] All receipts archived and linked
- [ ] Close packet generated
- [ ] Git commit and tag applied

## Acceptance Criteria

- Every reconciled account has status PASS
- Every statement is archived and traceable
- bean-check passes with zero errors
- Close packet committed to repository
