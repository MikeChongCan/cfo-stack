# CFO Playwright Download Statements

Use this skill when statement files are not on disk yet and the agent needs to guide a
human through downloading CSV or PDF evidence from a bank, credit card, brokerage, or
payment platform website.

## Intent

Keep this workflow LLM-driven and human-in-the-loop:

- The LLM decides how to navigate based on the live site, prior manifests, and user input.
- The human logs in, completes MFA, confirms the correct account, confirms the date range,
  and confirms each ambiguous download action.
- The agent may use Playwright or browser automation tools to open pages, inspect the DOM,
  and assist with navigation.
- The agent should not rely on deterministic site-specific scripts, brittle selector packs,
  or hardcoded month-selection logic.

## Inputs

Prefer ledger-local context when present:

- `capture/statement-export.yaml`
- prior `capture/*-export-manifest.yaml`
- the ledger account map in `main.beancount` or `accounts.beancount`

Use those as context only. They are not a deterministic execution plan.

## Core Rules

1. Use web search when the correct login page, statement page, or export page is unclear.
2. Restrict that search to official institution domains whenever possible.
3. Treat prior manifests as historical context, not as a deterministic rule for "next month".
4. Ask the human to confirm the exact account and date range before any download click.
5. Preserve raw filenames and archive copies before any normalization or import.
6. Never store credentials, OTP codes, security answers, or copied session cookies in the repo.
7. Never point automation at the user's daily browser profile. Use a dedicated profile or an isolated session.

## Workflow

### 1. Build context

Read the configured institutions and accounts, then summarize:

- institution
- ledger account
- preferred export types
- prior confirmed export periods if any
- likely missing periods or activity windows that should be reviewed

This summary is for the LLM and the human. It is not a deterministic instruction set.

### 2. Find the right portal

If `capture/statement-export.yaml` already names the institution, but not the exact login or
export URL, use web search first.

Search policy:

- prefer official domains only
- verify the domain before opening login
- avoid SEO junk, affiliate pages, and support-forum guesses

Good examples:

- `TD Canada Trust business banking login site:td.com`
- `Chase download account activity csv site:chase.com`
- `Interactive Brokers activity statements csv site:interactivebrokers.com`
- `Wealthsimple monthly statement download site:wealthsimple.com`

### 3. Use Playwright as a live assistant

Use Playwright or the available browser tool to:

- open the official login page
- keep the session visible to the human
- inspect page structure after login
- help find likely statement or activity sections
- help identify export controls

Do not assume selectors will stay stable. Re-read the live DOM as needed.

### 4. Keep selection non-deterministic

The LLM may propose likely next exports based on prior manifests, but it must present them as:

- candidate periods
- candidate export types
- candidate account views

The human must confirm:

- correct account
- correct date range
- CSV vs PDF vs both
- whether the portal view is statements, transactions, tax slips, or something else

### 5. Record provenance

After each successful download, record:

- institution
- ledger account
- confirmed period
- export type
- original filename
- saved path
- manifest path

## Output

- raw CSV/PDF statement files downloaded by the human with agent assistance
- an updated export manifest created by the higher-level workflow
- a clear handoff to `/capture`, `/bank-import`, or `/reconcile`

## Anti-Patterns

- hardcoded selectors for a specific institution
- hardcoded month-stepping logic
- assuming the newest statement is always the correct target
- storing login secrets or browser session artifacts in the repo
- silently downloading files without human confirmation
