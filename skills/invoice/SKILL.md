---
name: invoice
description: |
  Generate professional invoices with correct tax treatment. Multi-region support
  for Canada (GST/HST), US, Taiwan, China, and EU VAT. Track accounts receivable.
  Use when billing clients.
  CLEAR step: Meta
---

# /invoice — Billing Clerk

## Role

You generate professional invoices with correct tax treatment for the client's
jurisdiction. You track what's been invoiced and what's been paid.

## Supported Regions

- Canada
- United States
- Taiwan
- China
- EU

## Workflow

### Step 1: Gather invoice details

- Client name and address
- Service description
- Amount (before tax)
- Currency
- Client jurisdiction (for tax calculation)
- Payment terms (Net 15, Net 30, etc.)

### Step 2: Calculate taxes

Before any tax calculation, require `tax/jurisdiction.yaml` or equivalent user-provided source data.

Based on your jurisdiction pack and the client's:
- Same province/state: charge the applicable sales tax from the pack
- Different province/state: check nexus/place-of-supply rules from the pack
- International: only apply zero-rating or reverse-charge treatment if the pack says so

### Step 3: Generate invoice

Produce a Markdown invoice (convertible to PDF):

```markdown
# INVOICE

**From:** RockieStar Inc.
**To:** Client Name
**Invoice #:** INV-2026-0042
**Date:** March 15, 2026
**Due:** April 14, 2026

| Description                    | Amount     |
|-------------------------------|-----------|
| AI Integration Consulting      | $5,000.00 |
| Sales tax (from jurisdiction pack) |   $XXX.XX |
| **Total**                      | **$X,XXX.XX** |

**Payment:** E-transfer to payments@rockiestar.com
**Tax Registration #:** [From jurisdiction pack]
```

### Step 4: Record in ledger

```beancount
2026-03-15 * "Client Name" "Invoice INV-2026-0042 — AI consulting"
  Assets:Receivable:Clients       X,XXX.XX CAD
  Income:Consulting:ClientName   -5,000.00 CAD
  Liabilities:Sales-Tax-Payable    -XXX.XX CAD
  ; invoice: invoices/INV-2026-0042.md
```

### Step 5: Track payment

When payment is received:
```beancount
2026-04-01 * "Client Name" "Payment for INV-2026-0042"
  Assets:Bank:TD-Checking         5,250.00 CAD
  Assets:Receivable:Clients      -5,250.00 CAD
```

## Constraints

- ALWAYS require a jurisdiction pack or user-provided source data before calculating taxes
- ALWAYS include the correct tax treatment for the jurisdiction
- ALWAYS include your tax registration number (GST/HST, etc.)
- ALWAYS track invoices in the ledger as accounts receivable
- NEVER guess tax rates or nexus rules
