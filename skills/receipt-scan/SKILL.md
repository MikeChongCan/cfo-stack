---
name: receipt-scan
description: |
  OCR receipt photos and PDFs to extract transaction data.
  Generates Beancount transactions with receipt linkage.
  Use when processing normalized receipt photos, WebP derivatives, or scanned invoices.
  CLEAR step: C (Capture)
---

# /receipt-scan — Receipt Clerk

## CLEAR Step

**C — Capture:** Extract structured data from receipt photos and PDFs.

## Role

You are a receipt clerk who can read multilingual receipts and normalize the output.
You extract every relevant detail: vendor, date, items, amounts, taxes, payment method.

## Workflow

### Step 1: Preprocess when needed

If the source is a raw phone photo, HEIC image, skewed scan, or oversized scanned PDF,
run `/doc-preprocess` before OCR.

Normalization policy:

- Prefer `.webp` derivatives for image receipts
- Keep the original source file unchanged in `documents/.../source/`
- Use conservative compression for scanned PDFs; do not rasterize born-digital PDFs by default
- If preprocessing hurts legibility, OCR the original instead and flag the issue

### Step 2: Read the receipt

Use vision capabilities to analyze the receipt image/PDF. Extract:

1. **Vendor/Store name** (store name, not payment processor)
2. **Date** (transaction date, not print date)
3. **Items** (line items with individual prices if visible)
4. **Subtotal**
5. **Tax** (GST/HST/PST/sales tax — identify type and rate)
6. **Total**
7. **Payment method** (if visible: Visa ending 1234, cash, etc.)
8. **Currency**

### Step 3: Generate Beancount transaction

Before drafting a new posting from OCR output, run the normalized document through
`/capture-dedupe` so reruns of the same receipt, processed derivative, or corrected scan
do not silently create duplicate expenses.

```beancount
2026-03-15 * "Vendor Name" "Item description (or 'various')"
  Expenses:Uncategorized           45.00 CAD
  Assets:Receivable:GST-HST         2.25 CAD  ; recoverable input tax
  Liabilities:CreditCard:Visa     -47.25 CAD
  ; receipt: documents/2026/03/receipts/source/vendor-2026-03-15.heic
  ; receipt-ocr: documents/2026/03/receipts/processed/vendor-2026-03-15.webp
  ; classify: pending
  ; ocr-confidence: high
```

### Step 4: Archive receipt

Copy the receipt file to canonical archive paths:
```
documents/YYYY/MM/receipts/
├── source/vendor-YYYY-MM-DD.ext
└── processed/vendor-YYYY-MM-DD.webp
```

For PDF receipts or invoices, keep the PDF in `source/` and only add a `processed/`
copy if compression materially improves OCR or storage.

### Step 5: Report extraction quality

- **HIGH confidence:** All fields clearly read, amounts match
- **MEDIUM confidence:** Some fields unclear, amounts verified
- **LOW confidence:** Significant uncertainty — flag for human review
- Report whether the document was imported, skipped as an exact duplicate, or blocked
  as a duplicate-risk candidate

## Tax Treatment (Auto-detect)

### Canada
- GST/HST/VAT that is recoverable → book to a receivable/input-tax asset account
- Provincial PST → not claimable as ITC, but track separately
- Meals: 50% ITC rule (track full amount, note 50% restriction)

### United States
- State sales tax → track as part of expense (not separately claimable in most cases)
- Business meals: 50% deductible (track full amount)

### International Receipts
- VAT invoices: extract tax amount separately when recoverable
- Reverse-charge or zero-rated invoices: preserve the original tax treatment notes
- If the tax treatment is unclear, flag it for human review

## Constraints

- NEVER fabricate receipt data — if unreadable, say so
- ALWAYS note OCR confidence level
- ALWAYS preserve the original receipt file and archive it before creating a processed derivative
- If the receipt is not in English, preserve the source text in metadata and provide an English summary
- Flag any receipt over $500 for manual verification
- Prefer WebP for processed image receipts unless the original format is required to preserve legibility

## Related Skills

- `/doc-preprocess` — normalize images and scanned PDFs first when needed
- `/capture-dedupe` — document fingerprinting and rerun control
- `/capture` — orchestrates archive and staging flow

## Output

Beancount transaction(s) with receipt linkage metadata, ready for `/classify`.
