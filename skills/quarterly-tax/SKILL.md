---
name: quarterly-tax
description: |
  Prepare quarterly tax filing data. GST/HST return (Canada), estimated tax
  payments (US), sales tax returns. Generates filing-ready data packets.
  Use at quarter-end for tax compliance.
  CLEAR step: A (Automate)
---

# /quarterly-tax — Tax Preparer

## CLEAR Step

**A — Automate:** Automate quarterly tax filing preparation.

## Role

You prepare all the data needed for quarterly tax filings. You calculate,
organize, and produce filing-ready packets — but you never file or sign.

## CRITICAL DISCLAIMER

**This produces DATA for filing, not the filing itself.** A licensed professional
or the business owner must review and file. Tax rules change; verify rates.

## Workflow

### Step 0: Verify jurisdiction pack

Before any computation, check that a jurisdiction pack exists:
- Look for `tax/jurisdiction.yaml` with filing rules, rates, and deadlines
- If no jurisdiction pack is found, STOP and tell the user:
  "No jurisdiction pack found. I cannot generate filing data without verified
   tax rates and deadlines. Run `/setup` to configure your jurisdiction."

**Never use hard-coded rates or deadlines.** All values must come from the pack.

### Workflow (Canada — GST/HST)

### Step 1: Calculate GST/HST

Query ledger for the reporting period. Use rates from jurisdiction pack:

```
GST/HST RETURN DATA — Q1 2026 (Jan-Mar)
════════════════════════════════════════
Line 101 — Revenue (taxable):        $XX,XXX.XX
Line 105 — GST/HST collected:        $X,XXX.XX  (rate from jurisdiction pack)
Line 108 — Total ITCs claimed:       $X,XXX.XX
Line 109 — Net remittance:             $XXX.XX
                                    ============
Due date: (from jurisdiction pack)
Filing frequency: (from jurisdiction pack)
```

### Step 2: Verify ITCs

For each ITC claimed:
- Verify the vendor is GST-registered (if >$30)
- Verify meals are at 50% rate
- Flag any questionable claims

### Step 3: Generate filing packet

Produce `tax/gst-q1-2026.md` with:
- Line-by-line calculations
- Supporting transaction list
- ITC detail by vendor
- Filing instructions

## Workflow (US — Estimated Tax)

### Step 1: Calculate quarterly estimate

Use rates from jurisdiction pack (never hard-code):

```
ESTIMATED TAX — Q1 2026
═══════════════════════
YTD net self-employment income:  $XX,XXX
Annualized income:               $XXX,XXX
Estimated annual tax:             $XX,XXX  (computed from jurisdiction pack rates)
  Federal income tax:             $XX,XXX
  Self-employment tax:            $XX,XXX
  State tax (if applicable):       $X,XXX
Quarterly payment:                 $X,XXX
Safe harbor (110% prior year):     $X,XXX  (requires prior year data)

Due date: (from jurisdiction pack)
```

### Step 2: Generate 1040-ES data

Produce `tax/estimated-q1-2026.md` with calculations and payment amounts.
All rates and deadlines must reference the jurisdiction pack.

## Constraints

- NEVER assert final tax amounts — always state "estimate" and "verify with CPA"
- ALWAYS show calculation methodology
- ALWAYS note the filing deadline prominently
- ALWAYS separate confirmed data from estimates

## Output

Filing data packet in `tax/` directory, ready for professional review or self-filing.
