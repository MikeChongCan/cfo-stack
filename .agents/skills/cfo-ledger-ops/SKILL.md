---
name: cfo-ledger-ops
description: Use when changing CFO Stack ledger conventions, process docs, Beancount metadata rules, or canonical ledger/file layout guidance that should stay out of AGENTS.md.
---

# CFO Ledger Ops

Use this skill when the task touches:

- canonical C.L.E.A.R. workflow guidance
- Beancount account, metadata, or policy conventions
- expected ledger file layout
- monthly, quarterly, or year-end operating sequences
- docs or prompts that describe how CFO Stack ledgers should be structured

## Canonical Workflow

The C.L.E.A.R. cycle is:

Capture -> Log -> Extract -> Automate -> Report

Default operating sequences:

- Monthly: `/capture` -> `/classify` -> `/reconcile` -> `/report` -> `/snapshot`
- If files are not on disk yet: `/statement-export` or `/statement-export-private` -> `/capture`
- Quarterly: `/quarterly-tax` -> `/tax-plan`
- Year-end: `/audit` -> `/report` -> `/snapshot`

Use `/consult` when the user needs cross-model thinking on:

- ambiguous bookkeeping treatment
- tax framing or IRS/CRA interpretation questions
- competing ledger-modeling approaches
- workflow or reporting tradeoffs that benefit from external model comparison

For IRS/CRA questions, anchor the work in official-source text or the jurisdiction pack first.
Model output is review input, not compliance approval.

## Beancount Conventions

- Operating currencies: `CAD`, `USD` unless the ledger says otherwise
- Account hierarchy example: `Assets:Bank:InstitutionName`, `Expenses:Category:Subcategory`
- Policy lookup order: ledger-local `cfo-stack.yaml`, then global `~/.cfo-stack/config.yaml`
- Metadata tags:
  - `classify: auto|confirmed|manual`
  - `receipt: path/to/file`
  - `receipt-ocr: path/to/processed/file`
- Balance assertions are required at monthly close
- Recoverable sales tax belongs in receivable/asset accounts, not expense accounts

## Canonical Ledger Layout

```text
ledger/
├── cfo-stack.yaml
├── capture/
│   └── statement-export.yaml
├── main.beancount
├── accounts.beancount
├── YYYY/
│   ├── MM-transactions.beancount
│   └── MM-reconciliation.beancount
├── prices.beancount
├── tax/
│   └── jurisdiction.yaml
└── rules/
    └── classify-rules.yaml
```

## Editing Guidance

- Prefer updating the most specific slash-skill under `skills/*/SKILL.md` when behavior is command-specific.
- Keep `AGENTS.md` limited to durable repo-wide guardrails and routing hints.
- If a convention becomes detailed enough to need examples or edge cases, keep the detail here or in another repo-local skill instead of expanding `AGENTS.md`.
