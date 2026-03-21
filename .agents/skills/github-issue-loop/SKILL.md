---
name: github-issue-loop
description: Use when executing cpa-stack GitHub issue or PR work with gh, including issue intake, issue claiming, durable progress comments, status labels, validation, commit or push, and final state reporting that avoids duplicate parallel work.
---

# GitHub Issue Loop

Use this skill for cpa-stack issue and PR execution through the GitHub CLI.

## Load First

1. Repository root [AGENTS.md](../../../AGENTS.md)
2. Relevant skill files under `skills/` for the surface you are changing
3. `README.md` and `PLAN.md` when the issue affects published repo contracts

## Operating Contract

- GitHub Issues are the canonical work tracker.
- Use `gh` for GitHub operations unless there is a clear reason not to.
- Default shipping path is direct commit and push to `main`.
- Keep scope tight. If you discover adjacent worthwhile work, open a follow-up issue instead of broadening the active one.
- When behavior, docs, or operator workflow changes, update the corresponding docs in the same loop.
- Use one durable issue comment as the workpad and keep editing or replacing that same comment instead of scattering updates.
- Never mark work ready, done, or pushed with failing local validation.

## Parallel-Safety Rule

Before writing code, check whether the issue is already being worked:

1. Read the full issue, including comments and linked references.
2. Check the current labels, assignees, linked PRs, and recent activity.
3. Search for open PRs that reference the issue number.
4. If there is an active owner, current `status:in-progress`, or an open PR that already covers the scope, do not duplicate the effort.

If duplicate work risk exists:

- leave a short comment describing the overlap
- switch the issue to `status:blocked` only if you cannot proceed without a decision
- otherwise stop and let the current owner continue

## Status Labels

Use these labels for work state:

- `status:todo`
- `status:in-progress`
- `status:blocked`
- `status:human-review`
- `status:merge`
- `status:done`

If these labels do not exist yet, create them first with `gh label create`.

Suggested colors:

- `status:todo` -> `#cfd3d7`
- `status:in-progress` -> `#fbca04`
- `status:blocked` -> `#d93f0b`
- `status:human-review` -> `#5319e7`
- `status:merge` -> `#0e8a16`
- `status:done` -> `#1d76db`

Always keep exactly one `status:*` label on an active issue.

## Required Flow

1. Read the issue or PR fully.
2. Confirm there is no active overlapping work.
3. Claim the issue:
   - assign yourself if appropriate
   - replace any prior `status:*` label with `status:in-progress`
   - leave one durable workpad comment before coding
4. Confirm baseline behavior before changing code.
5. Implement the smallest change that satisfies the issue.
6. Update affected docs, skill contracts, or reference files before validation if behavior changed.
7. Run relevant local validation.
8. Commit and push to `main` by default unless the user explicitly requested local-only completion.
9. Update the durable issue comment with validation results, commit hash, and final state.
10. Move the issue to:
   - `status:blocked` when a real blocker remains
   - `status:human-review` when code is pushed and waiting on review
   - `status:done` when merged or otherwise fully complete in direct-to-main flow

## Repo Validation Matrix

Run the checks that match the changed surface:

- Ledger or template `.beancount` changes:
  - `uvx --from beancount bean-check <affected-ledger>`
- `README.md`, `PLAN.md`, `AGENTS.md`, `skills/`, or `docs/` changes:
  - `npm --prefix docs ci`
  - `npm --prefix docs run check`
- Setup or helper-script changes:
  - run the directly affected command path or smoke test it locally
- If you change issue automation or GitHub workflow logic:
  - verify the exact `gh` commands against the live repo state before closing the issue

Do not claim validation passed unless the commands actually ran.

## Durable Comment Template

Reuse a single comment when possible.

```md
## CPA Stack Workpad

- Scope: <one sentence>
- Owner: <agent or username>
- Branch: <main|branch-name>
- Status: <planning|implementing|blocked|ready-for-review|done>

### Plan

- [ ] Confirm baseline
- [ ] Implement scoped change
- [ ] Validate locally
- [ ] Commit and push
- [ ] Update issue state

### Validation

- [ ] `uvx --from beancount bean-check ...` if ledger or template files changed
- [ ] `npm --prefix docs ci` if docs or skill contracts changed
- [ ] `npm --prefix docs run check` if docs or skill contracts changed
- [ ] Changed-surface smoke checks

### Notes

- <key finding, blocker, or follow-up issue number>
```

## Helpful gh Commands

Issue intake and state:

```bash
gh issue view <number> --repo MikeChongCan/cfo-stack --comments
gh issue edit <number> --repo MikeChongCan/cfo-stack --add-label status:in-progress
gh issue edit <number> --repo MikeChongCan/cfo-stack --remove-label status:todo
gh issue comment <number> --repo MikeChongCan/cfo-stack --body-file /tmp/workpad.md
```

Duplicate-effort checks:

```bash
gh pr list --repo MikeChongCan/cfo-stack --state open --search "<number> in:title,<number> in:body"
gh issue view <number> --repo MikeChongCan/cfo-stack --json labels,assignees,comments,title,body
```

Status-label creation:

```bash
gh label create status:in-progress --repo MikeChongCan/cfo-stack --color fbca04 --description "Actively being implemented"
```

## Blocked Rule

Use `status:blocked` only for real blockers:

- missing credentials or permissions
- unresolved product or accounting decision
- broken external dependency or CI environment you cannot repair from the repo
- overlapping owner already implementing the same scope

When blocked, leave a short durable update with:

- the blocker
- why it prevents completion
- the exact action needed to unblock

## Exit Criteria

The loop is complete only when:

- scope is implemented or explicitly blocked
- relevant local validation passed
- durable GitHub status is updated
- the issue has the correct final `status:*` label
- duplicate parallel work risk has been cleared
