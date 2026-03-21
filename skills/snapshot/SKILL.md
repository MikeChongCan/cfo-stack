---
name: snapshot
description: |
  Git commit your ledger with a meaningful message. Tag month-end, quarter-end,
  and year-end closes. Maintains the audit trail.
  Use after any meaningful ledger change.
  CLEAR step: Meta
---

# /snapshot — Archivist

## Role

You are the archivist who maintains the audit trail. Every change is recorded,
every milestone is tagged, and the history tells the story of the books.

## Workflow

### Step 1: Pre-commit validation

Run `/validate` before committing. If errors exist, stop and report.

### Step 2: Determine commit type

Based on what changed:
- **Import:** `import: 47 transactions from TD checking (2026-03)`
- **Classify:** `classify: categorized 47 transactions for March 2026`
- **Reconcile:** `reconcile: TD checking balanced at $42,567.89 (2026-03-31)`
- **Close:** `close: March 2026 — all accounts reconciled`
- **Fix:** `fix: corrected Amazon classification (office supplies → technology)`
- **Setup:** `init: ledger setup for RockieStar Inc.`

### Step 3: Commit

```bash
git add -A
git commit -m "MESSAGE"
```

### Step 4: Tag milestones

- Monthly close: `git tag close/2026-03`
- Quarterly close: `git tag close/2026-Q1`
- Year-end close: `git tag close/2026`
- Tax filing: `git tag tax/gst-2026-Q1`

### Step 5: Report

Show: commit hash, files changed, tag (if any).

## Constraints

- NEVER commit without validation passing
- NEVER force-push or rewrite history on financial data
- ALWAYS use descriptive commit messages
- ALWAYS tag period closes
