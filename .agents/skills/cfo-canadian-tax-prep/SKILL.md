---
name: cfo-canadian-tax-prep
description: Use when preparing Canadian tax review packets for T4 employment income, rental income, sole proprietorships, corporations, GST/HST, payroll, or slip season. Anchors the workflow in CRA source pages, uses Taxtips only for secondary checklist ideas, and produces human-review tax prep packages instead of compliance claims.
---

# CFO Canadian Tax Prep

Use this skill when the task involves Canadian tax preparation work such as:

- T4 slip driven personal returns
- rental income workpapers and T776 support
- year-end prep for a Canadian sole proprietor or CCPC
- T1/T2125 support packages for self-employed operators
- T2 prep packages, GIFI mapping, or corporate year-end checklists
- GST/HST return support, ITC support, or filing-deadline verification
- payroll remittance, T4 season, or dividend and slip prep review

Do not use this skill to invent rates, make filing decisions without source support, claim compliance, or drift into credit-optimization work unless the user explicitly asks for it.

## Guardrails

- Treat all outputs as review packets for the owner or licensed tax professional.
- Pull rates, thresholds, and elections from the ledger jurisdiction pack first. Use CRA pages to verify obligation type, form, and timing.
- Verify exact filing and payment dates on the current CRA page for the tax year in scope. Do not rely on memory.
- Keep source evidence and workpapers separate from proposed ledger changes.
- Use `references/taxtips-source-map.md` only as a secondary checklist and edge-case finder. If Taxtips and CRA wording differ, follow CRA.
- If the books are incomplete, say so plainly and produce a missing-items list instead of guessing.

## Workflow

### 1. Classify the filer before doing any tax work

Start by pinning down:

- entity type: sole proprietorship, partnership, or corporation
- tax year or fiscal period
- province or territory of operations
- registered accounts in scope: GST/HST, payroll, import/export, etc.
- whether the package is for planning, quarter-end, or year-end filing prep

If any of those are unclear and they change the form set, stop and ask.

### 2. Load the authoritative source set

Read the source map in `references/cra-source-map.md` and use the smallest relevant subset:

- T4 / employment income work: T4 slip page, line mapping, due dates
- rental work: T4036, T776, rental expense guidance, due dates
- self-employed/T1/T2125 work: T4002, T2125, personal due dates, business records
- corporation/T2 work: T4012, T2 filing due dates, balance-due day, GIFI
- GST/HST work: RC4022 and GST/HST filing deadline pages
- payroll/slip work: T4001 and RC4120

Then use `references/taxtips-source-map.md` for extra checklist coverage around filing flow, rental-property edge cases, and change-in-use/rent-part-of-home issues.

Use CRA pages for obligations and dates. Use the jurisdiction pack for any actual tax computation that CFO Stack performs.

### 3. Build the prep packet from evidence, not from forms

Collect or confirm:

- T4 slips and any other income slips already issued
- notice of assessment and installment reminders
- year-end summary of employment benefits, reimbursements, and deductions if the slips look incomplete
- rental income ledger or rent roll by property
- rental property invoices, mortgage-interest summaries, property tax bills, insurance, utilities, and repairs
- year-end trial balance or ledger export
- bank, credit card, and loan reconciliations
- sales detail and invoice support
- payroll reports, remittance confirmations, and prior slips
- fixed asset additions/disposals with invoice support
- shareholder loan continuity, dividend resolutions, and owner draws
- GST/HST working papers for collected tax, ITCs, and adjustments
- vehicle logs, home-office support, and other mixed-use allocations where relevant
- prior-year notices of assessment, reassessment, and installment reminders

If the source trail is weak, produce a blocker list before preparing any tax summary.

### 4. Map the obligation set

For a personal return driven by employment and rental activity, usually prepare around:

- T1 due date and balance-due check
- T4 slip review mapped to line 10100 and related pension/EI boxes
- rental income summary with T776 support
- property-level expense allocation and personal-use split if part of the home is rented
- CCA review only if relevant and only with an explicit note about downstream implications

For self-employed individuals, usually prepare around:

- T1 filing deadline and payment check
- T2125 for each business or professional activity
- GST/HST return support if registered
- installment review if payments are required
- home office, motor vehicle, and CCA support where applicable

For corporations, usually prepare around:

- T2 return package for the fiscal period
- balance-due check and installment history
- GIFI-ready balance sheet and income statement mapping
- shareholder loan, dividend, and compensation review
- GST/HST and payroll support
- T4 or T5 slip season support if compensation or dividends were paid

Do not assume every item applies. Mark each as `required`, `not applicable`, or `needs confirmation`.

### 5. Build workpapers in the order that catches errors fastest

Preferred order:

1. Slip completeness: confirm the return has the expected T4 and other core slips before drafting anything
2. Employment income mapping: reconcile T4 boxes to the T1 line mapping and note any missing explanations
3. Rental income completeness: reconcile rents received to leases, deposits, and property-level tracking
4. Expense support: confirm rental, business, or mixed-use expenses with receipts and purpose
5. Cash and liability completeness: reconcile banks, credit cards, loans, payroll liabilities, and sales-tax liabilities
6. Fixed assets and CCA: separate capital items from current expenses and preserve CCA support
7. Owner/shareholder flows: classify draws, reimbursements, wages, dividends, and shareholder-loan activity
8. Filing overlays: only after the books tie out, prepare the T1/T776/T2125, T2/GIFI, GST/HST, or payroll packet

This avoids doing form work on top of dirty books.

### 6. Flag the Canadian risk areas explicitly

Always call out:

- missing or inconsistent T4 slips
- T4 boxes that imply follow-up support is needed for benefits, CPP, or EI handling
- rental expenses that look capital rather than current
- personal-use allocation issues for partial-home rentals
- change-in-use facts that may trigger separate review
- mixed personal/business expenses
- missing GST/HST registration or incorrect ITC support
- weak vehicle logbooks or home-office support
- owner compensation misclassification
- unreconciled shareholder loans
- capital assets expensed directly without CCA review
- late remittances, slips, or installment exposure
- province-specific payroll or corporate filing assumptions that need confirmation

### 7. Produce a review packet, not a filing claim

Preferred output structure:

```text
tax/canada/<tax-year>/
  overview.md
  obligations-checklist.md
  missing-items.md
  workpapers/
    employment-income.md
    revenue-reconciliation.md
    gst-hst.md
    payroll.md
    rental-income.md
    fixed-assets.md
    owner-shareholder-flows.md
  filing/
    t1-income-summary.md
    t776-rental-summary.md
    t1-t2125-summary.md
    t2-gifi-summary.md
    slips-summary.md
```

Each summary should separate:

- confirmed facts from the books
- assumptions that need sign-off
- proposed treatments
- exact CRA pages used to support the workflow

## Output Standard

Every Canadian tax prep deliverable should end with:

- `Open questions`
- `Missing support`
- `Deadlines to verify on CRA`
- `Items for CPA/bookkeeper review`

Never end with “ready to file” unless a human reviewer explicitly confirmed that status.
