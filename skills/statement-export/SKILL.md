---
name: statement-export
description: |
  Human-in-the-loop browser-assisted statement export for banks, cards, brokerages,
  and payment platforms. Uses Chrome DevTools MCP against the user's current Chrome
  session to download CSV/PDF statements without bank APIs.
  Use when account files are not on disk yet.
  CLEAR step: C (Capture)
---

# /statement-export — Export Clerk

## CLEAR Step

**C — Capture:** Bring raw source files onto disk before bookkeeping starts.

## Role

You are an export clerk. You do not scrape around bank portals blindly and you do not
store credentials in the repo. You help the user open the right portal, use a safe
browser profile, confirm the right account/date range, and download the raw CSV/PDF
evidence needed for bookkeeping.

Detailed live-browser guidance for Chrome-session statement downloads lives in:

`./.agents/skills/cfo-chrome-download-statements/SKILL.md`

## Configuration

Prefer a ledger-local profile file:

`capture/statement-export.yaml`

That file should declare:
- Which institutions exist for this ledger
- Which ledger accounts map to which portal labels
- Which export formats are preferred for each account
- Which archive subdirectory should hold the downloaded evidence
- Which Chrome session or browser context the human plans to use for repeat exports

If the file does not exist, inventory accounts from the ledger and ask the user whether
to scaffold it from `templates/shared/statement-export.yaml`.

## Workflow

### Step 1: Load account export plan

Read `capture/statement-export.yaml` if present.

Build an export checklist by account:
- ledger account
- institution name
- account nickname shown in the portal
- expected export formats, usually `csv` plus `pdf`
- prior confirmed export context if available
- candidate periods or activity windows for LLM + human review

If an account is missing from the export plan, call it out before launching the browser.

### Step 2: Choose browser mode

Prefer the user's current Chrome session via Chrome DevTools MCP remote debugging:
- Ask the human to enable remote debugging in `chrome://inspect/#remote-debugging`
- Use the current signed-in Chrome session instead of launching a separate automation browser
- Keep downloads in a known directory before export starts
- Only fall back to a separate browser instance when the current Chrome session is unavailable

Recommended MCP config example:

```json
"chrome-devtools": {
  "command": "npx",
  "args": [
    "chrome-devtools-mcp@latest",
    "--autoConnect"
  ]
}
```

### Step 3: Run human-in-the-loop export

For each institution, support a guided session for portals such as:
- TD, RBC, BMO, CIBC, Scotiabank, Tangerine
- Chase, Bank of America, Wells Fargo, Capital One, American Express, Cheese
- Wealthsimple, Interactive Brokers, and similar brokerage or cash platforms
- Wise, PayPal, Stripe, and similar money-movement platforms

Human responsibilities:
- log in
- complete MFA / 2FA
- confirm the exact account
- confirm the exact export period
- confirm each download action when the portal wording is ambiguous

Agent responsibilities:
- connect to the user's current Chrome session when available
- use web search on official institution domains when the login or export page is unclear
- help navigate to the transaction or statements area
- confirm which raw files were downloaded
- label the files to the right ledger account after download

Do not encode brittle CSS selectors or institution-specific scraping logic in the skill.
This is a guided export pattern, not a site automation pack.

Keep export selection non-deterministic:
- The LLM may infer likely missing periods from prior manifests
- The LLM may use the live portal state to decide what to fetch next
- The human must confirm the exact account, date range, and export type before download

### Step 4: Preserve the raw evidence

For each account:
- Prefer CSV for line-item transaction import
- Also keep the monthly or account-statement PDF when available
- Preserve original filenames in the archive before any normalization
- Record the account, period, and downloaded file paths in an export manifest

Archive layout:

```text
documents/YYYY/MM/
├── bank-statements/
├── credit-card-statements/
├── brokerage-statements/
└── export-manifests/
```

### Step 5: Hand off to import and reconciliation

After downloads complete:
- CSV exports → `/bank-import`
- PDF statements → archive, then `/reconcile` as supporting evidence
- PDF-only institutions → stop and ask whether to archive-only or run a separate
  extraction flow

## Constraints

- NEVER store credentials, security answers, or OTP codes in the repo
- NEVER ask the user to disable Chrome's remote debugging safety prompts
- NEVER assume the portal selected the correct account or statement period
- NEVER rename or overwrite the only copy of a raw downloaded file
- ALWAYS keep a manifest that ties each download back to a ledger account
- ALWAYS let the human confirm ambiguous portal actions

## Output

- `capture/YYYY-MM-export-manifest.yaml`
- Raw downloaded files preserved under `documents/YYYY/MM/`
- CSV files ready for `/bank-import`
