# cfo-stack — Agent Instructions

> Note: `AGENTS.md` is the high-order instruction file for CFO Stack. `CLAUDE.md` is a symlink to this file, so update `AGENTS.md` when repo-level agent behavior changes materially. Keep it lean. Move domain-heavy or workflow-heavy guidance into `./.agents/skills/*` and keep setup behavior aligned with [skills/setup/SKILL.md](skills/setup/SKILL.md).

AI-powered accounting, bookkeeping, and tax planning using the C.L.E.A.R. system and Beancount.

## Scope

`AGENTS.md` should stay short and stable.

Keep only:

- repository operating rules
- hard product constraints
- links to detailed references, charters, workflows, and skills

## Instruction Order

1. Root `AGENTS.md` for repo-wide rules
2. Repo-local skills under `.agents/skills/` for repeatable workflows
3. Repo-local charter and supporting references under `.agents/`
4. Command-specific behavior under `skills/*/SKILL.md`

## Canonical References

Use these files instead of expanding this root guide:

- `./.agents/charters/product-charter.md`
  Product thesis, goals, AI-first accounting philosophy, and non-deterministic workflow direction
- `./.agents/skills/cfo-ledger-ops/SKILL.md`
  Canonical workflow, Beancount conventions, and ledger layout guidance
- `./.agents/skills/cfo-setup-governance/SKILL.md`
  Setup and uninstall semantics, onboarding intake, and host registration expectations
- `./.agents/skills/cfo-chrome-download-statements/SKILL.md`
  Browser-assisted statement export workflow
- `skills/*/SKILL.md`
  Command-specific instructions that should not live here

## Global Rules

1. Never invent tax rules or statutory rates. Only compute from provided jurisdiction packs.
2. Never claim compliance. Produce traceable data packets; a licensed professional confirms compliance.
3. Propose diffs only. AI suggests entries; a human approves before committing to the ledger.
4. Run `bean-check` after every ledger change and before every commit.
5. Show a diff for every ledger mutation. No silent changes.
6. Flag transactions at or above the configured large-transaction threshold for human confirmation.
7. Never modify reconciled transactions without explicit approval.
8. Always include tax treatment for transactions when applicable.
9. Commit every meaningful approved change via `/snapshot`.
10. During setup or onboarding, ask blocking intake questions when scope is unclear.
    Do not guess template-driving answers.
11. Do not require deterministic capture, classification, or posting as a product goal.
    CFO Stack may use non-deterministic, human-reviewed AI workflows for accounting decisions.
12. For browser-assisted statement downloads, prefer the repo-local skill
    `./.agents/skills/cfo-chrome-download-statements/SKILL.md` over deterministic helper scripts.

## Key Slash Skills

Primary entry points:

- `/cfo` — front door and router
- `/setup` — initialize a new ledger
- `/statement-export` or `/statement-export-private` — get raw files onto disk
- `/capture` — inventory and preprocess raw files
- `/classify`, `/reconcile`, `/validate` — operate the working ledger
- `/report`, `/audit`, `/snapshot` — review, validate, and persist meaningful changes

Detailed workflow and command-specific behavior belongs in `skills/*/SKILL.md`, not here.

## Placement Rules

- Stable repository policy belongs in `AGENTS.md`.
- Product thesis and architectural direction belong in `./.agents/charters/`.
- Repeatable repo workflows belong in `./.agents/skills/`.
- Command-specific operating instructions belong in `skills/*/SKILL.md`.
- If a document starts behaving like a workflow, spec, or playbook, move it out of `AGENTS.md`.
