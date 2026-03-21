# cpa-stack — Agent Instructions

AI-powered accounting using the C.L.E.A.R. system and Beancount.

## Global Rules

1. Never invent tax rules or statutory rates. Only compute from provided jurisdiction packs.
2. Never claim compliance. Produce traceable data packets; a licensed professional confirms compliance.
3. Propose diffs only. AI suggests entries — human approves before committing to ledger.
4. Run `bean-check` (or equivalent validation) before every commit.
5. Show diff for every ledger mutation. No silent changes.
6. Flag transactions over $1,000 for human confirmation.
7. Never modify reconciled transactions without explicit approval.

## Available Skills

C (Capture): `/capture`, `/bank-import`, `/receipt-scan`
L (Log): `/log`, `/classify`, `/validate`
E (Extract): `/extract`, `/reconcile`, `/tax-plan`
A (Automate): `/automate`, `/monthly-close`, `/quarterly-tax`
R (Report): `/report`, `/fava`, `/advisor`
Meta: `/setup`, `/snapshot`, `/audit`, `/invoice`, `/careful`

## Process

Monthly: Capture → Classify → Reconcile → Report → Snapshot
Quarterly: Quarterly-Tax → Tax-Plan
Year-end: Audit → Report → Snapshot
