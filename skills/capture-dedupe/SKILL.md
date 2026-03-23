---
name: cfo-capture-dedupe
description: |
  Enforce import idempotency and duplicate-source detection across repeated capture runs.
  Fingerprints files, rows, and derived documents so reruns skip exact duplicates, corrected
  reimports are explicit, and duplicate-risk findings surface in import logs and validation.
  Use before staging entries from /cfo-capture, /cfo-bank-import, /cfo-receipt-scan, or /cfo-doc-preprocess.
  CLEAR step: C (Capture)
---

# /cfo-capture-dedupe — Import Provenance Clerk

## CLEAR Step

**C — Capture:** Prevent repeated evidence from being imported twice.

## Role

You are the provenance clerk for every capture workflow. You keep a durable record
of what source files, rows, and derived documents were already processed so repeat
runs stay deterministic instead of silently duplicating the books.

## When To Use

Run this skill before appending anything to staging from:

- `/cfo-capture`
- `/cfo-bank-import`
- `/cfo-doc-preprocess`
- `/cfo-receipt-scan`

## Workflow

### Step 1: Build canonical fingerprints

Create deterministic fingerprints at the right level:

1. **Source file fingerprint**
   - `sha256`
   - byte size
   - normalized file type
   - page count when relevant
2. **Statement row fingerprint**
   - source file fingerprint
   - normalized statement date
   - normalized payee
   - amount
   - currency
   - source account
   - source row number when available
3. **Document transaction fingerprint**
   - source file fingerprint
   - vendor
   - transaction date
   - total
   - currency
   - normalized document kind (`receipt`, `invoice`)

Normalize text before hashing:

- trim whitespace
- collapse repeated spaces
- uppercase payees and vendor names
- strip obvious statement reference numbers when they are not part of the merchant identity

### Step 2: Compare against prior capture history

Use a durable manifest such as:

```text
staging/YYYY-MM-import-manifest.jsonl
```

Each entry should be append-only and include:

- import run timestamp
- operator or agent identifier
- source path
- processed path when one exists
- file fingerprint
- row or document fingerprints
- action taken: `imported`, `skipped-duplicate`, `blocked-duplicate-risk`, `reimport-approved`

### Step 3: Apply deterministic duplicate rules

Handle matches with these defaults:

1. **Exact file rerun**
   - same file fingerprint as a prior successful run
   - default action: skip and report as already processed
2. **Exact row rerun**
   - same row fingerprint as a prior imported row
   - default action: skip and report as duplicate
3. **Corrected source reimport**
   - same statement period or document identity, but different file fingerprint
   - default action: stop and require explicit override before restaging
4. **Near duplicate risk**
   - same date and amount with slightly different normalized payee or document wording
   - default action: flag for human review, do not silently dedupe

### Cross-account transfer example

Do not confuse duplicate evidence with two valid sides of one transfer.

Example: a credit card payment can appear in both the checking-account export and the
credit-card export.

Checking account row:

```text
date=2026-03-25
payee=TD VISA PAYMENT
amount=-850.00
currency=CAD
source_account=Assets:Bank:TD-Checking
```

Credit card row:

```text
date=2026-03-25
payee=PAYMENT RECEIVED
amount=-850.00
currency=CAD
source_account=Liabilities:CreditCard:TD-Visa
```

These are **not duplicates**. They are distinct source rows from different source
accounts that should become the two sides of one transfer-aware bookkeeping flow.

Rules:

- same fingerprint from the same source account -> safe duplicate candidate
- same amount and date from different source accounts -> not a duplicate
- cross-account matches should be flagged as transfer-match candidates for later
  logging or reconciliation, not skipped by dedupe

### Step 4: Define the override path

Corrected reimports must be explicit. Require a note in the import log such as:

```text
reimport-approved: true
reimport-reason: corrected bank export with missing rows
supersedes-file-fingerprint: <sha256>
```

When reimport is approved:

- keep the old manifest entry
- add a new manifest entry linked with `supersedes-*`
- report the scope of the replacement clearly

### Step 5: Surface duplicate-risk findings

Every capture run must report:

- new sources imported
- exact duplicates skipped
- corrected reimports requiring approval
- near-duplicate risks requiring review

Write findings into:

```text
staging/YYYY-MM-import-log.md
staging/YYYY-MM-duplicate-risk.md
```

### Step 6: Hand off safely

Only after duplicate handling is complete:

- let `/cfo-bank-import` append new staging entries
- let `/cfo-receipt-scan` generate new postings
- let `/cfo-validate` consume duplicate-risk findings as warnings or errors

## Related Skills

- `/cfo-capture` — master intake orchestration
- `/cfo-bank-import` — statement-row fingerprint source
- `/cfo-doc-preprocess` — processed derivative provenance
- `/cfo-receipt-scan` — document transaction fingerprint source
- `/cfo-validate` — duplicate-risk reporting after capture

## Constraints

- NEVER silently restage the same source file twice
- NEVER discard prior provenance entries when a corrected reimport replaces an older run
- NEVER treat near matches as safe duplicates without review
- ALWAYS preserve original file paths and hashes for auditability
- ALWAYS make reimport overrides explicit in the log

## Output

- append-only import manifest
- duplicate-risk report
- clear import decision per file, row, or document fingerprint
